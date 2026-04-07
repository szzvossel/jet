/// JET Core — Shared business logic for pricing, analytics, and parsing.
///
/// This crate is the single source of truth for all quantitative computation.
/// Both the Tauri desktop app (`src-tauri`) and the Axum HTTP server
/// (`src-server`) depend on this crate rather than duplicating logic.

pub mod math;
pub mod pricing;
pub mod analytics;
pub mod parsing;
pub mod data;

use serde::{Deserialize, Serialize};

// ---------------------------------------------------------------------------
// Shared types used across IPC and HTTP boundaries
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

/// Position risk data for the risk view tab.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PositionRisk {
    pub position: String,
    pub underlying: String,
    pub quantity: f64,
    pub delta: f64,
    pub gamma: f64,
    pub vega: f64,
    pub theta: f64,
    pub epsilon: f64,
    pub rho: f64,
    pub notional: f64,
}

/// Aggregated risk data for the risk view tab.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RiskSummary {
    pub positions: Vec<PositionRisk>,
    pub total_delta: f64,
    pub total_gamma: f64,
    pub total_vega: f64,
    pub total_theta: f64,
    pub total_epsilon: f64,
    pub total_rho: f64,
}

// ---------------------------------------------------------------------------
// Shared business logic
// ---------------------------------------------------------------------------

/// Compute time-to-expiry in year-fraction from an ISO date string.
pub fn compute_time_to_expiry(expiry_str: &str) -> Result<f64, String> {
    let expiry = chrono::NaiveDate::parse_from_str(expiry_str, "%Y-%m-%d")
        .map_err(|e| format!("Invalid expiry '{}': {}", expiry_str, e))?;
    let today = chrono::Local::now().date_naive();
    let days = (expiry - today).num_days();
    if days <= 0 {
        return Err(format!("Expiry {} is today or in the past", expiry_str));
    }
    Ok(days as f64 / 365.25)
}

/// Build a `RiskSummary` with sample position data.
pub fn sample_risk_summary() -> RiskSummary {
    let positions = vec![
        PositionRisk {
            position: "SPY 100C Mar27".to_string(),
            underlying: "SPY".to_string(),
            quantity: 50.0,
            delta: 32.5,
            gamma: 4.8,
            vega: 18.2,
            theta: -2.4,
            epsilon: -1.5,
            rho: 8.6,
            notional: 500000.0,
        },
        PositionRisk {
            position: "SPY 95P Mar27".to_string(),
            underlying: "SPY".to_string(),
            quantity: -30.0,
            delta: -12.8,
            gamma: 3.2,
            vega: 12.5,
            theta: -1.6,
            epsilon: 0.8,
            rho: -3.4,
            notional: 300000.0,
        },
        PositionRisk {
            position: "QQQ 150C Mar27".to_string(),
            underlying: "QQQ".to_string(),
            quantity: 40.0,
            delta: 28.4,
            gamma: 3.6,
            vega: 14.8,
            theta: -1.9,
            epsilon: -1.2,
            rho: 7.2,
            notional: 600000.0,
        },
        PositionRisk {
            position: "IWM 50P Mar27".to_string(),
            underlying: "IWM".to_string(),
            quantity: -20.0,
            delta: -8.6,
            gamma: 2.1,
            vega: 8.4,
            theta: -1.1,
            epsilon: 0.5,
            rho: -2.2,
            notional: 200000.0,
        },
        PositionRisk {
            position: "DIA 180C Mar27".to_string(),
            underlying: "DIA".to_string(),
            quantity: 25.0,
            delta: 18.2,
            gamma: 2.8,
            vega: 10.5,
            theta: -1.4,
            epsilon: -0.9,
            rho: 5.8,
            notional: 450000.0,
        },
        PositionRisk {
            position: "EEM 35P Mar27".to_string(),
            underlying: "EEM".to_string(),
            quantity: -15.0,
            delta: -6.4,
            gamma: 1.5,
            vega: 6.2,
            theta: -0.8,
            epsilon: 0.3,
            rho: -1.6,
            notional: 150000.0,
        },
    ];

    let total_delta = positions.iter().map(|p| p.delta).sum();
    let total_gamma = positions.iter().map(|p| p.gamma).sum();
    let total_vega = positions.iter().map(|p| p.vega).sum();
    let total_theta = positions.iter().map(|p| p.theta).sum();
    let total_epsilon = positions.iter().map(|p| p.epsilon).sum();
    let total_rho = positions.iter().map(|p| p.rho).sum();

    RiskSummary {
        positions,
        total_delta,
        total_gamma,
        total_vega,
        total_theta,
        total_epsilon,
        total_rho,
    }
}

