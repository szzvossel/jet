use std::collections::HashMap;

use jet_core::pricing::types::{MarketData, OptionContract, OptionType, PricingResult};

/// Result of pricing a book entry against live spot.
#[derive(Debug, Clone)]
pub struct PricingRow {
    pub symbol: String,
    pub option_type: OptionType,
    pub strike: f64,
    pub time_to_expiry: f64,
    pub spot: f64,
    pub result: PricingResult,
}

/// Live pricing pipeline: maintains a book of contracts and re-prices
/// them when spot updates arrive.
pub struct PricingPipeline {
    /// Pre-configured contracts to price on each tick, grouped by symbol.
    book: HashMap<String, Vec<OptionContract>>,
    /// Risk-free rate and vol assumptions.
    rate: f64,
    vol: f64,
    /// Cached spot per symbol.
    spots: HashMap<String, f64>,
}

impl PricingPipeline {
    /// Build a default book with ATM calls and puts for each symbol.
    pub fn new(symbols: &[String], rate: f64, vol: f64) -> Self {
        let base_spots: HashMap<&str, f64> = [
            ("SPX", 5500.0),
            ("SPY", 500.0),
            ("QQQ", 400.0),
            ("IWM", 200.0),
            ("DIA", 400.0),
            ("EEM", 40.0),
            ("SX5E", 5000.0),
        ]
        .into_iter()
        .collect();

        let mut book: HashMap<String, Vec<OptionContract>> = HashMap::new();
        let mut spots = HashMap::new();

        for sym in symbols {
            let base = base_spots
                .get(sym.as_str())
                .copied()
                .unwrap_or(100.0);
            spots.insert(sym.clone(), base);

            let entries = vec![
                // ATM Call, 30D
                OptionContract::new(OptionType::Call, base, 30.0 / 365.25),
                // ATM Put, 30D
                OptionContract::new(OptionType::Put, base, 30.0 / 365.25),
                // 5% OTM Call, 30D
                OptionContract::new(OptionType::Call, base * 1.05, 30.0 / 365.25),
                // 5% OTM Put, 30D
                OptionContract::new(OptionType::Put, base * 0.95, 30.0 / 365.25),
            ];
            book.insert(sym.clone(), entries);
        }

        Self {
            book,
            rate,
            vol,
            spots,
        }
    }

    /// Update cached spot for a symbol. Returns priced rows if the symbol
    /// is in the book.
    pub fn on_spot_update(
        &mut self,
        symbol: &str,
        spot: f64,
    ) -> Result<Vec<PricingRow>, String> {
        self.spots.insert(symbol.to_string(), spot);

        let contracts = match self.book.get(symbol) {
            Some(c) => c,
            None => return Ok(Vec::new()),
        };

        let market = MarketData {
            spot,
            risk_free_rate: self.rate,
            volatility: self.vol,
            dividend_yield: 0.0,
        };

        let mut rows = Vec::with_capacity(contracts.len());
        for contract in contracts {
            let result = jet_core::pricing::black_scholes::price(contract, &market)?;
            rows.push(PricingRow {
                symbol: symbol.to_string(),
                option_type: contract.option_type,
                strike: contract.strike,
                time_to_expiry: contract.time_to_expiry,
                spot,
                result,
            });
        }

        Ok(rows)
    }
}
