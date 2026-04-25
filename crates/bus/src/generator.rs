use std::collections::HashMap;

use chrono::Utc;
use rand::rngs::StdRng;
use rand::{Rng, SeedableRng};
use tokio::sync::oneshot;

use crate::broker::Broker;
use crate::types::{Channel, EventId, EventKind, EventPayload, MarketEvent, PriceTickType};

/// Symbols with base spot prices (mirrors quote_parser::spot_for_symbol).
const SYMBOLS: &[(&str, f64)] = &[
    ("SPX", 5500.0),
    ("SPY", 500.0),
    ("QQQ", 400.0),
    ("IWM", 200.0),
    ("DIA", 400.0),
    ("EEM", 40.0),
    ("SX5E", 5000.0),
];

/// Configuration for the simulated event generator.
#[derive(Debug, Clone)]
pub struct GeneratorConfig {
    /// Interval between event batches (milliseconds).
    pub tick_ms: u64,
    /// Maximum random-walk step as fraction of spot.
    pub step_fraction: f64,
}

impl Default for GeneratorConfig {
    fn default() -> Self {
        Self {
            tick_ms: 1000,
            step_fraction: 0.002,
        }
    }
}

/// Start the simulated event generator. Returns a oneshot sender for shutdown.
pub fn start(broker: Broker, config: GeneratorConfig) -> oneshot::Sender<()> {
    let (shutdown_tx, mut shutdown_rx) = oneshot::channel::<()>();

    // Initialize spot prices.
    let mut spots: HashMap<String, f64> = SYMBOLS
        .iter()
        .map(|(s, p)| (s.to_string(), *p))
        .collect();

    tokio::spawn(async move {
        let mut interval = tokio::time::interval(std::time::Duration::from_millis(config.tick_ms));
        let mut id_counter: u64 = 0;
        let mut rng = StdRng::from_entropy();

        loop {
            tokio::select! {
                _ = interval.tick() => {
                    let idx = rng.gen_range(0..SYMBOLS.len());
                    let (symbol, _base) = SYMBOLS[idx];

                    // Random-walk the spot price.
                    let step = rng.gen_range(-config.step_fraction..config.step_fraction);
                    let current = *spots.get(symbol).unwrap();
                    let new_spot = current * (1.0 + step);
                    spots.insert(symbol.to_string(), new_spot);

                    let spread = new_spot * 0.0002;

                    // Last (trade) tick
                    id_counter += 1;
                    let last_event = MarketEvent {
                        id: EventId(id_counter),
                        timestamp: Utc::now(),
                        kind: EventKind::PriceUpdate,
                        channel: Channel::Symbol(symbol.to_string()),
                        payload: EventPayload::PriceUpdate {
                            symbol: symbol.to_string(),
                            tick_type: PriceTickType::Last,
                            price: new_spot,
                            size: rng.gen_range(100..10000),
                        },
                    };
                    broker.publish(last_event);

                    // Bid tick
                    id_counter += 1;
                    let bid_event = MarketEvent {
                        id: EventId(id_counter),
                        timestamp: Utc::now(),
                        kind: EventKind::PriceUpdate,
                        channel: Channel::Symbol(symbol.to_string()),
                        payload: EventPayload::PriceUpdate {
                            symbol: symbol.to_string(),
                            tick_type: PriceTickType::Bid,
                            price: new_spot - spread,
                            size: rng.gen_range(50..5000),
                        },
                    };
                    broker.publish(bid_event);

                    // Ask tick
                    id_counter += 1;
                    let ask_event = MarketEvent {
                        id: EventId(id_counter),
                        timestamp: Utc::now(),
                        kind: EventKind::PriceUpdate,
                        channel: Channel::Symbol(symbol.to_string()),
                        payload: EventPayload::PriceUpdate {
                            symbol: symbol.to_string(),
                            tick_type: PriceTickType::Ask,
                            price: new_spot + spread,
                            size: rng.gen_range(50..5000),
                        },
                    };
                    broker.publish(ask_event);

                    // Greeks update (simplified)
                    id_counter += 1;
                    let greeks_event = MarketEvent {
                        id: EventId(id_counter),
                        timestamp: Utc::now(),
                        kind: EventKind::GreeksUpdate,
                        channel: Channel::Symbol(symbol.to_string()),
                        payload: EventPayload::GreeksUpdate {
                            symbol: symbol.to_string(),
                            delta: rng.gen_range(-0.5..0.5),
                            gamma: rng.gen_range(0.0..0.05),
                            vega: rng.gen_range(0.0..0.3),
                            theta: rng.gen_range(-0.2..0.0),
                            rho: rng.gen_range(-0.1..0.1),
                        },
                    };
                    broker.publish(greeks_event);

                    // Occasionally emit risk alert or market snapshot
                    if rng.gen_bool(0.1) {
                        id_counter += 1;
                        let risk_event = MarketEvent {
                            id: EventId(id_counter),
                            timestamp: Utc::now(),
                            kind: EventKind::RiskAlert,
                            channel: Channel::EventType(EventKind::RiskAlert),
                            payload: EventPayload::RiskAlert {
                                message: format!("Large delta exposure on {symbol}"),
                                severity: if rng.gen_bool(0.5) { "high".into() } else { "medium".into() },
                            },
                        };
                        broker.publish(risk_event);
                    }

                    if rng.gen_bool(0.05) {
                        id_counter += 1;
                        let snapshot_event = MarketEvent {
                            id: EventId(id_counter),
                            timestamp: Utc::now(),
                            kind: EventKind::MarketSnapshot,
                            channel: Channel::Symbol(symbol.to_string()),
                            payload: EventPayload::MarketSnapshot {
                                symbol: symbol.to_string(),
                                spot: new_spot,
                                bid: new_spot - spread,
                                ask: new_spot + spread,
                                volume: rng.gen_range(100..10000),
                                implied_vol: rng.gen_range(0.15..0.35),
                            },
                        };
                        broker.publish(snapshot_event);
                    }
                }
                _ = &mut shutdown_rx => {
                    tracing::info!("Generator shutting down");
                    break;
                }
            }
        }
    });

    shutdown_tx
}
