/**
 * Pricing API adapter — routes calls to either local (Tauri IPC) or
 * remote (HTTP) backend.
 *
 * The active backend is controlled via `setBackend()`. It defaults to "local".
 */

import { localBackend } from "./localBackend";
import { createRemoteBackend } from "./remoteBackend";
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

// ---------------------------------------------------------------------------
// Backend type — both local and remote expose the same shape
// ---------------------------------------------------------------------------

type Backend = typeof localBackend;

let backend: Backend = localBackend;

// ---------------------------------------------------------------------------
// Logging helper
// ---------------------------------------------------------------------------

let currentUrl = "";

function logRoute(fn: string) {
  const mode = backend === localBackend ? "local" : "remote";
  const target = mode === "local" ? "Tauri IPC" : currentUrl;
  console.log(`[${fn}] → ${mode} (${target})`);
}

// ---------------------------------------------------------------------------
// Backend selector
// ---------------------------------------------------------------------------

export type BackendMode = "local" | "remote";

/**
 * Switch the pricing backend.
 * - "local"  → Tauri IPC (invoke)
 * - "remote" → HTTP fetch to the Axum server at the given URL
 */
export function setBackend(mode: BackendMode, url?: string) {
  if (mode === "remote") {
    currentUrl = url ?? "http://localhost:3000";
    backend = createRemoteBackend(currentUrl);
  } else {
    currentUrl = "";
    backend = localBackend;
  }
  console.log(`[setBackend] mode=${mode}${currentUrl ? ` url=${currentUrl}` : ""}`);
}

/**
 * Get the current backend mode by checking whether we're using localBackend.
 */
export function getBackendMode(): BackendMode {
  return backend === localBackend ? "local" : "remote";
}

// ---------------------------------------------------------------------------
// Pricing
// ---------------------------------------------------------------------------

export async function priceOption(
  contract: OptionContract,
  market: MarketData,
): Promise<PricingResult> {
  logRoute("priceOption");
  return backend.priceOption(contract, market);
}

export async function priceCurve(
  contract: OptionContract,
  market: MarketData,
  spotRange: [number, number],
  numPoints: number,
): Promise<Array<{ spot: number; price: number }>> {
  logRoute("priceCurve");
  return backend.priceCurve(contract, market, spotRange, numPoints);
}

export async function greeksCurve(
  request: GreeksCurveRequest,
): Promise<GreeksCurveResult> {
  logRoute("greeksCurve");
  return backend.greeksCurve(request);
}

// ---------------------------------------------------------------------------
// Analytics — Derived Data
// ---------------------------------------------------------------------------

export async function fetchVolSurface(): Promise<VolSurface> {
  logRoute("fetchVolSurface");
  return backend.fetchVolSurface();
}

export async function fetchCurves(): Promise<CurveData[]> {
  logRoute("fetchCurves");
  return backend.fetchCurves();
}

export async function fetchDividendCurve(): Promise<DividendCurve> {
  logRoute("fetchDividendCurve");
  return backend.fetchDividendCurve();
}

export async function fetchCorrelationMatrix(): Promise<CorrelationMatrix> {
  logRoute("fetchCorrelationMatrix");
  return backend.fetchCorrelationMatrix();
}

export async function fetchCorrelationEntries(): Promise<CorrelationEntry[]> {
  logRoute("fetchCorrelationEntries");
  return backend.fetchCorrelationEntries();
}

// ---------------------------------------------------------------------------
// Risk
// ---------------------------------------------------------------------------

export async function fetchRiskSummary(): Promise<RiskSummary> {
  logRoute("fetchRiskSummary");
  return backend.fetchRiskSummary();
}

// ---------------------------------------------------------------------------
// P&L
// ---------------------------------------------------------------------------

export async function fetchPnlAttribution(): Promise<PnlExplain> {
  logRoute("fetchPnlAttribution");
  return backend.fetchPnlAttribution();
}

// ---------------------------------------------------------------------------
// Option Strategy Parser
// ---------------------------------------------------------------------------

export async function parseStrategy(input: string): Promise<StrategyParseResult> {
  logRoute("parseStrategy");
  return backend.parseStrategy(input);
}

export async function priceStrategy(
  input: string,
  assumptions?: StrategyMarketAssumptions,
): Promise<PricedStrategyResult> {
  logRoute("priceStrategy");
  return backend.priceStrategy(input, assumptions);
}

// ---------------------------------------------------------------------------
// Tracer — Log Monitoring
// ---------------------------------------------------------------------------

export async function fetchTracerKpis(): Promise<TracerKpis> {
  logRoute("fetchTracerKpis");
  return backend.fetchTracerKpis();
}

export async function fetchTracerEvents(
  page: number,
  pageSize: number,
): Promise<LogEventList> {
  logRoute("fetchTracerEvents");
  return backend.fetchTracerEvents(page, pageSize);
}
