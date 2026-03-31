/// JET - Equity Derivatives Analytics.
///
/// Tauri library module. Sets up the Tauri app, registers IPC commands,
/// and exposes the pricing engine to the web frontend.

mod data;
mod math;
mod pricing;

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Types for IPC (matching frontend TypeScript types)
// ---------------------------------------------------------------------------

/// Serializable spot-price/price pair for the price curve chart.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricePoint {
    pub spot: f64,
    pub price: f64,
}

/// Greeks curve data across a range of spot prices.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GreeksCurveResult {
    pub spots: Vec<f64>,
    pub prices: Vec<f64>,
    pub deltas: Vec<f64>,
    pub gammas: Vec<f64>,
    pub vegas: Vec<f64>,
    pub thetas: Vec<f64>,
}

/// Request payload for the greeks_curve command.
#[derive(Debug, Clone, Deserialize)]
pub struct GreeksCurveRequest {
    pub contract: pricing::types::OptionContract,
    pub market: pricing::types::MarketData,
    pub spot_range: (f64, f64),
    pub num_points: usize,
}

// ---------------------------------------------------------------------------
// Tauri IPC Commands
// ---------------------------------------------------------------------------

/// Price a European option using Black-Scholes-Merton.
///
/// Returns the option price and all five first-order Greeks.
#[tauri::command]
fn price_option(
    contract: pricing::types::OptionContract,
    market: pricing::types::MarketData,
) -> Result<pricing::types::PricingResult, String> {
    pricing::black_scholes::price(&contract, &market)
}

/// Compute the BSM option value over a range of spot prices.
///
/// Returns a vector of (spot, price) pairs for charting the payoff diagram.
#[tauri::command]
fn price_curve(
    contract: pricing::types::OptionContract,
    market: pricing::types::MarketData,
    spot_range: (f64, f64),
    num_points: usize,
) -> Result<Vec<PricePoint>, String> {
    let raw = pricing::black_scholes::price_curve(&contract, &market, spot_range, num_points)?;
    Ok(raw.into_iter().map(|(spot, price)| PricePoint { spot, price }).collect())
}

/// Compute Greeks over a range of spot prices for charting.
///
/// For each spot price in the range, prices the option and records all Greeks.
#[tauri::command]
fn greeks_curve(request: GreeksCurveRequest) -> Result<GreeksCurveResult, String> {
    let GreeksCurveRequest {
        contract,
        market,
        spot_range,
        num_points,
    } = request;

    let (s_min, s_max) = spot_range;
    if s_min >= s_max || s_min <= 0.0 {
        return Err("Invalid spot range".to_string());
    }
    if num_points < 2 {
        return Err("Need at least 2 points".to_string());
    }

    let step = (s_max - s_min) / (num_points - 1) as f64;
    let mut spots = Vec::with_capacity(num_points);
    let mut prices = Vec::with_capacity(num_points);
    let mut deltas = Vec::with_capacity(num_points);
    let mut gammas = Vec::with_capacity(num_points);
    let mut vegas = Vec::with_capacity(num_points);
    let mut thetas = Vec::with_capacity(num_points);

    for i in 0..num_points {
        let s = s_min + step * i as f64;
        let mut mkt = market;
        mkt.spot = s;

        let result = pricing::black_scholes::price(&contract, &mkt)?;
        spots.push(s);
        prices.push(result.price);
        deltas.push(result.delta);
        gammas.push(result.gamma);
        vegas.push(result.vega);
        thetas.push(result.theta);
    }

    Ok(GreeksCurveResult {
        spots,
        prices,
        deltas,
        gammas,
        vegas,
        thetas,
    })
}

// ---------------------------------------------------------------------------
// App setup
// ---------------------------------------------------------------------------

/// Build and run the Tauri application.
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![price_option, price_curve, greeks_curve])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
