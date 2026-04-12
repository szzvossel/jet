/// JET Server — Axum HTTP API for the JET pricing engine.
///
/// Exposes the same 12 operations as the Tauri IPC commands as REST endpoints,
/// plus 2 tracer endpoints for log monitoring.
/// All business logic is delegated to `jet_core` and `jet_tracer`.

use axum::{
    extract::State,
    http::StatusCode,
    routing::{get, post},
    Json, Router,
};
use serde::Deserialize;
use std::sync::Arc;
use tower_http::cors::CorsLayer;

// ---------------------------------------------------------------------------
// Request types (Axum-specific wrappers around jet_core types)
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct PriceOptionRequest {
    contract: jet_core::pricing::types::OptionContract,
    market: jet_core::pricing::types::MarketData,
}

#[derive(Deserialize)]
struct PriceCurveRequest {
    contract: jet_core::pricing::types::OptionContract,
    market: jet_core::pricing::types::MarketData,
    spot_range: (f64, f64),
    num_points: usize,
}

#[derive(Deserialize)]
struct PriceStrategyRequest {
    input: String,
    assumptions: Option<jet_core::parsing::types::StrategyMarketAssumptions>,
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

async fn price_option(
    Json(req): Json<PriceOptionRequest>,
) -> Result<Json<jet_core::pricing::types::PricingResult>, (StatusCode, String)> {
    jet_core::pricing::black_scholes::price(&req.contract, &req.market)
        .map(Json)
        .map_err(|e| (StatusCode::BAD_REQUEST, e))
}

async fn price_curve(
    Json(req): Json<PriceCurveRequest>,
) -> Result<Json<Vec<jet_core::PricePoint>>, (StatusCode, String)> {
    jet_core::compute_price_curve(&req.contract, &req.market, req.spot_range, req.num_points)
        .map(Json)
        .map_err(|e| (StatusCode::BAD_REQUEST, e))
}

async fn greeks_curve(
    Json(req): Json<jet_core::GreeksCurveRequest>,
) -> Result<Json<jet_core::GreeksCurveResult>, (StatusCode, String)> {
    jet_core::compute_greeks_curve(req)
        .map(Json)
        .map_err(|e| (StatusCode::BAD_REQUEST, e))
}

async fn vol_surface() -> Json<jet_core::analytics::VolSurface> {
    Json(jet_core::analytics::sample_vol_surface())
}

async fn curves() -> Json<Vec<jet_core::analytics::CurveData>> {
    Json(jet_core::analytics::sample_curves())
}

async fn dividend_curve() -> Json<jet_core::analytics::DividendCurve> {
    Json(jet_core::analytics::sample_dividend_curve())
}

async fn correlation_matrix() -> Json<jet_core::analytics::CorrelationMatrix> {
    Json(jet_core::analytics::sample_correlation_matrix())
}

async fn correlation_entries() -> Json<Vec<jet_core::analytics::CorrelationEntry>> {
    Json(jet_core::analytics::sample_correlation_entries())
}

async fn risk_summary() -> Json<jet_core::RiskSummary> {
    Json(jet_core::sample_risk_summary())
}

async fn pnl_attribution() -> Json<jet_core::analytics::PnlExplain> {
    Json(jet_core::analytics::sample_pnl_attribution())
}

async fn parse_strategy(
    Json(req): Json<ParseStrategyInput>,
) -> Result<Json<jet_core::parsing::types::StrategyParseResult>, (StatusCode, String)> {
    jet_core::parsing::quote_parser::parse_strategy(&req.input)
        .map(Json)
        .map_err(|e| (StatusCode::BAD_REQUEST, e))
}

#[derive(Deserialize)]
struct ParseStrategyInput {
    input: String,
}

async fn price_strategy(
    Json(req): Json<PriceStrategyRequest>,
) -> Result<Json<jet_core::parsing::types::PricedStrategyResult>, (StatusCode, String)> {
    jet_core::price_strategy(&req.input, req.assumptions)
        .map(Json)
        .map_err(|e| (StatusCode::BAD_REQUEST, e))
}

// ---------------------------------------------------------------------------
// Shared application state (for tracer)
// ---------------------------------------------------------------------------

struct AppState {
    tracer_state: Arc<tokio::sync::RwLock<jet_tracer::TracerState>>,
}

// ---------------------------------------------------------------------------
// Tracer route handlers
// ---------------------------------------------------------------------------

#[derive(Deserialize)]
struct EventQueryParams {
    page: Option<usize>,
    page_size: Option<usize>,
}

async fn tracer_kpis(
    State(state): State<Arc<AppState>>,
) -> Json<jet_tracer::TracerKpis> {
    Json(jet_tracer::get_kpis(&state.tracer_state).await)
}

async fn tracer_events(
    State(state): State<Arc<AppState>>,
    axum::extract::Query(params): axum::extract::Query<EventQueryParams>,
) -> Json<jet_tracer::LogEventList> {
    let page = params.page.unwrap_or(0);
    let page_size = params.page_size.unwrap_or(100);
    Json(jet_tracer::get_events(&state.tracer_state, page, page_size).await)
}

// ---------------------------------------------------------------------------
// App startup
// ---------------------------------------------------------------------------

#[tokio::main]
async fn main() {
    // Initialize tracer subsystem
    let tracer_dir = std::path::PathBuf::from("data/tracer");
    let tracer_state = jet_tracer::init_tracer(tracer_dir).await;
    let app_state = Arc::new(AppState { tracer_state });

    let app = Router::new()
        .route("/api/price-option", post(price_option))
        .route("/api/price-curve", post(price_curve))
        .route("/api/greeks-curve", post(greeks_curve))
        .route("/api/vol-surface", get(vol_surface))
        .route("/api/curves", get(curves))
        .route("/api/dividend-curve", get(dividend_curve))
        .route("/api/correlation-matrix", get(correlation_matrix))
        .route("/api/correlation-entries", get(correlation_entries))
        .route("/api/risk-summary", get(risk_summary))
        .route("/api/pnl-attribution", get(pnl_attribution))
        .route("/api/parse-strategy", post(parse_strategy))
        .route("/api/price-strategy", post(price_strategy))
        .route("/api/tracer/kpis", get(tracer_kpis))
        .route("/api/tracer/events", get(tracer_events))
        .with_state(app_state)
        .layer(CorsLayer::permissive());

    let listener = tokio::net::TcpListener::bind("0.0.0.0:3000")
        .await
        .expect("Failed to bind to port 3000");

    println!("JET server listening on http://0.0.0.0:3000");

    axum::serve(listener, app)
        .await
        .expect("Server error");
}
