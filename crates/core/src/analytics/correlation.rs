/// Correlation matrix types.

use serde::{Deserialize, Serialize};

/// Single correlation entry.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorrelationEntry {
    pub asset1: String,
    pub asset2: String,
    pub correlation: f64,
}

/// Correlation matrix for multiple assets.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CorrelationMatrix {
    pub assets: Vec<String>,
    pub correlations: Vec<Vec<f64>>,
}

/// Sample correlation matrix for demo.
pub fn sample_correlation_matrix() -> CorrelationMatrix {
    let assets = vec![
        "SPY".to_string(),
        "QQQ".to_string(),
        "IWM".to_string(),
        "DIA".to_string(),
        "EEM".to_string(),
        "TLT".to_string(),
    ];

    // Sample correlation matrix (symmetric)
    let correlations = vec![
        vec![1.00, 0.92, 0.95, 0.94, 0.82, -0.35],
        vec![0.92, 1.00, 0.88, 0.91, 0.78, -0.30],
        vec![0.95, 0.88, 1.00, 0.93, 0.80, -0.32],
        vec![0.94, 0.91, 0.93, 1.00, 0.79, -0.33],
        vec![0.82, 0.78, 0.80, 0.79, 1.00, -0.25],
        vec![-0.35, -0.30, -0.32, -0.33, -0.25, 1.00],
    ];

    CorrelationMatrix {
        assets,
        correlations,
    }
}

/// Sample pairwise correlation entries for table display.
pub fn sample_correlation_entries() -> Vec<CorrelationEntry> {
    let matrix = sample_correlation_matrix();
    let mut entries = Vec::new();

    for (i, asset1) in matrix.assets.iter().enumerate() {
        for (j, asset2) in matrix.assets.iter().enumerate() {
            if i < j {
                entries.push(CorrelationEntry {
                    asset1: asset1.clone(),
                    asset2: asset2.clone(),
                    correlation: matrix.correlations[i][j],
                });
            }
        }
    }

    entries
}
