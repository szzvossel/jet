/// Market data structures.
///
/// Defines how market data (spot, rates, vol surfaces) is represented
/// and transported through the application.

use serde::{Deserialize, Serialize};

/// A snapshot of market observables for a single underlying.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct MarketSnapshot {
    /// Equity ticker symbol.
    pub ticker: String,
    /// Current spot price.
    pub spot: f64,
    /// Risk-free rate (annualized, continuous).
    pub risk_free_rate: f64,
    /// At-the-money implied volatility (annualized).
    pub atm_vol: f64,
    /// Continuous dividend yield (annualized).
    pub dividend_yield: f64,
}

impl Default for MarketSnapshot {
    fn default() -> Self {
        Self {
            ticker: "SPY".to_string(),
            spot: 100.0,
            risk_free_rate: 0.05,
            atm_vol: 0.20,
            dividend_yield: 0.0,
        }
    }
}
