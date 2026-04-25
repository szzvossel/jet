use thiserror::Error;

#[derive(Error, Debug)]
pub enum ClientError {
    #[error("websocket connection error: {0}")]
    Connection(String),

    #[error("message decode error: {0}")]
    Decode(#[from] serde_json::Error),

    #[error("tungstenite error: {0}")]
    Tungstenite(#[from] tungstenite::Error),
}
