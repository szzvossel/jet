use std::time::Duration;

use futures_util::{SinkExt, StreamExt};
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;
use tokio_tungstenite::{connect_async, MaybeTlsStream, WebSocketStream};

use jet_bus::types::{Channel, ClientMessage, ServerMessage};

use crate::error::ClientError;

type WsStream = WebSocketStream<MaybeTlsStream<tokio::net::TcpStream>>;

pub struct Connector {
    url: String,
    reconnect_delay: Duration,
}

impl Connector {
    pub fn new(url: String, reconnect_delay: Duration) -> Self {
        Self {
            url,
            reconnect_delay,
        }
    }

    /// Connect to the WebSocket server.
    async fn connect(&self) -> Result<WsStream, ClientError> {
        let (stream, _response) = connect_async(&self.url)
            .await
            .map_err(|e| ClientError::Connection(e.to_string()))?;
        tracing::info!("Connected to {}", self.url);
        Ok(stream)
    }

    /// Send a subscribe message for the given channels.
    async fn subscribe(
        ws: &mut futures_util::stream::SplitSink<WsStream, Message>,
        channels: &[Channel],
    ) -> Result<(), ClientError> {
        let msg = ClientMessage::Subscribe {
            channels: channels.to_vec(),
        };
        let json = serde_json::to_string(&msg)?;
        ws.send(Message::Text(json.into())).await?;
        Ok(())
    }

    /// Run the connector loop: connect, subscribe, relay messages.
    /// On disconnect, waits and reconnects, re-sending subscriptions.
    pub async fn run(&self, subscriptions: Vec<Channel>, tx: mpsc::Sender<ServerMessage>) {
        loop {
            match self.run_session(&subscriptions, &tx).await {
                Ok(()) => {
                    tracing::warn!("WebSocket session ended cleanly");
                }
                Err(e) => {
                    tracing::error!("WebSocket session error: {e}");
                }
            }

            tracing::info!(
                "Reconnecting in {}ms...",
                self.reconnect_delay.as_millis()
            );
            tokio::time::sleep(self.reconnect_delay).await;
        }
    }

    async fn run_session(
        &self,
        subscriptions: &[Channel],
        tx: &mpsc::Sender<ServerMessage>,
    ) -> Result<(), ClientError> {
        let ws = self.connect().await?;
        let (mut sink, mut stream) = ws.split();

        // Subscribe on connect.
        Self::subscribe(&mut sink, subscriptions).await?;
        let sub_names: Vec<String> = subscriptions
            .iter()
            .map(|c| format!("{c:?}"))
            .collect();
        tracing::info!("Subscribed to: {}", sub_names.join(", "));

        // Read loop.
        while let Some(msg_result) = stream.next().await {
            match msg_result {
                Ok(Message::Text(text)) => {
                    let server_msg: ServerMessage = match serde_json::from_str(&text) {
                        Ok(m) => m,
                        Err(e) => {
                            tracing::warn!("Failed to decode message: {e}");
                            continue;
                        }
                    };

                    if tx.send(server_msg).await.is_err() {
                        tracing::debug!("Receiver dropped, closing session");
                        return Ok(());
                    }
                }
                Ok(Message::Close(_)) => {
                    tracing::info!("Server closed connection");
                    return Ok(());
                }
                Ok(Message::Ping(data)) => {
                    // Respond with pong.
                    let _ = sink.send(Message::Pong(data)).await;
                }
                Err(e) => {
                    return Err(ClientError::Connection(e.to_string()));
                }
                _ => {}
            }
        }

        Ok(())
    }
}
