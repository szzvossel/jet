use std::collections::HashSet;
use std::sync::Arc;

use tokio::sync::{broadcast, RwLock};

use crate::error::BusError;
use crate::metrics::BrokerMetrics;
use crate::types::{Channel, MarketEvent, SessionId};

/// Maximum subscriptions per session.
const MAX_SUBSCRIPTIONS: usize = 64;

/// Broadcast channel capacity (~5 min at 12 events/sec).
const BROADCAST_CAPACITY: usize = 4096;

/// Central broker: publishes events to a broadcast channel, tracks per-session
/// subscriptions in a shared registry.
#[derive(Debug, Clone)]
pub struct Broker {
    tx: broadcast::Sender<MarketEvent>,
    sessions: Arc<RwLock<Vec<SessionEntry>>>,
    pub metrics: Arc<BrokerMetrics>,
}

#[derive(Debug, Clone)]
pub struct SessionEntry {
    pub id: SessionId,
    pub subscriptions: Vec<Channel>,
}

impl Broker {
    pub fn new() -> Self {
        let (tx, _rx) = broadcast::channel(BROADCAST_CAPACITY);
        Self {
            tx,
            sessions: Arc::new(RwLock::new(Vec::new())),
            metrics: Arc::new(BrokerMetrics::new()),
        }
    }

    /// Publish an event to all subscribers.
    pub fn publish(&self, event: MarketEvent) {
        let _ = self.tx.send(event);
        self.metrics.increment_published();
    }

    /// Create a new broadcast receiver for a session's send loop.
    pub fn subscribe_receiver(&self) -> broadcast::Receiver<MarketEvent> {
        self.tx.subscribe()
    }

    /// Register a new session.
    pub async fn register_session(&self, id: SessionId) {
        self.metrics.session_connected();
        let mut sessions = self.sessions.write().await;
        sessions.push(SessionEntry {
            id,
            subscriptions: Vec::new(),
        });
    }

    /// Remove a session.
    pub async fn unregister_session(&self, id: &str) {
        self.metrics.session_disconnected();
        let mut sessions = self.sessions.write().await;
        sessions.retain(|s| s.id != id);
    }

    /// Add subscriptions for a session. Returns the channels that were actually added.
    pub async fn add_subscriptions(
        &self,
        session_id: &str,
        channels: Vec<Channel>,
    ) -> Result<Vec<Channel>, BusError> {
        let mut sessions = self.sessions.write().await;
        let entry = sessions
            .iter_mut()
            .find(|s| s.id == session_id)
            .ok_or_else(|| BusError::SessionNotFound(session_id.to_string()))?;

        if entry.subscriptions.len() + channels.len() > MAX_SUBSCRIPTIONS {
            return Err(BusError::SubscriptionLimit {
                max: MAX_SUBSCRIPTIONS,
            });
        }

        // Collect only new (not already subscribed) channels.
        let existing: HashSet<_> = entry.subscriptions.iter().collect();
        let added: Vec<Channel> = channels
            .into_iter()
            .filter(|c| !existing.contains(c))
            .collect();

        entry.subscriptions.extend(added.clone());
        self.metrics
            .total_subscriptions
            .fetch_add(added.len() as u64, std::sync::atomic::Ordering::Relaxed);

        Ok(added)
    }

    /// Remove subscriptions for a session. Returns the channels that were removed.
    pub async fn remove_subscriptions(
        &self,
        session_id: &str,
        channels: Vec<Channel>,
    ) -> Result<Vec<Channel>, BusError> {
        let mut sessions = self.sessions.write().await;
        let entry = sessions
            .iter_mut()
            .find(|s| s.id == session_id)
            .ok_or_else(|| BusError::SessionNotFound(session_id.to_string()))?;

        let to_remove: HashSet<_> = channels.iter().collect();
        let before = entry.subscriptions.len();
        entry.subscriptions.retain(|c| !to_remove.contains(c));
        let removed = before - entry.subscriptions.len();

        self.metrics
            .total_subscriptions
            .fetch_sub(removed as u64, std::sync::atomic::Ordering::Relaxed);

        Ok(channels)
    }

    /// Get a session's current subscriptions.
    pub async fn get_subscriptions(&self, session_id: &str) -> Option<Vec<Channel>> {
        let sessions = self.sessions.read().await;
        sessions
            .iter()
            .find(|s| s.id == session_id)
            .map(|s| s.subscriptions.clone())
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{EventId, EventKind, EventPayload, PriceTickType};
    use chrono::Utc;

    #[tokio::test]
    async fn test_register_unregister_session() {
        let broker = Broker::new();
        broker.register_session("s1".into()).await;
        assert_eq!(broker.metrics.active_sessions.load(std::sync::atomic::Ordering::Relaxed), 1);

        broker.unregister_session("s1").await;
        assert_eq!(broker.metrics.active_sessions.load(std::sync::atomic::Ordering::Relaxed), 0);
    }

    #[tokio::test]
    async fn test_add_remove_subscriptions() {
        let broker = Broker::new();
        broker.register_session("s1".into()).await;

        let added = broker
            .add_subscriptions(
                "s1",
                vec![
                    Channel::Symbol("SPX".into()),
                    Channel::EventType(EventKind::RiskAlert),
                ],
            )
            .await
            .unwrap();
        assert_eq!(added.len(), 2);

        let subs = broker.get_subscriptions("s1").await.unwrap();
        assert_eq!(subs.len(), 2);

        broker
            .remove_subscriptions("s1", vec![Channel::Symbol("SPX".into())])
            .await
            .unwrap();
        let subs = broker.get_subscriptions("s1").await.unwrap();
        assert_eq!(subs.len(), 1);
    }

    #[tokio::test]
    async fn test_duplicate_subscription_ignored() {
        let broker = Broker::new();
        broker.register_session("s1".into()).await;

        broker
            .add_subscriptions("s1", vec![Channel::Symbol("SPX".into())])
            .await
            .unwrap();
        let added = broker
            .add_subscriptions("s1", vec![Channel::Symbol("SPX".into())])
            .await
            .unwrap();
        assert!(added.is_empty());
    }

    #[tokio::test]
    async fn test_publish_and_receive() {
        let broker = Broker::new();
        let mut rx = broker.subscribe_receiver();

        let event = MarketEvent {
            id: EventId(1),
            timestamp: Utc::now(),
            kind: EventKind::PriceUpdate,
            channel: Channel::Symbol("SPX".into()),
            payload: EventPayload::PriceUpdate {
                symbol: "SPX".into(),
                tick_type: PriceTickType::Last,
                price: 5500.0,
                size: 1000,
            },
        };
        broker.publish(event.clone());

        let received = rx.try_recv().unwrap();
        assert_eq!(received.id, event.id);
    }
}
