/// Black-Scholes-Merton option pricing model.
///
/// Provides closed-form pricing and analytical Greeks for European vanilla
/// options on a single underlying with continuous dividend yield.
///
/// # References
/// - Hull, "Options, Futures, and Other Derivatives", Ch. 15-17
/// - Black & Scholes (1973), "The Pricing of Options and Corporate Liabilities"

use crate::math::{norm_cdf, norm_pdf};
use crate::pricing::types::{MarketData, OptionType, OptionContract, PricingResult};

/// Intermediate Black-Scholes parameters (d1, d2) used across multiple formulas.
struct BsParams {
    d1: f64,
    d2: f64,
    spot: f64,
    strike: f64,
    time: f64,
    rate: f64,
    vol: f64,
    div_yield: f64,
    option_type: OptionType,
}

impl BsParams {
    /// Compute d1 and d2 from market data and contract terms.
    ///
    /// d1 = [ln(S/K) + (r - q + sigma^2/2) * T] / (sigma * sqrt(T))
    /// d2 = d1 - sigma * sqrt(T)
    fn compute(
        contract: &OptionContract,
        market: &MarketData,
    ) -> Result<Self, String> {
        let s = market.spot;
        let k = contract.strike;
        let t = contract.time_to_expiry;
        let r = market.risk_free_rate;
        let sigma = market.volatility;
        let q = market.dividend_yield;

        if s <= 0.0 {
            return Err("Spot price must be positive".to_string());
        }
        if k <= 0.0 {
            return Err("Strike price must be positive".to_string());
        }
        if t <= 0.0 {
            return Err("Time to expiry must be positive".to_string());
        }
        if sigma <= 0.0 {
            return Err("Volatility must be positive".to_string());
        }

        let sqrt_t = t.sqrt();
        let d1 = ((s / k).ln() + (r - q + 0.5 * sigma * sigma) * t) / (sigma * sqrt_t);
        let d2 = d1 - sigma * sqrt_t;

        Ok(Self {
            d1,
            d2,
            spot: s,
            strike: k,
            time: t,
            rate: r,
            vol: sigma,
            div_yield: q,
            option_type: contract.option_type,
        })
    }
}

/// Compute the Black-Scholes option price and all first-order Greeks.
pub fn price(
    contract: &OptionContract,
    market: &MarketData,
) -> Result<PricingResult, String> {
    let p = BsParams::compute(contract, market)?;

    let price = bs_price(&p);
    let delta = bs_delta(&p);
    let gamma = bs_gamma(&p);
    let vega = bs_vega(&p);
    let theta = bs_theta(&p);
    let rho = bs_rho(&p);

    Ok(PricingResult {
        option_type: p.option_type,
        price,
        delta,
        gamma,
        vega,
        theta,
        rho,
    })
}

/// Compute only the Black-Scholes price (no Greeks).
pub fn price_only(
    contract: &OptionContract,
    market: &MarketData,
) -> Result<f64, String> {
    let p = BsParams::compute(contract, market)?;
    Ok(bs_price(&p))
}

/// Compute the option price over a range of spot prices.
///
/// Useful for generating payoff diagrams and P&L profiles. Returns a Vec of
/// (spot, price) pairs.
pub fn price_curve(
    contract: &OptionContract,
    market: &MarketData,
    spot_range: (f64, f64),
    num_points: usize,
) -> Result<Vec<(f64, f64)>, String> {
    let (s_min, s_max) = spot_range;
    if s_min >= s_max || s_min <= 0.0 {
        return Err("Invalid spot range".to_string());
    }
    if num_points < 2 {
        return Err("Need at least 2 points".to_string());
    }

    let step = (s_max - s_min) / (num_points - 1) as f64;
    let mut points = Vec::with_capacity(num_points);

    for i in 0..num_points {
        let s = s_min + step * i as f64;
        let mut mkt = *market;
        mkt.spot = s;
        let p = BsParams::compute(contract, &mkt)?;
        points.push((s, bs_price(&p)));
    }

    Ok(points)
}

// ---------------------------------------------------------------------------
// Internal pricing and Greeks functions
// ---------------------------------------------------------------------------

/// BSM option price.
///
/// Call: S*exp(-qT)*Phi(d1) - K*exp(-rT)*Phi(d2)
/// Put:  K*exp(-rT)*Phi(-d2) - S*exp(-qT)*Phi(-d1)
fn bs_price(p: &BsParams) -> f64 {
    let discount = (-p.rate * p.time).exp();
    let div_discount = (-p.div_yield * p.time).exp();

    match p.option_type {
        OptionType::Call => {
            div_discount * p.spot * norm_cdf(p.d1)
                - discount * p.strike * norm_cdf(p.d2)
        }
        OptionType::Put => {
            discount * p.strike * norm_cdf(-p.d2)
                - div_discount * p.spot * norm_cdf(-p.d1)
        }
    }
}

/// BSM delta: first derivative of price w.r.t. spot.
///
/// Call: exp(-qT) * Phi(d1)
/// Put:  exp(-qT) * (Phi(d1) - 1)
fn bs_delta(p: &BsParams) -> f64 {
    let div_discount = (-p.div_yield * p.time).exp();
    match p.option_type {
        OptionType::Call => div_discount * norm_cdf(p.d1),
        OptionType::Put => div_discount * (norm_cdf(p.d1) - 1.0),
    }
}

/// BSM gamma: second derivative of price w.r.t. spot.
///
/// Gamma = phi(d1) * exp(-qT) / (S * sigma * sqrt(T))
fn bs_gamma(p: &BsParams) -> f64 {
    let div_discount = (-p.div_yield * p.time).exp();
    let sqrt_t = p.time.sqrt();
    norm_pdf(p.d1) * div_discount / (p.spot * p.vol * sqrt_t)
}

