use axum::extract::ws::{Message, WebSocket};
use axum::extract::{State, WebSocketUpgrade};
use axum::response::IntoResponse;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::broker::Broker;
use crate::error::BusError;
use crate::topic;
use crate::types::{AppState, ClientMessage, ServerMessage};
use std::sync::Arc;

/// Axum handler: upgrade HTTP to WebSocket.
pub async fn ws_handler(
    ws: WebSocketUpgrade,
    State(state): State<Arc<AppState>>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_socket(socket, state.broker.clone()))
}

async fn handle_socket(socket: WebSocket, broker: Broker) {
    let session_id = Uuid::new_v4().to_string();
    tracing::info!(session_id = %session_id, "WebSocket session connected");

    broker.register_session(session_id.clone()).await;

    let (mut ws_sink, mut ws_stream) = socket.split();
    let mut broadcast_rx = broker.subscribe_receiver();
    let sid = session_id.clone();
    let broker_clone = broker.clone();

    // Spawn the send loop: broadcast receiver → WebSocket sink.
    let send_loop = tokio::spawn(async move {
        loop {
            match broadcast_rx.recv().await {
                Ok(event) => {
                    // Look up current subscriptions for this session.
                    let subs = broker_clone
                        .get_subscriptions(&sid)
                        .await
                        .unwrap_or_default();

                    // If no subscriptions, skip (or deliver everything if subs empty).
                    if !subs.is_empty() && !topic::matches_any(&event, &subs) {
                        continue;
                    }

                    let msg = ServerMessage::Event { event };
                    let json = match serde_json::to_string(&msg) {
                        Ok(j) => j,
                        Err(e) => {
                            tracing::error!("serialize error: {e}");
                            continue;
                        }
                    };
                    if ws_sink.send(Message::Text(json.into())).await.is_err() {
                        break; // client disconnected
                    }
                }
                Err(broadcast::error::RecvError::Lagged(missed)) => {
                    broker_clone.metrics.lag_errors.fetch_add(
                        1,
                        std::sync::atomic::Ordering::Relaxed,
                    );
                    let msg = ServerMessage::Lagged { missed };
                    let json = serde_json::to_string(&msg).unwrap_or_default();
                    if ws_sink.send(Message::Text(json.into())).await.is_err() {
                        break;
                    }
                }
                Err(broadcast::error::RecvError::Closed) => {
                    break;
                }
            }
        }
    });

    // Receive loop: read client messages and dispatch.
    while let Some(msg_result) = ws_stream.next().await {
        match msg_result {
            Ok(Message::Text(text)) => {
                handle_client_text(&broker, &session_id, &text).await;
            }
            Ok(Message::Close(_)) => {
                break;
            }
            Err(e) => {
                tracing::warn!(session_id = %session_id, "WebSocket error: {e}");
                break;
            }
            _ => {} // ignore binary, ping, pong
        }
    }

    send_loop.abort();
    broker.unregister_session(&session_id).await;
    tracing::info!(session_id = %session_id, "WebSocket session disconnected");
}

async fn handle_client_text(broker: &Broker, session_id: &str, text: &str) {
    let client_msg: ClientMessage = match serde_json::from_str(text) {
        Ok(m) => m,
        Err(e) => {
            tracing::warn!("Invalid client message: {e}");
            return;
        }
    };

    match client_msg {
        ClientMessage::Subscribe { channels } => {
            match broker.add_subscriptions(session_id, channels).await {
                Ok(added) => {
                    tracing::debug!(session_id, "Subscribed to {} channels", added.len());
                }
                Err(BusError::SubscriptionLimit { max }) => {
                    tracing::warn!(session_id, "Subscription limit ({max}) exceeded");
                }
                Err(e) => {
                    tracing::warn!(session_id, "Subscribe error: {e}");
                }
            }
        }
        ClientMessage::Unsubscribe { channels } => {
            if let Err(e) = broker.remove_subscriptions(session_id, channels).await {
                tracing::warn!(session_id, "Unsubscribe error: {e}");
            }
        }
        ClientMessage::ListSubscriptions => {
            if let Some(subs) = broker.get_subscriptions(session_id).await {
                tracing::debug!(session_id, "Listing {} subscriptions", subs.len());
            }
        }
        ClientMessage::Ping { client_time } => {
            let _pong = ServerMessage::Pong {
                client_time,
                server_time: chrono::Utc::now(),
            };
            tracing::debug!(session_id, "Ping received");
        }
    }
}
