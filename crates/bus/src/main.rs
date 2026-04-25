use std::sync::Arc;
use tokio::sync::Mutex;

use axum::Router;
use axum::routing::get;
use axum::extract::State;
use tower_http::cors::CorsLayer;

use jet_bus::Broker;
use jet_bus::metrics::MetricsSnapshot;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "jet_bus=info".into()),
        )
        .init();

    let broker = Broker::new();
    let config = jet_bus::generator::GeneratorConfig::default();
    let shutdown_tx = jet_bus::generator::start(broker.clone(), config);

    let state = Arc::new(jet_bus::AppState {
        broker,
        shutdown: Mutex::new(Some(shutdown_tx)),
    });

    let app = Router::new()
        .route("/ws", get(jet_bus::session::ws_handler))
        .route("/api/bus/metrics", get(metrics_handler))
        .with_state(state)
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("[::]:3001").await.unwrap();
    tracing::info!("jet-bus listening on :3001");
    axum::serve(listener, app).await.unwrap();
}

async fn metrics_handler(
    State(state): State<Arc<jet_bus::AppState>>,
) -> axum::Json<MetricsSnapshot> {
    let snapshot = state.broker.metrics.snapshot();
    axum::Json(snapshot)
}