/// BSM vega: derivative of price w.r.t. volatility.
///
/// Vega = S * phi(d1) * exp(-qT) * sqrt(T)
/// Conventionally expressed per 1% vol move, but we return the raw value.
fn bs_vega(p: &BsParams) -> f64 {
    let div_discount = (-p.div_yield * p.time).exp();
    p.spot * norm_pdf(p.d1) * div_discount * p.time.sqrt()
}

/// BSM theta: derivative of price w.r.t. time (per calendar day decay).
///
/// We return theta per year (negative, as options lose value with time).
/// Call: -[S*phi(d1)*sigma*exp(-qT)/(2*sqrt(T))] - r*K*exp(-rT)*Phi(d2) + q*S*exp(-qT)*Phi(d1)
/// Put:  -[S*phi(d1)*sigma*exp(-qT)/(2*sqrt(T))] + r*K*exp(-rT)*Phi(-d2) - q*S*exp(-qT)*Phi(-d1)
fn bs_theta(p: &BsParams) -> f64 {
    let sqrt_t = p.time.sqrt();
    let discount = (-p.rate * p.time).exp();
    let div_discount = (-p.div_yield * p.time).exp();
    let term1 = -p.spot * norm_pdf(p.d1) * p.vol * div_discount / (2.0 * sqrt_t);

    match p.option_type {
        OptionType::Call => {
            term1
                - p.rate * p.strike * discount * norm_cdf(p.d2)
                + p.div_yield * p.spot * div_discount * norm_cdf(p.d1)
        }
        OptionType::Put => {
            term1
                + p.rate * p.strike * discount * norm_cdf(-p.d2)
                - p.div_yield * p.spot * div_discount * norm_cdf(-p.d1)
        }
    }
}

/// BSM rho: derivative of price w.r.t. risk-free rate.
///
/// Call: K * T * exp(-rT) * Phi(d2)
/// Put:  -K * T * exp(-rT) * Phi(-d2)
fn bs_rho(p: &BsParams) -> f64 {
    let discount = (-p.rate * p.time).exp();
    match p.option_type {
        OptionType::Call => {
            p.strike * p.time * discount * norm_cdf(p.d2)
        }
        OptionType::Put => {
            -p.strike * p.time * discount * norm_cdf(-p.d2)
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Classic BSM test case: Hull Chapter 15 example.
    /// S=100, K=100, T=0.25, r=8%, sigma=30%, no dividends.
    /// Expected call price = 6.96 (verified independently).
    #[test]
    fn test_hull_example_call() {
        let contract = OptionContract::new(OptionType::Call, 100.0, 0.25);
        let market = MarketData::new(100.0, 0.08, 0.30);

        let result = price(&contract, &market).unwrap();

        assert!((result.price - 6.96).abs() < 0.02,
            "Call price should be approximately 6.96, got {}", result.price);
    }

    /// Put-call parity: C - P = S*exp(-qT) - K*exp(-rT)
    #[test]
    fn test_put_call_parity() {
        let strike = 105.0;
        let t = 0.5;
        let contract_c = OptionContract::new(OptionType::Call, strike, t);
        let contract_p = OptionContract::new(OptionType::Put, strike, t);
        let market = MarketData::new(100.0, 0.05, 0.25)
            .with_dividend_yield(0.02);

        let call = price(&contract_c, &market).unwrap().price;
        let put = price(&contract_p, &market).unwrap().price;

        let lhs = call - put;
        let rhs = 100.0 * (-0.02 * t).exp() - strike * (-0.05 * t).exp();

        assert!((lhs - rhs).abs() < 1e-10,
            "Put-call parity violated: C-P = {}, expected {}", lhs, rhs);
    }

    /// Price should be zero when volatility approaches zero and option is
    /// out-of-the-money.
    #[test]
    fn test_otm_low_vol() {
        let contract = OptionContract::new(OptionType::Call, 200.0, 1.0);
        let market = MarketData::new(100.0, 0.05, 0.001);

        let result = price(&contract, &market).unwrap();
        assert!(result.price < 0.01,
            "Deep OTM call with near-zero vol should be near zero, got {}",
            result.price);
    }

    /// Price curve should have the correct number of points and be monotonic
    /// for a call option.
    #[test]
    fn test_price_curve_call() {
        let contract = OptionContract::new(OptionType::Call, 100.0, 0.25);
        let market = MarketData::new(100.0, 0.05, 0.20);

        let curve = price_curve(&contract, &market, (50.0, 150.0), 100).unwrap();
        assert_eq!(curve.len(), 100);

        // Call price should be monotonically non-decreasing with spot
        for i in 1..curve.len() {
            assert!(curve[i].1 >= curve[i - 1].1 - 1e-10,
                "Call price should be non-decreasing: {} > {} at index {}",
                curve[i - 1].1, curve[i].1, i);
        }
    }

    /// Delta should be in [0, 1] for calls and [-1, 0] for puts.
    #[test]
    fn test_delta_bounds() {
        let market = MarketData::new(100.0, 0.05, 0.20);

        for option_type in [OptionType::Call, OptionType::Put] {
            let contract = OptionContract::new(option_type, 100.0, 1.0);
            let result = price(&contract, &market).unwrap();

            match option_type {
                OptionType::Call => {
                    assert!(result.delta >= 0.0 && result.delta <= 1.0,
                        "Call delta should be in [0,1], got {}", result.delta);
                }
                OptionType::Put => {
                    assert!(result.delta >= -1.0 && result.delta <= 0.0,
                        "Put delta should be in [-1,0], got {}", result.delta);
                }
            }
        }
    }
}
