/// Dividend schedule and curve types.

use serde::{Deserialize, Serialize};

/// Single dividend event.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DividendEvent {
    pub ex_date: String,
    pub amount: f64,
    pub declared_date: String,
    pub record_date: String,
    pub pay_date: String,
}

/// Dividend curve (projected dividends).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DividendCurve {
    pub underlying: String,
    pub current_yield: f64,
    pub implied_yield: f64,
    pub next_ex_date: String,
    pub events: Vec<DividendEvent>,
}

/// Sample dividend data for demo.
pub fn sample_dividend_curve() -> DividendCurve {
    DividendCurve {
        underlying: "SPY".to_string(),
        current_yield: 0.0125,
        implied_yield: 0.0130,
        next_ex_date: "2026-03-21".to_string(),
        events: vec![
            DividendEvent {
                ex_date: "2026-03-21".to_string(),
                amount: 1.62,
                declared_date: "2026-03-10".to_string(),
                record_date: "2026-03-22".to_string(),
                pay_date: "2026-04-30".to_string(),
            },
            DividendEvent {
                ex_date: "2026-06-20".to_string(),
                amount: 1.58,
                declared_date: "2026-06-10".to_string(),
                record_date: "2026-06-21".to_string(),
                pay_date: "2026-07-31".to_string(),
            },
            DividendEvent {
                ex_date: "2026-09-19".to_string(),
                amount: 1.55,
                declared_date: "2026-09-10".to_string(),
                record_date: "2026-09-20".to_string(),
                pay_date: "2026-10-31".to_string(),
            },
            DividendEvent {
                ex_date: "2026-12-19".to_string(),
                amount: 1.60,
                declared_date: "2026-12-10".to_string(),
                record_date: "2026-12-20".to_string(),
                pay_date: "2027-01-31".to_string(),
            },
        ],
    }
}
