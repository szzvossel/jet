/// P&L attribution types.

use serde::{Deserialize, Serialize};

/// Single P&L attribution entry for one position.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PnlAttribution {
    pub position: String,
    pub portfolio: String,
    pub underlying: String,
    pub total_pnl: f64,
    pub delta_pnl: f64,
    pub gamma_pnl: f64,
    pub vega_pnl: f64,
    pub theta_pnl: f64,
    pub rho_pnl: f64,
    pub residual: f64,
}

/// Aggregated P&L explain across portfolio.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PnlExplain {
    pub positions: Vec<PnlAttribution>,
    pub total_pnl: f64,
    pub total_delta_pnl: f64,
    pub total_gamma_pnl: f64,
    pub total_vega_pnl: f64,
    pub total_theta_pnl: f64,
    pub total_rho_pnl: f64,
    pub total_residual: f64,
}

/// Sample P&L attribution data for demo.
pub fn sample_pnl_attribution() -> PnlExplain {
    let positions = vec![
        PnlAttribution {
            position: "SPY 100C Mar27".to_string(),
            portfolio: "Alpha".to_string(),
            underlying: "SPY".to_string(),
            total_pnl: 1250.00,
            delta_pnl: 980.00,
            gamma_pnl: 120.00,
            vega_pnl: 150.00,
            theta_pnl: -45.00,
            rho_pnl: 25.00,
            residual: 20.00,
        },
        PnlAttribution {
            position: "SPY 95P Mar27".to_string(),
            portfolio: "Hedge".to_string(),
            underlying: "SPY".to_string(),
            total_pnl: -320.00,
            delta_pnl: -280.00,
            gamma_pnl: 15.00,
            vega_pnl: -80.00,
            theta_pnl: 12.00,
            rho_pnl: 18.00,
            residual: -5.00,
        },
        PnlAttribution {
            position: "QQQ 150C Mar27".to_string(),
            portfolio: "Alpha".to_string(),
            underlying: "QQQ".to_string(),
            total_pnl: 890.00,
            delta_pnl: 720.00,
            gamma_pnl: 85.00,
            vega_pnl: 110.00,
            theta_pnl: -32.00,
            rho_pnl: 15.00,
            residual: -8.00,
        },
        PnlAttribution {
            position: "IWM 50P Mar27".to_string(),
            portfolio: "Hedge".to_string(),
            underlying: "IWM".to_string(),
            total_pnl: -150.00,
            delta_pnl: -120.00,
            gamma_pnl: 10.00,
            vega_pnl: -50.00,
            theta_pnl: 8.00,
            rho_pnl: 5.00,
            residual: -3.00,
        },
    ];

    PnlExplain {
        total_pnl: positions.iter().map(|p| p.total_pnl).sum(),
        total_delta_pnl: positions.iter().map(|p| p.delta_pnl).sum(),
        total_gamma_pnl: positions.iter().map(|p| p.gamma_pnl).sum(),
        total_vega_pnl: positions.iter().map(|p| p.vega_pnl).sum(),
        total_theta_pnl: positions.iter().map(|p| p.theta_pnl).sum(),
        total_rho_pnl: positions.iter().map(|p| p.rho_pnl).sum(),
        total_residual: positions.iter().map(|p| p.residual).sum(),
        positions,
    }
}
