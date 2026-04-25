use jet_bus::types::{EventKind, EventPayload, MarketEvent, PriceTickType, ServerMessage};
use tokio::sync::mpsc;

use crate::output;
use crate::pricing::PricingPipeline;

/// Run the main event processing loop.
/// Receives messages from the connector and dispatches to the appropriate handler.
pub async fn run(
    mut rx: mpsc::Receiver<ServerMessage>,
    pipeline: PricingPipeline,
) {
    let mut pipeline = pipeline;

    while let Some(msg) = rx.recv().await {
        match msg {
            ServerMessage::Event { event } => {
                handle_event(&mut pipeline, &event);
            }
            ServerMessage::Subscribed { channels } => {
                let names: Vec<String> = channels.iter().map(|c| format!("{c:?}")).collect();
                tracing::info!("Confirmed subscriptions: {}", names.join(", "));
            }
            ServerMessage::Unsubscribed { channels } => {
                let names: Vec<String> = channels.iter().map(|c| format!("{c:?}")).collect();
                tracing::info!("Unsubscribed from: {}", names.join(", "));
            }
            ServerMessage::Lagged { missed } => {
                tracing::warn!("Fell behind — missed {missed} events");
            }
            ServerMessage::Error { code, message } => {
                tracing::error!("Bus error [{code}]: {message}");
            }
            ServerMessage::Pong {
                client_time,
                server_time,
            } => {
                let latency = (server_time - client_time).num_milliseconds();
                tracing::debug!("Pong received (latency: {latency}ms)");
            }
            ServerMessage::Subscriptions { channels } => {
                let names: Vec<String> = channels.iter().map(|c| format!("{c:?}")).collect();
                tracing::info!("Current subscriptions: {}", names.join(", "));
            }
        }
    }
}

fn handle_event(pipeline: &mut PricingPipeline, event: &MarketEvent) {
    match &event.kind {
        EventKind::PriceUpdate => {
            if let EventPayload::PriceUpdate {
                symbol, tick_type: PriceTickType::Last, price, ..
            } = &event.payload
            {
                tracing::debug!("PriceUpdate: {symbol} spot={price:.2}");

                match pipeline.on_spot_update(symbol, *price) {
                    Ok(rows) if !rows.is_empty() => {
                        output::print_pricing_table(&rows);
                    }
                    Ok(_) => {}
                    Err(e) => {
                        tracing::error!("Pricing error for {symbol}: {e}");
                    }
                }
            }
        }
        EventKind::GreeksUpdate => {
            if let EventPayload::GreeksUpdate {
                symbol,
                delta,
                gamma,
                vega,
                theta,
                rho,
            } = &event.payload
            {
                output::print_greeks_update(symbol, *delta, *gamma, *vega, *theta, *rho);
            }
        }
        EventKind::RiskAlert => {
            if let EventPayload::RiskAlert { message, severity } = &event.payload {
                output::print_risk_alert(message, severity);
            }
        }
        EventKind::MarketSnapshot => {
            if let EventPayload::MarketSnapshot {
                symbol,
                spot,
                bid,
                ask,
                volume,
                implied_vol,
            } = &event.payload
            {
                output::print_market_snapshot(
                    symbol, *spot, *bid, *ask, *volume, *implied_vol,
                );
            }
        }
        EventKind::PnlSnapshot => {
            if let EventPayload::PnlSnapshot {
                total_pnl,
                delta_pnl,
                gamma_pnl,
                vega_pnl,
                theta_pnl,
            } = &event.payload
            {
                output::print_pnl_snapshot(
                    *total_pnl, *delta_pnl, *gamma_pnl, *vega_pnl, *theta_pnl,
                );
            }
        }
        EventKind::VolSurfaceShift => {
            if let EventPayload::VolSurfaceShift {
                symbol,
                atm_vol,
                skew,
            } = &event.payload
            {
                println!(
                    "  [VOL]   {symbol} ATM={:.2}%  skew={:.4}",
                    atm_vol * 100.0,
                    skew
                );
            }
        }
    }
}
