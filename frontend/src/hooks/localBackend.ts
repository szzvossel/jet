/**
 * Local backend — wraps Tauri invoke() calls.
 *
 * Each function mirrors the Tauri IPC command signatures exactly.
 */

import { invoke } from "@tauri-apps/api/core";
import type {
  OptionContract,
  MarketData,
  PricingResult,
  GreeksCurveRequest,
  GreeksCurveResult,
  VolSurface,
  CurveData,
  DividendCurve,
  CorrelationMatrix,
  CorrelationEntry,
  RiskSummary,
  PnlExplain,
  StrategyParseResult,
  PricedStrategyResult,
  StrategyMarketAssumptions,
  TracerKpis,
  LogEventList,
} from "../types";

export const localBackend = {
  priceOption: (contract: OptionContract, market: MarketData) =>
    invoke<PricingResult>("price_option", { contract, market }),

  priceCurve: (
    contract: OptionContract,
    market: MarketData,
    spotRange: [number, number],
    numPoints: number,
  ) =>
    invoke<Array<{ spot: number; price: number }>>("price_curve", {
      contract,
      market,
      spotRange,
      numPoints,
    }),

  greeksCurve: (request: GreeksCurveRequest) =>
    invoke<GreeksCurveResult>("greeks_curve", { request }),

  fetchVolSurface: () => invoke<VolSurface>("get_vol_surface"),

  fetchCurves: () => invoke<CurveData[]>("get_curves"),

  fetchDividendCurve: () => invoke<DividendCurve>("get_dividend_curve"),

  fetchCorrelationMatrix: () => invoke<CorrelationMatrix>("get_correlation_matrix"),

  fetchCorrelationEntries: () => invoke<CorrelationEntry[]>("get_correlation_entries"),

  fetchRiskSummary: () => invoke<RiskSummary>("get_risk_summary"),

  fetchPnlAttribution: () => invoke<PnlExplain>("get_pnl_attribution"),

  parseStrategy: (input: string) =>
    invoke<StrategyParseResult>("parse_strategy", { input }),

  priceStrategy: (input: string, assumptions?: StrategyMarketAssumptions) =>
    invoke<PricedStrategyResult>("price_strategy", { input, assumptions }),

  fetchTracerKpis: () => invoke<TracerKpis>("tracer_get_kpis"),

  fetchTracerEvents: (page: number, pageSize: number) =>
    invoke<LogEventList>("tracer_get_events", { page, pageSize }),
};
