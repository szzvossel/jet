/// Pricing engine module.
///
/// Provides option pricing models, Greeks computation, and related types.

pub mod types;
pub mod black_scholes;
pub mod greeks;
pub mod binomial;
pub mod monte_carlo;

pub use types::{MarketData, OptionContract, OptionType, PricingResult};
