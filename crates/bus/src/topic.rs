use crate::types::{Channel, EventPayload, MarketEvent};

/// Does a published event match a given subscription channel?
pub fn matches(event: &MarketEvent, sub: &Channel) -> bool {
    match sub {
        Channel::All => true,
        Channel::Symbol(sym) => {
            let ev_sym = symbol_from_payload(&event.payload);
            ev_sym.map(|s| s.eq_ignore_ascii_case(sym)).unwrap_or(false)
        }
        Channel::EventType(kind) => &event.kind == kind,
        Channel::Strategy(_strategy) => {
            // Strategy matching would require strategy-to-symbol mapping;
            // for now, match based on the event's own channel.
            &event.channel == sub
        }
    }
}

/// Check if an event matches any of the session's subscriptions.
pub fn matches_any(event: &MarketEvent, subs: &[Channel]) -> bool {
    subs.iter().any(|sub| matches(event, sub))
}

/// Extract the symbol from an event payload, if present.
fn symbol_from_payload(payload: &EventPayload) -> Option<&str> {
    match payload {
        EventPayload::PriceUpdate { symbol, tick_type: _, price: _, size: _ } => Some(symbol),
        EventPayload::GreeksUpdate { symbol, .. } => Some(symbol),
        EventPayload::VolSurfaceShift { symbol, .. } => Some(symbol),
        EventPayload::MarketSnapshot { symbol, .. } => Some(symbol),
        EventPayload::RiskAlert { .. } => None,
        EventPayload::PnlSnapshot { .. } => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::types::{EventId, EventKind, EventPayload, MarketEvent, PriceTickType};
    use chrono::Utc;

    fn make_event(kind: EventKind, channel: Channel, payload: EventPayload) -> MarketEvent {
        MarketEvent {
            id: EventId(1),
            timestamp: Utc::now(),
            kind,
            channel,
            payload,
        }
    }

    #[test]
    fn channel_all_matches_everything() {
        let payload = EventPayload::PriceUpdate {
            symbol: "SPX".into(),
            tick_type: PriceTickType::Last,
            price: 5500.0,
            size: 1000,
        };
        let event = make_event(
            EventKind::PriceUpdate,
            Channel::Symbol("SPX".into()),
            payload,
        );
        assert!(matches(&event, &Channel::All));
    }

    #[test]
    fn symbol_channel_matches_case_insensitive() {
        let payload = EventPayload::PriceUpdate {
            symbol: "SPX".into(),
            tick_type: PriceTickType::Last,
            price: 5500.0,
            size: 1000,
        };
        let event = make_event(
            EventKind::PriceUpdate,
            Channel::Symbol("SPX".into()),
            payload,
        );
        assert!(matches(&event, &Channel::Symbol("spx".into())));
        assert!(matches(&event, &Channel::Symbol("SPX".into())));
        assert!(!matches(&event, &Channel::Symbol("SPY".into())));
    }

    #[test]
    fn event_type_channel_matches_kind() {
        let payload = EventPayload::RiskAlert {
            message: "test".into(),
            severity: "high".into(),
        };
        let event = make_event(
            EventKind::RiskAlert,
            Channel::EventType(EventKind::RiskAlert),
            payload,
        );
        assert!(matches(
            &event,
            &Channel::EventType(EventKind::RiskAlert)
        ));
        assert!(!matches(
            &event,
            &Channel::EventType(EventKind::PriceUpdate)
        ));
    }

    #[test]
    fn matches_any_works() {
        let payload = EventPayload::PriceUpdate {
            symbol: "SPX".into(),
            tick_type: PriceTickType::Last,
            price: 5500.0,
            size: 1000,
        };
        let event = make_event(
            EventKind::PriceUpdate,
            Channel::Symbol("SPX".into()),
            payload,
        );
        let subs = vec![
            Channel::Symbol("SPY".into()),
            Channel::EventType(EventKind::PriceUpdate),
        ];
        assert!(matches_any(&event, &subs));

        let subs2 = vec![Channel::Symbol("SPY".into())];
        assert!(!matches_any(&event, &subs2));
    }
}
