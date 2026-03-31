/// Mathematical utility functions for the pricing engine.
///
/// Thin wrappers around `statrs` distributions to provide the specific
/// functions needed in derivatives pricing (standard Normal CDF, PDF, etc.).

use statrs::distribution::{Continuous, ContinuousCDF, Normal};

/// Standard Normal cumulative distribution function: Phi(x) = P(Z <= x).
///
/// This is the workhorse of Black-Scholes and virtually every closed-form
/// pricing formula. We use the highly accurate implementation from `statrs`.
pub fn norm_cdf(x: f64) -> f64 {
    let normal = Normal::new(0.0, 1.0).unwrap();
    normal.cdf(x)
}

/// Standard Normal probability density function: phi(x).
pub fn norm_pdf(x: f64) -> f64 {
    let normal = Normal::new(0.0, 1.0).unwrap();
    normal.pdf(x)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_norm_cdf_at_zero() {
        let result = norm_cdf(0.0);
        assert!((result - 0.5).abs() < 1e-10, "Phi(0) should be 0.5");
    }

    #[test]
    fn test_norm_cdf_symmetry() {
        // Phi(-x) = 1 - Phi(x)
        let x = 1.96;
        let left = norm_cdf(-x);
        let right = 1.0 - norm_cdf(x);
        assert!((left - right).abs() < 1e-10);
    }

    #[test]
    fn test_norm_pdf_at_zero() {
        let result = norm_pdf(0.0);
        let expected = 1.0 / (2.0 * std::f64::consts::PI).sqrt();
        assert!((result - expected).abs() < 1e-10);
    }

    #[test]
    fn test_norm_cdf_known_values() {
        // Phi(1.96) ~= 0.975
        let result = norm_cdf(1.96);
        assert!((result - 0.9750).abs() < 0.001);

        // Phi(-1.96) ~= 0.025
        let result = norm_cdf(-1.96);
        assert!((result - 0.0250).abs() < 0.001);
    }
}
