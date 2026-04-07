/// Yield curve types (zero, forward, discount, repo).

use serde::{Deserialize, Serialize};

/// Single point on a yield curve.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurvePoint {
    pub tenor: f64,
    pub rate: f64,
}

/// Multiple yield curves for display.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CurveData {
    pub curve_type: String,
    pub points: Vec<CurvePoint>,
}

/// Sample curve data for demo.
pub fn sample_curves() -> Vec<CurveData> {
    // Generate sample curves
    let tenors: Vec<f64> = vec![0.0833, 0.25, 0.5, 1.0, 2.0, 5.0, 10.0];

    // Zero curve (USD SOFR)
    let zero_rates: Vec<f64> = tenors
        .iter()
        .map(|&t| {
            // Simple upward-sloping curve
            0.04 + 0.01 * t.sqrt()
        })
        .collect();

    let zero_curve = CurveData {
        curve_type: "Zero (SOFR)".to_string(),
        points: tenors
            .iter()
            .zip(zero_rates.iter())
            .map(|(&t, &r)| CurvePoint { tenor: t, rate: r })
            .collect(),
    };

    // Forward curve (3M forward rates)
    let forward_rates: Vec<f64> = tenors
        .iter()
        .map(|&t| {
            // Forward rates slightly higher
            0.042 + 0.012 * t.sqrt()
        })
        .collect();

    let forward_curve = CurveData {
        curve_type: "Forward (3M)".to_string(),
        points: tenors
            .iter()
            .zip(forward_rates.iter())
            .map(|(&t, &r)| CurvePoint { tenor: t, rate: r })
            .collect(),
    };

    // Repo curve
    let repo_rates: Vec<f64> = tenors.iter().map(|&t| 0.05 + 0.005 * t).collect();

    let repo_curve = CurveData {
        curve_type: "Repo".to_string(),
        points: tenors
            .iter()
            .zip(repo_rates.iter())
            .map(|(&t, &r)| CurvePoint { tenor: t, rate: r })
            .collect(),
    };

    vec![zero_curve, forward_curve, repo_curve]
}
