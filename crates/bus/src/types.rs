use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;

use crate::Broker;

/// Shared application state passed to Axum handlers.
#[derive(Debug)]
pub struct AppState {
    pub broker: Broker,
    pub shutdown: Mutex<Option<tokio::sync::oneshot::Sender<()>>>,
}

/// Unique session identifier.
pub type SessionId = String;

// ---------------------------------------------------------------------------
// Event model
// ---------------------------------------------------------------------------

/// Monotonic event counter.
#[derive(Debug, Clone, Copy, PartialEq, Eq, PartialOrd, Ord, Hash, Serialize, Deserialize)]
pub struct EventId(pub u64);

/// Discriminator for price tick events.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum PriceTickType {
    Last,
    Bid,
    Ask,
}

/// Kinds of market events distributed by the bus.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum EventKind {
    PriceUpdate,
    GreeksUpdate,
    VolSurfaceShift,
    RiskAlert,
    PnlSnapshot,
    MarketSnapshot,
}

/// Subscription channels — clients subscribe to one or more.
#[derive(Debug, Clone, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[serde(tag = "type", content = "value")]
#[serde(rename_all = "snake_case")]
pub enum Channel {
    Symbol(String),
    EventType(EventKind),
    Strategy(String),
    All,
}

/// Payload carried by a market event.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
#[serde(rename_all = "snake_case")]
pub enum EventPayload {
    PriceUpdate {
        symbol: String,
        tick_type: PriceTickType,
        price: f64,
        size: u64,
    },
    GreeksUpdate {
        symbol: String,
        delta: f64,
        gamma: f64,
        vega: f64,
        theta: f64,
        rho: f64,
    },
    VolSurfaceShift {
        symbol: String,
        atm_vol: f64,
        skew: f64,
    },
    RiskAlert {
        message: String,
        severity: String,
    },
    PnlSnapshot {
        total_pnl: f64,
        delta_pnl: f64,
        gamma_pnl: f64,
        vega_pnl: f64,
        theta_pnl: f64,
    },
    MarketSnapshot {
        symbol: String,
        spot: f64,
        bid: f64,
        ask: f64,
        volume: u64,
        implied_vol: f64,
    },
}

/// Top-level event envelope distributed over the bus.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketEvent {
    pub id: EventId,
    pub timestamp: DateTime<Utc>,
    pub kind: EventKind,
    pub channel: Channel,
    pub payload: EventPayload,
}

// ---------------------------------------------------------------------------
// Wire protocol
// ---------------------------------------------------------------------------

/// Messages sent from client to server over WebSocket.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action")]
#[serde(rename_all = "snake_case")]
pub enum ClientMessage {
    Subscribe {
        channels: Vec<Channel>,
    },
    Unsubscribe {
        channels: Vec<Channel>,
    },
    ListSubscriptions,
    Ping {
        #[serde(with = "chrono::serde::ts_seconds")]
        client_time: DateTime<Utc>,
    },
}

/// Messages sent from server to client over WebSocket.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
#[serde(rename_all = "snake_case")]
pub enum ServerMessage {
    Event {
        event: MarketEvent,
    },
    Subscribed {
        channels: Vec<Channel>,
    },
    Unsubscribed {
        channels: Vec<Channel>,
    },
    Subscriptions {
        channels: Vec<Channel>,
    },
    Pong {
        #[serde(with = "chrono::serde::ts_seconds")]
        client_time: DateTime<Utc>,
        #[serde(with = "chrono::serde::ts_seconds")]
        server_time: DateTime<Utc>,
    },
    Error {
        code: String,
        message: String,
    },
    Lagged {
        missed: u64,
    },
}
