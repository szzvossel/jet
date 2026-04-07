/// Numerical Greeks via finite-difference bump-and-revalue.
///
/// Useful for validating analytical Greeks and for models that lack closed-form
/// sensitivities (binomial, Monte Carlo, etc.).

use crate::pricing::black_scholes;
use crate::pricing::types::{MarketData, OptionContract};

/// Numerical first derivative via central difference.
fn central_diff<F>(f: F, x: f64, h: f64) -> f64
where
    F: Fn(f64) -> f64,
{
    (f(x + h) - f(x - h)) / (2.0 * h)
}

/// Numerical second derivative via central difference.
fn central_diff2<F>(f: F, x: f64, h: f64) -> f64
where
    F: Fn(f64) -> f64,
{
    (f(x + h) - 2.0 * f(x) + f(x - h)) / (h * h)
}

/// Compute numerical delta via bump-and-revalue.
pub fn numerical_delta(
    contract: &OptionContract,
    market: &MarketData,
    bump: f64,
) -> Result<f64, String> {
    let base = market.spot;
    let pricer = |s: f64| -> f64 {
        let mut m = *market;
        m.spot = s;
        black_scholes::price_only(contract, &m).unwrap_or(0.0)
    };
    Ok(central_diff(pricer, base, bump))
}

/// Compute numerical gamma via bump-and-revalue.
pub fn numerical_gamma(
    contract: &OptionContract,
    market: &MarketData,
    bump: f64,
) -> Result<f64, String> {
    let base = market.spot;
    let pricer = |s: f64| -> f64 {
        let mut m = *market;
        m.spot = s;
        black_scholes::price_only(contract, &m).unwrap_or(0.0)
    };
    Ok(central_diff2(pricer, base, bump))
}

/// Compute numerical vega via bump-and-revalue.
pub fn numerical_vega(
    contract: &OptionContract,
    market: &MarketData,
    bump: f64,
) -> Result<f64, String> {
    let base = market.volatility;
    let pricer = |v: f64| -> f64 {
        let mut m = *market;
        m.volatility = v;
        black_scholes::price_only(contract, &m).unwrap_or(0.0)
    };
    Ok(central_diff(pricer, base, bump))
}

/// Compute numerical theta via bump-and-revalue.
///
/// Note: theta is the negative of the derivative w.r.t. time (options lose
/// value as time passes).
pub fn numerical_theta(
    contract: &OptionContract,
    market: &MarketData,
    bump: f64,
) -> Result<f64, String> {
    let base = contract.time_to_expiry;
    let pricer = |t: f64| -> f64 {
        let c = OptionContract::new(contract.option_type, contract.strike, t);
        black_scholes::price_only(&c, market).unwrap_or(0.0)
    };
    // theta = -dPrice/dTime (options lose value over time)
    Ok(-central_diff(pricer, base, bump))
}

/// Compute numerical rho via bump-and-revalue.
pub fn numerical_rho(
    contract: &OptionContract,
    market: &MarketData,
    bump: f64,
) -> Result<f64, String> {
    let base = market.risk_free_rate;
    let pricer = |r: f64| -> f64 {
        let mut m = *market;
        m.risk_free_rate = r;
        black_scholes::price_only(contract, &m).unwrap_or(0.0)
    };
    Ok(central_diff(pricer, base, bump))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::pricing::black_scholes;
    use crate::pricing::types::{MarketData, OptionContract, OptionType};

    const BUMP: f64 = 1e-4;

    #[test]
    fn test_numerical_vs_analytical_delta() {
        let contract = OptionContract::new(OptionType::Call, 100.0, 0.25);
        let market = MarketData::new(100.0, 0.05, 0.20);

        let analytical = black_scholes::price(&contract, &market).unwrap().delta;
        let numerical = numerical_delta(&contract, &market, BUMP).unwrap();

        assert!((analytical - numerical).abs() < 1e-4,
            "Delta mismatch: analytical={}, numerical={}", analytical, numerical);
    }

    #[test]
    fn test_numerical_vs_analytical_gamma() {
        let contract = OptionContract::new(OptionType::Call, 100.0, 0.25);
        let market = MarketData::new(100.0, 0.05, 0.20);

        let analytical = black_scholes::price(&contract, &market).unwrap().gamma;
        let numerical = numerical_gamma(&contract, &market, BUMP).unwrap();

        assert!((analytical - numerical).abs() < 1e-3,
            "Gamma mismatch: analytical={}, numerical={}", analytical, numerical);
    }

    #[test]
    fn test_numerical_vs_analytical_vega() {
        let contract = OptionContract::new(OptionType::Put, 105.0, 0.5);
        let market = MarketData::new(100.0, 0.03, 0.25);

        let analytical = black_scholes::price(&contract, &market).unwrap().vega;
        let numerical = numerical_vega(&contract, &market, BUMP).unwrap();

        assert!((analytical - numerical).abs() < 1e-3,
            "Vega mismatch: analytical={}, numerical={}", analytical, numerical);
    }
}
