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

export interface VolSmileParams {
  atm_vol: number;
  skew: number;
  c1: number;
  c2: number;
  c3: number;
  c4: number;
  c5: number;
}

export interface VolSmile {
  tenor: number;
  strikes: number[];
  vols: number[];
  params: VolSmileParams;
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

// ---------------------------------------------------------------------------
// Tracer types — Log Monitoring
// ---------------------------------------------------------------------------

export type LogLevel = "TRACE" | "DEBUG" | "INFO" | "WARN" | "ERROR";

export interface LogEvent {
  timestamp: string;
  level: LogLevel;
  target: string;
  thread_id: string;
  source_name: string;
  message: string;
  tracer_id: number | null;
  elapsed_ms: number | null;
  raw_line: string;
}

export interface LogLevelDistribution {
  trace: number;
  debug: number;
  info: number;
  warn: number;
  error: number;
}

export interface LatencyStats {
  min_ms: number | null;
  max_ms: number | null;
  avg_ms: number | null;
  p50_ms: number | null;
  p95_ms: number | null;
  p99_ms: number | null;
  sample_count: number;
}

export interface ThroughputPoint {
  bucket: string;
  count: number;
}

export interface SourceStats {
  source: string;
  total_events: number;
  error_count: number;
  level_distribution: LogLevelDistribution;
  latency: LatencyStats;
}

export interface TracerKpis {
  total_events: number;
  error_rate: number;
  level_distribution: LogLevelDistribution;
  latency: LatencyStats;
  throughput: ThroughputPoint[];
  sources: SourceStats[];
  monitored_files: string[];
  last_updated: string;
}

export interface LogEventList {
  events: LogEvent[];
  total_count: number;
  has_more: boolean;
}

// ---------------------------------------------------------------------------
// Bus types — WebSocket Pub/Sub (jet-bus)
// ---------------------------------------------------------------------------

export type EventKind =
  | "price_update"
  | "greeks_update"
  | "vol_surface_shift"
  | "risk_alert"
  | "pnl_snapshot"
  | "market_snapshot";

export type Channel =
  | { type: "symbol"; value: string }
  | { type: "event_type"; value: EventKind }
  | { type: "strategy"; value: string }
  | { type: "all" };

export interface EventId {
  "0": number;
}

export type PriceTickType = "last" | "bid" | "ask";

export interface PriceUpdatePayload {
  type: "price_update";
  data: {
    symbol: string;
    tick_type: PriceTickType;
    price: number;
    size: number;
  };
}

export interface GreeksUpdatePayload {
  type: "greeks_update";
  data: {
    symbol: string;
    delta: number;
    gamma: number;
    vega: number;
    theta: number;
    rho: number;
  };
}

export interface VolSurfaceShiftPayload {
  type: "vol_surface_shift";
  data: {
    symbol: string;
    atm_vol: number;
    skew: number;
  };
}

export interface RiskAlertPayload {
  type: "risk_alert";
  data: {
    message: string;
    severity: string;
  };
}

export interface PnlSnapshotPayload {
  type: "pnl_snapshot";
  data: {
    total_pnl: number;
    delta_pnl: number;
    gamma_pnl: number;
    vega_pnl: number;
    theta_pnl: number;
  };
}

export interface MarketSnapshotPayload {
  type: "market_snapshot";
  data: {
    symbol: string;
    spot: number;
    bid: number;
    ask: number;
    volume: number;
    implied_vol: number;
  };
}

export type EventPayload =
  | PriceUpdatePayload
  | GreeksUpdatePayload
  | VolSurfaceShiftPayload
  | RiskAlertPayload
  | PnlSnapshotPayload
  | MarketSnapshotPayload;

export interface MarketEvent {
  id: number;
  timestamp: string;
  kind: EventKind;
  channel: Channel;
  payload: EventPayload;
}

export type ClientMessage =
  | { action: "subscribe"; channels: Channel[] }
  | { action: "unsubscribe"; channels: Channel[] }
  | { action: "list_subscriptions" }
  | { action: "ping"; client_time: number };

export type ServerMessage =
  | { type: "event"; event: MarketEvent }
  | { type: "subscribed"; channels: Channel[] }
  | { type: "unsubscribed"; channels: Channel[] }
  | { type: "subscriptions"; channels: Channel[] }
  | { type: "pong"; client_time: number; server_time: number }
  | { type: "error"; code: string; message: string }
  | { type: "lagged"; missed: number };

export interface BusMetrics {
  events_published: number;
  active_sessions: number;
  total_connections: number;
  total_subscriptions: number;
  lag_errors: number;
}
