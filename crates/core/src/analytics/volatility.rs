/// Volatility surface and smile types.

use serde::{Deserialize, Serialize};

/// Single point on a volatility surface (strike × tenor).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolSurfacePoint {
    pub strike: f64,
    pub tenor: f64,
    pub volatility: f64,
}

/// Volatility smile for a single tenor.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolSmile {
    pub tenor: f64,
    pub strikes: Vec<f64>,
    pub vols: Vec<f64>,
}

/// Historical volatility measurement.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HistoricalVol {
    pub date: String,
    pub realized_vol: f64,
    pub implied_vol: f64,
}

/// Full volatility surface (multiple tenors × strikes).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolSurface {
    pub underlying: String,
    pub spot: f64,
    pub smiles: Vec<VolSmile>,
}

/// Sample vol surface data for demo.
pub fn sample_vol_surface() -> VolSurface {
    let spot = 100.0;

    // Generate ATM vol + skew (simplified model)
    let tenors = [0.0833, 0.25, 0.5, 1.0]; // 1M, 3M, 6M, 1Y
    let atm_vols = [0.18, 0.20, 0.22, 0.23];

    let smiles: Vec<VolSmile> = tenors
        .iter()
        .zip(atm_vols.iter())
        .map(|(&t, &atm_vol)| {
            let strikes: Vec<f64> = (80..=120).step_by(5).map(|k| k as f64).collect();
            let vols: Vec<f64> = strikes
                .iter()
                .map(|&k| {
                    let moneyness = (k / spot).ln();
                    // Simple skew model: vol = ATM + skew * moneyness + curvature * moneyness^2
                    let skew = -0.10;
                    let curvature = 0.50;
                    atm_vol + skew * moneyness + curvature * moneyness * moneyness
                })
                .collect();
            VolSmile {
                tenor: t,
                strikes,
                vols,
            }
        })
        .collect();

    VolSurface {
        underlying: "SPY".to_string(),
        spot,
        smiles,
    }
}

/// Sample historical vol data for demo.
pub fn sample_historical_vol() -> Vec<HistoricalVol> {
    vec![
        HistoricalVol {
            date: "2026-01-15".to_string(),
            realized_vol: 0.18,
            implied_vol: 0.20,
        },
        HistoricalVol {
            date: "2026-02-15".to_string(),
            realized_vol: 0.19,
            implied_vol: 0.21,
        },
        HistoricalVol {
            date: "2026-03-15".to_string(),
            realized_vol: 0.17,
            implied_vol: 0.19,
        },
    ]
}
