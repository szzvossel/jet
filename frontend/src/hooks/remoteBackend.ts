/**
 * Remote backend — wraps fetch() calls to the Axum HTTP server.
 *
 * Each function mirrors the localBackend signatures so they're interchangeable.
 */

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

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}

export function createRemoteBackend(baseUrl: string) {
  const base = baseUrl.replace(/\/$/, "");

  return {
    priceOption: (contract: OptionContract, market: MarketData) =>
      postJson<PricingResult>(`${base}/api/price-option`, { contract, market }),

    priceCurve: (
      contract: OptionContract,
      market: MarketData,
      spotRange: [number, number],
      numPoints: number,
    ) =>
      postJson<Array<{ spot: number; price: number }>>(`${base}/api/price-curve`, {
        contract,
        market,
        spot_range: spotRange,
        num_points: numPoints,
      }),

    greeksCurve: (request: GreeksCurveRequest) =>
      postJson<GreeksCurveResult>(`${base}/api/greeks-curve`, {
        contract: request.contract,
        market: request.market,
        spot_range: request.spot_range,
        num_points: request.num_points,
      }),

    fetchVolSurface: () => getJson<VolSurface>(`${base}/api/vol-surface`),

    fetchCurves: () => getJson<CurveData[]>(`${base}/api/curves`),

    fetchDividendCurve: () => getJson<DividendCurve>(`${base}/api/dividend-curve`),

    fetchCorrelationMatrix: () => getJson<CorrelationMatrix>(`${base}/api/correlation-matrix`),

    fetchCorrelationEntries: () => getJson<CorrelationEntry[]>(`${base}/api/correlation-entries`),

    fetchRiskSummary: () => getJson<RiskSummary>(`${base}/api/risk-summary`),

    fetchPnlAttribution: () => getJson<PnlExplain>(`${base}/api/pnl-attribution`),

    parseStrategy: (input: string) =>
      postJson<StrategyParseResult>(`${base}/api/parse-strategy`, { input }),

    priceStrategy: (input: string, assumptions?: StrategyMarketAssumptions) =>
      postJson<PricedStrategyResult>(`${base}/api/price-strategy`, {
        input,
        assumptions: assumptions ?? null,
      }),

    fetchTracerKpis: () => getJson<TracerKpis>(`${base}/api/tracer/kpis`),

    fetchTracerEvents: (page: number, pageSize: number) =>
      getJson<LogEventList>(
        `${base}/api/tracer/events?page=${page}&page_size=${pageSize}`,
      ),
  };
}
