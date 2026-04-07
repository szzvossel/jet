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

// ---------------------------------------------------------------------------
// Analytics types — Derived Data
// ---------------------------------------------------------------------------

export interface VolSurfacePoint {
  strike: number;
  tenor: number;
  volatility: number;
}

export interface VolSmile {
  tenor: number;
  strikes: number[];
  vols: number[];
}

export interface HistoricalVol {
  date: string;
  realized_vol: number;
  implied_vol: number;
}

export interface VolSurface {
  underlying: string;
  spot: number;
  smiles: VolSmile[];
}

export interface CurvePoint {
  tenor: number;
  rate: number;
}

export interface CurveData {
  curve_type: string;
  points: CurvePoint[];
}

export interface DividendEvent {
  ex_date: string;
  amount: number;
  declared_date: string;
  record_date: string;
  pay_date: string;
}

export interface DividendCurve {
  underlying: string;
  current_yield: number;
  implied_yield: number;
  next_ex_date: string;
  events: DividendEvent[];
}

export interface CorrelationEntry {
  asset1: string;
  asset2: string;
  correlation: number;
}

export interface CorrelationMatrix {
  assets: string[];
  correlations: number[][];
}

// ---------------------------------------------------------------------------
// Risk types
// ---------------------------------------------------------------------------

export interface PositionRisk {
  position: string;
  underlying: string;
  quantity: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  epsilon: number;
  rho: number;
  notional: number;
}

export interface RiskSummary {
  positions: PositionRisk[];
  total_delta: number;
  total_gamma: number;
  total_vega: number;
  total_theta: number;
  total_epsilon: number;
  total_rho: number;
}

// ---------------------------------------------------------------------------
// P&L types
// ---------------------------------------------------------------------------

export interface PnlAttribution {
  position: string;
  underlying: string;
  total_pnl: number;
  delta_pnl: number;
  gamma_pnl: number;
  vega_pnl: number;
  theta_pnl: number;
  rho_pnl: number;
  residual: number;
}

export interface PnlExplain {
  positions: PnlAttribution[];
  total_pnl: number;
  total_delta_pnl: number;
  total_gamma_pnl: number;
  total_vega_pnl: number;
  total_theta_pnl: number;
  total_rho_pnl: number;
  total_residual: number;
}

// ---------------------------------------------------------------------------
// Option Strategy Parser types
// ---------------------------------------------------------------------------

export type ExerciseStyle = "American" | "European";
export type Direction = "Long" | "Short";

export interface ParsedLeg {
  symbol: string;
  expiry: string;
  strike: number;
  strike_pct: number;
  option_type: "Call" | "Put";
  style: ExerciseStyle;
  quantity: number;
  direction: Direction;
}

export interface StrategyParseResult {
  strategy_name: string;
  legs: ParsedLeg[];
}

export interface PricedLeg {
  symbol: string;
  expiry: string;
  strike: number;
  strike_pct: number;
  option_type: "Call" | "Put";
  style: ExerciseStyle;
  quantity: number;
  direction: Direction;
  price: number;
  delta: number;
  gamma: number;
  vega: number;
  theta: number;
  rho: number;
}

export interface StrategyGreeks {
  net_premium: number;
  net_delta: number;
  net_gamma: number;
  net_vega: number;
  net_theta: number;
  net_rho: number;
}

export interface PricedStrategyResult {
  strategy_name: string;
  legs: PricedLeg[];
  greeks: StrategyGreeks;
}

export interface StrategyMarketAssumptions {
  vol: number;
  rate: number;
  div_yield: number;
}
