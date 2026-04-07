/// Analytics module for derived data, risk, and P&L.
///
/// Provides types and functions for:
/// - Volatility surfaces and smiles
/// - Yield curves (zero, forward, discount, repo)
/// - Dividend schedules and curves
/// - Correlation matrices
/// - P&L attribution

pub mod volatility;
pub mod curves;
pub mod dividends;
pub mod correlation;
pub mod pnl;

pub use volatility::*;
pub use curves::*;
pub use dividends::*;
pub use correlation::*;
pub use pnl::*;
