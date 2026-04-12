/// Volatility surface and smile types.

use serde::{Deserialize, Serialize};

/// 7-coefficient parametric smile parameters.
///
/// `vol(K) = atm_vol + skew*m + c1*m² + c2*m³ + c3*m⁴ + c4*m⁵ + c5*m⁶`
/// where `m = ln(K/S)`.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VolSmileParams {
    pub atm_vol: f64,
    pub skew: f64,
    pub c1: f64,
    pub c2: f64,
    pub c3: f64,
    pub c4: f64,
    pub c5: f64,
}

impl VolSmileParams {
    pub fn evaluate(&self, strike: f64, spot: f64) -> f64 {
        let m = (strike / spot).ln();
        self.atm_vol
            + self.skew * m
            + self.c1 * m * m
            + self.c2 * m * m * m
            + self.c3 * m * m * m * m
            + self.c4 * m * m * m * m * m
            + self.c5 * m * m * m * m * m * m
    }
}

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
    pub params: VolSmileParams,
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

    // 7-coefficient parametric smile per tenor.
    // vol(K) = atm_vol + skew*m + c1*m² + c2*m³ + c3*m⁴ + c4*m⁵ + c5*m⁶
    // where m = ln(K/S).
    let smiles: Vec<VolSmile> = [
        // 1M
        (
            0.0833,
            VolSmileParams {
                atm_vol: 0.18,
                skew: -0.12,
                c1: 0.60,
                c2: 0.10,
                c3: -0.05,
                c4: 0.02,
                c5: -0.01,
            },
        ),
        // 3M
        (
            0.25,
            VolSmileParams {
                atm_vol: 0.20,
                skew: -0.10,
                c1: 0.50,
                c2: 0.08,
                c3: -0.03,
                c4: 0.01,
                c5: -0.005,
            },
        ),
        // 6M
        (
            0.5,
            VolSmileParams {
                atm_vol: 0.22,
                skew: -0.08,
                c1: 0.40,
                c2: 0.05,
                c3: -0.02,
                c4: 0.008,
                c5: -0.003,
            },
        ),
        // 1Y
        (
            1.0,
            VolSmileParams {
                atm_vol: 0.23,
                skew: -0.06,
                c1: 0.30,
                c2: 0.03,
                c3: -0.01,
                c4: 0.005,
                c5: -0.002,
            },
        ),
    ]
    .map(|(tenor, params)| {
        let strikes: Vec<f64> = (80..=120).step_by(5).map(|k| k as f64).collect();
        let vols: Vec<f64> = strikes.iter().map(|&k| params.evaluate(k, spot)).collect();
        VolSmile {
            tenor,
            strikes,
            vols,
            params,
        }
    })
    .to_vec();

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
