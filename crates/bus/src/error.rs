use thiserror::Error;

#[derive(Error, Debug)]
pub enum BusError {
    #[error("session not found: {0}")]
    SessionNotFound(String),

    #[error("subscription limit exceeded (max {max})")]
    SubscriptionLimit { max: usize },

    #[error("invalid channel: {0}")]
    InvalidChannel(String),

    #[error("json error: {0}")]
    Json(#[from] serde_json::Error),

    #[error("websocket error: {0}")]
    Ws(String),

    #[error("generator error: {0}")]
    Generator(String),
}