/// Compute a greeks curve over a range of spot prices.
pub fn compute_greeks_curve(request: GreeksCurveRequest) -> Result<GreeksCurveResult, String> {
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

/// Price a parsed strategy: parse the quote string, price each leg via BSM,
/// and aggregate strategy-level Greeks.
pub fn price_strategy(
    input: &str,
    assumptions: Option<parsing::types::StrategyMarketAssumptions>,
) -> Result<parsing::types::PricedStrategyResult, String> {
    let assms = assumptions.unwrap_or_default();
    let parsed = parsing::quote_parser::parse_strategy(input)?;

    let mut priced_legs = Vec::with_capacity(parsed.legs.len());
    let mut net_premium = 0.0_f64;
    let mut net_delta = 0.0_f64;
    let mut net_gamma = 0.0_f64;
    let mut net_vega = 0.0_f64;
    let mut net_theta = 0.0_f64;
    let mut net_rho = 0.0_f64;

    for leg in &parsed.legs {
        let spot = parsing::quote_parser::spot_for_symbol(&leg.symbol)?;
        let tte = compute_time_to_expiry(&leg.expiry)?;

        let contract = pricing::types::OptionContract::new(
            leg.option_type.into(),
            leg.strike,
            tte,
        );
        let market = pricing::types::MarketData {
            spot,
            risk_free_rate: assms.rate,
            volatility: assms.vol,
            dividend_yield: assms.div_yield,
        };

        let result = pricing::black_scholes::price(&contract, &market)?;

        let sign: f64 = if leg.direction == parsing::types::Direction::Long {
            1.0
        } else {
            -1.0
        };
        let qty = leg.quantity as f64;
        let multiplier = sign * qty;

        net_premium += multiplier * result.price;
        net_delta += multiplier * result.delta;
        net_gamma += multiplier * result.gamma;
        net_vega += multiplier * result.vega;
        net_theta += multiplier * result.theta;
        net_rho += multiplier * result.rho;

        priced_legs.push(parsing::types::PricedLeg {
            symbol: leg.symbol.clone(),
            expiry: leg.expiry.clone(),
            strike: leg.strike,
            strike_pct: leg.strike_pct,
            option_type: leg.option_type,
            style: leg.style,
            quantity: leg.quantity,
            direction: leg.direction,
            price: result.price,
            delta: result.delta,
            gamma: result.gamma,
            vega: result.vega,
            theta: result.theta,
            rho: result.rho,
        });
    }

    Ok(parsing::types::PricedStrategyResult {
        strategy_name: parsed.strategy_name,
        legs: priced_legs,
        greeks: parsing::types::StrategyGreeks {
            net_premium,
            net_delta,
            net_gamma,
            net_vega,
            net_theta,
            net_rho,
        },
    })
}

/// Compute a price curve as a vector of `PricePoint`.
pub fn compute_price_curve(
    contract: &pricing::types::OptionContract,
    market: &pricing::types::MarketData,
    spot_range: (f64, f64),
    num_points: usize,
) -> Result<Vec<PricePoint>, String> {
    let raw = pricing::black_scholes::price_curve(contract, market, spot_range, num_points)?;
    Ok(raw.into_iter().map(|(spot, price)| PricePoint { spot, price }).collect())
}
