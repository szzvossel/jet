use std::sync::atomic::{AtomicU64, Ordering};

/// Atomic counters for bus observability.
#[derive(Debug)]
pub struct BrokerMetrics {
    pub events_published: AtomicU64,
    pub events_per_kind: std::sync::Mutex<Vec<(String, u64)>>,
    pub active_sessions: AtomicU64,
    pub total_connections: AtomicU64,
    pub total_subscriptions: AtomicU64,
    pub lag_errors: AtomicU64,
}

impl BrokerMetrics {
    pub fn new() -> Self {
        Self {
            events_published: AtomicU64::new(0),
            events_per_kind: std::sync::Mutex::new(Vec::new()),
            active_sessions: AtomicU64::new(0),
            total_connections: AtomicU64::new(0),
            total_subscriptions: AtomicU64::new(0),
            lag_errors: AtomicU64::new(0),
        }
    }

    pub fn increment_published(&self) {
        self.events_published.fetch_add(1, Ordering::Relaxed);
    }

    pub fn session_connected(&self) {
        self.active_sessions.fetch_add(1, Ordering::Relaxed);
        self.total_connections.fetch_add(1, Ordering::Relaxed);
    }

    pub fn session_disconnected(&self) {
        self.active_sessions.fetch_sub(1, Ordering::Relaxed);
    }

    pub fn snapshot(&self) -> MetricsSnapshot {
        MetricsSnapshot {
            events_published: self.events_published.load(Ordering::Relaxed),
            active_sessions: self.active_sessions.load(Ordering::Relaxed),
            total_connections: self.total_connections.load(Ordering::Relaxed),
            total_subscriptions: self.total_subscriptions.load(Ordering::Relaxed),
            lag_errors: self.lag_errors.load(Ordering::Relaxed),
        }
    }
}

impl Default for BrokerMetrics {
    fn default() -> Self {
        Self::new()
    }
}

#[derive(Debug, Clone, serde::Serialize)]
pub struct MetricsSnapshot {
    pub events_published: u64,
    pub active_sessions: u64,
    pub total_connections: u64,
    pub total_subscriptions: u64,
    pub lag_errors: u64,
}
