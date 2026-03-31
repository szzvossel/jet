/// Core types for the pricing engine.
///
/// Defines the domain vocabulary: option types, option contracts, and the
/// structured result returned by any pricing model.

use serde::{Deserialize, Serialize};

/// European option flavor.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum OptionType {
    Call,
    Put,
}

impl std::fmt::Display for OptionType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            OptionType::Call => write!(f, "Call"),
            OptionType::Put => write!(f, "Put"),
        }
    }
}

/// A vanilla European option contract.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct OptionContract {
    /// Option type: call or put.
    pub option_type: OptionType,
    /// Strike price.
    pub strike: f64,
    /// Time to expiry in year-fraction (e.g. 0.25 = 3 months).
    pub time_to_expiry: f64,
}

impl OptionContract {
    pub fn new(option_type: OptionType, strike: f64, time_to_expiry: f64) -> Self {
        Self {
            option_type,
            strike,
            time_to_expiry,
        }
    }
}

/// Complete pricing output from any model.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct PricingResult {
    /// Option type that was priced.
    pub option_type: OptionType,
    /// Fair value of the option.
    pub price: f64,
    /// First-order Greeks.
    pub delta: f64,
    pub gamma: f64,
    pub vega: f64,
    pub theta: f64,
    pub rho: f64,
}

/// Market data snapshot required for pricing.
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
pub struct MarketData {
    /// Underlying spot price.
    pub spot: f64,
    /// Risk-free rate (annualized, continuously compounded).
    pub risk_free_rate: f64,
    /// Implied volatility (annualized).
    pub volatility: f64,
    /// Continuous dividend yield (annualized). Zero for non-dividend-paying
    /// underlyings.
    pub dividend_yield: f64,
}

impl MarketData {
    pub fn new(spot: f64, risk_free_rate: f64, volatility: f64) -> Self {
        Self {
            spot,
            risk_free_rate,
            volatility,
            dividend_yield: 0.0,
        }
    }

    pub fn with_dividend_yield(mut self, q: f64) -> Self {
        self.dividend_yield = q;
        self
    }
}

impl Default for MarketData {
    fn default() -> Self {
        Self {
            spot: 100.0,
            risk_free_rate: 0.05,
            volatility: 0.20,
            dividend_yield: 0.0,
        }
    }
}
