/**
 * Type definitions mirroring the Rust backend types.
 * These must stay in sync with src-tauri/src/pricing/types.rs
 */

export type OptionType = "Call" | "Put";

export interface OptionContract {
  option_type: OptionType;
  strike: number;
  time_to_expiry: number;
}

export interface MarketData {
  spot: number;
  risk_free_rate: number;
  volatility: number;
  dividend_yield: number;
}

export interface PricingResult {
  option_type: OptionType;
  price: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export interface PriceCurvePoint {
  spot: number;
  price: number;
}

export interface GreeksCurveRequest {
  contract: OptionContract;
  market: MarketData;
  spot_range: [number, number];
  num_points: number;
}

export interface GreeksCurveResult {
  spots: number[];
  prices: number[];
  deltas: number[];
  gammas: number[];
  vegas: number[];
  thetas: number[];
}
