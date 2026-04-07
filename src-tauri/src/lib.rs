/// JET - Equity Derivatives Analytics.
///
/// Tauri library module. Thin IPC shell that delegates all business logic
/// to `jet_core`.

use jet_core::pricing;
use jet_core::analytics;
use jet_core::parsing;

// Re-export shared types for convenience
pub use jet_core::{PricePoint, GreeksCurveResult, GreeksCurveRequest, PositionRisk, RiskSummary};

// ---------------------------------------------------------------------------
// Tauri IPC Commands — Pricing
// ---------------------------------------------------------------------------

/// Price a European option using Black-Scholes-Merton.
#[tauri::command]
fn price_option(
    contract: pricing::types::OptionContract,
    market: pricing::types::MarketData,
) -> Result<pricing::types::PricingResult, String> {
    pricing::black_scholes::price(&contract, &market)
}

/// Compute the BSM option value over a range of spot prices.
#[tauri::command]
fn price_curve(
    contract: pricing::types::OptionContract,
    market: pricing::types::MarketData,
    spot_range: (f64, f64),
    num_points: usize,
) -> Result<Vec<PricePoint>, String> {
    jet_core::compute_price_curve(&contract, &market, spot_range, num_points)
}

/// Compute Greeks over a range of spot prices for charting.
#[tauri::command]
fn greeks_curve(request: GreeksCurveRequest) -> Result<GreeksCurveResult, String> {
    jet_core::compute_greeks_curve(request)
}

// ---------------------------------------------------------------------------
// Tauri IPC Commands — Analytics (Derived Data)
// ---------------------------------------------------------------------------

/// Fetch volatility surface data.
#[tauri::command]
fn get_vol_surface() -> Result<analytics::VolSurface, String> {
    Ok(analytics::volatility::sample_vol_surface())
}

/// Fetch yield curve data.
#[tauri::command]
fn get_curves() -> Result<Vec<analytics::CurveData>, String> {
    Ok(analytics::curves::sample_curves())
}

/// Fetch dividend curve data.
#[tauri::command]
fn get_dividend_curve() -> Result<analytics::DividendCurve, String> {
    Ok(analytics::dividends::sample_dividend_curve())
}

/// Fetch correlation matrix.
#[tauri::command]
fn get_correlation_matrix() -> Result<analytics::CorrelationMatrix, String> {
    Ok(analytics::correlation::sample_correlation_matrix())
}

/// Fetch pairwise correlation entries.
#[tauri::command]
fn get_correlation_entries() -> Result<Vec<analytics::CorrelationEntry>, String> {
    Ok(analytics::correlation::sample_correlation_entries())
}

// ---------------------------------------------------------------------------
// Tauri IPC Commands — Risk
// ---------------------------------------------------------------------------

/// Fetch risk data for all positions.
#[tauri::command]
fn get_risk_summary() -> Result<RiskSummary, String> {
    Ok(jet_core::sample_risk_summary())
}

// ---------------------------------------------------------------------------
// Tauri IPC Commands — P&L
// ---------------------------------------------------------------------------

/// Fetch P&L attribution data.
#[tauri::command]
fn get_pnl_attribution() -> Result<analytics::PnlExplain, String> {
    Ok(analytics::pnl::sample_pnl_attribution())
}

// ---------------------------------------------------------------------------
// Tauri IPC Commands — Option Strategy Parser
// ---------------------------------------------------------------------------

/// Parse an option strategy quote string into structured contract terms.
#[tauri::command]
fn parse_strategy(input: String) -> Result<parsing::types::StrategyParseResult, String> {
    parsing::quote_parser::parse_strategy(&input)
}

/// Price a parsed strategy: parse the quote string, price each leg via BSM,
/// and aggregate strategy-level Greeks.
#[tauri::command]
fn price_strategy(
    input: String,
    assumptions: Option<parsing::types::StrategyMarketAssumptions>,
) -> Result<parsing::types::PricedStrategyResult, String> {
    jet_core::price_strategy(&input, assumptions)
}

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

/// Build and run the Tauri application.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            price_option,
            price_curve,
            greeks_curve,
            get_vol_surface,
            get_curves,
            get_dividend_curve,
            get_correlation_matrix,
            get_correlation_entries,
            get_risk_summary,
            get_pnl_attribution,
            parse_strategy,
            price_strategy,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
