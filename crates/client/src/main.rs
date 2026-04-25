mod connector;
mod error;
mod output;
mod pricing;
mod router;

use std::time::Duration;

use clap::Parser;
use tokio::sync::mpsc;

use jet_bus::types::{Channel, EventKind};

#[derive(Parser)]
#[command(name = "jet-client", about = "Subscribe to jet-bus market events")]
struct Cli {
    /// jet-bus WebSocket URL
    #[arg(long, default_value = "ws://localhost:3001/ws")]
    bus_url: String,

    /// Symbols to subscribe to (comma-separated)
    #[arg(long, default_value = "SPX,SPY,QQQ")]
    symbols: String,

    /// Also subscribe to risk alerts
    #[arg(long, default_value_t = true)]
    risk_alerts: bool,

    /// Also subscribe to P&L snapshots
    #[arg(long, default_value_t = true)]
    pnl_snapshots: bool,

    /// Risk-free rate for pricing pipeline
    #[arg(long, default_value_t = 0.05)]
    rate: f64,

    /// Implied volatility assumption for pricing pipeline
    #[arg(long, default_value_t = 0.20)]
    vol: f64,

    /// Reconnect delay in seconds
    #[arg(long, default_value_t = 3)]
    reconnect_secs: u64,
}

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "jet_client=info".into()),
        )
        .init();

    let cli = Cli::parse();

    let symbols: Vec<String> = cli
        .symbols
        .split(',')
        .map(|s| s.trim().to_uppercase())
        .collect();

    tracing::info!("jet-client starting");
    tracing::info!("  Symbols: {}", symbols.join(", "));
    tracing::info!("  Bus URL: {}", cli.bus_url);

    // Build subscription channels.
    let mut channels: Vec<Channel> = symbols
        .iter()
        .map(|s| Channel::Symbol(s.clone()))
        .collect();

    if cli.risk_alerts {
        channels.push(Channel::EventType(EventKind::RiskAlert));
    }
    if cli.pnl_snapshots {
        channels.push(Channel::EventType(EventKind::PnlSnapshot));
    }

    // Build the pricing pipeline.
    let pipeline = pricing::PricingPipeline::new(&symbols, cli.rate, cli.vol);

    // Channel for connector → router.
    let (tx, rx) = mpsc::channel::<jet_bus::types::ServerMessage>(4096);

    // Spawn the connector.
    let connector = connector::Connector::new(
        cli.bus_url,
        Duration::from_secs(cli.reconnect_secs),
    );
    tokio::spawn(async move {
        connector.run(channels, tx).await;
    });

    // Run the event router (blocks until receiver drops).
    router::run(rx, pipeline).await;

    tracing::info!("jet-client shutting down");
}
