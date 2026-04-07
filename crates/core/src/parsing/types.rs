use serde::{Deserialize, Serialize};

/// Exercise style: American or European.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum ExerciseStyle {
    American,
    European,
}

/// Direction of a leg: Long or Short.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum Direction {
    Long,
    Short,
}

/// Option type: Call or Put.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "PascalCase")]
pub enum OptionKind {
    Call,
    Put,
}

/// A single parsed option leg.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ParsedLeg {
    pub symbol: String,
    pub expiry: String,
    pub strike: f64,
    pub strike_pct: f64,
    pub option_type: OptionKind,
    pub style: ExerciseStyle,
    pub quantity: i32,
    pub direction: Direction,
}

/// Full strategy parse result returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyParseResult {
    pub strategy_name: String,
    pub legs: Vec<ParsedLeg>,
}

/// A parsed leg enriched with BSM price and Greeks.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricedLeg {
    pub symbol: String,
    pub expiry: String,
    pub strike: f64,
    pub strike_pct: f64,
    pub option_type: OptionKind,
    pub style: ExerciseStyle,
    pub quantity: i32,
    pub direction: Direction,
    pub price: f64,
    pub delta: f64,
    pub gamma: f64,
    pub vega: f64,
    pub theta: f64,
    pub rho: f64,
}

/// Strategy-level aggregated Greeks.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyGreeks {
    pub net_premium: f64,
    pub net_delta: f64,
    pub net_gamma: f64,
    pub net_vega: f64,
    pub net_theta: f64,
    pub net_rho: f64,
}

/// Full pricing result for a strategy.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PricedStrategyResult {
    pub strategy_name: String,
    pub legs: Vec<PricedLeg>,
    pub greeks: StrategyGreeks,
}

/// Market assumptions for strategy pricing (all optional, with defaults).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StrategyMarketAssumptions {
    pub vol: f64,
    pub rate: f64,
    pub div_yield: f64,
}

impl Default for StrategyMarketAssumptions {
    fn default() -> Self {
        Self {
            vol: 0.20,
            rate: 0.05,
            div_yield: 0.0,
        }
    }
}

/// Map parsing OptionKind → pricing OptionType.
impl From<OptionKind> for crate::pricing::types::OptionType {
    fn from(kind: OptionKind) -> Self {
        match kind {
            OptionKind::Call => crate::pricing::types::OptionType::Call,
            OptionKind::Put => crate::pricing::types::OptionType::Put,
        }
    }
}
