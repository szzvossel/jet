/**
 * StrategyTab — Option Strategy tab.
 *
 * Accepts trader-style option quote strings, parses and prices them
 * server-side, and displays structured contract terms with BSM pricing
 * and Greeks in a grid.
 */

import { useState, useEffect, useRef } from "react";
import { StrategyInput } from "./StrategyInput";
import { StrategyGrid } from "./StrategyGrid";
import { StrategyPayoffChart } from "./StrategyPayoffChart";
import { StrategyGreeksChart } from "./StrategyGreeksChart";
import { priceStrategy } from "../../hooks/usePricing";
import { NumberDisplay } from "../shared/NumberDisplay";
import { useToast } from "../shared/Toast";
import { SkeletonCard, SkeletonTable } from "../shared/Skeleton";
import type { PricedStrategyResult } from "../../types";

const HISTORY_KEY = "jet-strategy-history";
const MAX_HISTORY = 10;

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(input: string) {
  const hist = loadHistory().filter((h) => h !== input);
  hist.unshift(input);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, MAX_HISTORY)));
}

export function StrategyTab() {
  const [result, setResult] = useState<PricedStrategyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(loadHistory);
  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleParse = async (input: string) => {
    setLoading(true);
    setError(null);
    try {
      const priced = await priceStrategy(input);
      setResult(priced);
      saveHistory(input);
      setHistory(loadHistory());
      addToast(`Parsed ${priced.strategy_name} (${priced.legs.length} leg${priced.legs.length > 1 ? "s" : ""})`, "success");
    } catch (e) {
      const msg = String(e);
      setError(msg);
      setResult(null);
      addToast("Parse failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto space-y-5">
        {error && (
          <div className="bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-3 rounded-lg text-sm flex items-center gap-2 animate-fade-up">
            <span className="text-red-500">&#x26A0;</span>
            {error}
          </div>
        )}

        <StrategyInput
          onParse={handleParse}
          loading={loading}
          inputRef={inputRef}
        />

        {/* Loading skeleton */}
        {loading && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <SkeletonCard />
              <SkeletonCard />
              <SkeletonCard />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
            <SkeletonTable />
          </>
        )}

        {/* Empty state */}
        {!result && !loading && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mb-4" style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-card-border)' }}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="text-slate-600"
              >
                <path d="M12 6v12M6 12h12" strokeLinecap="round" />
                <circle cx="12" cy="12" r="10" />
              </svg>
            </div>
            <h3 className="text-slate-300 text-base font-medium mb-1">
              No strategy loaded
            </h3>
            <p className="text-slate-600 text-sm mb-6 max-w-md">
              Enter an option strategy quote string above to get started.
              Use the examples below the input or hover the header to see supported strategies.
            </p>

            {/* Strategy history */}
            {history.length > 0 && (
              <div className="w-full max-w-lg">
                <h4 className="data-label mb-2 text-center">
                  Recent
                </h4>
                <div className="flex flex-wrap gap-1.5 justify-center">
                  {history.map((h) => (
                    <button
                      key={h}
                      onClick={() => handleParse(h)}
                      className="text-[11px] px-2 py-1 bg-slate-800/50 hover:bg-slate-700/60 text-slate-500 hover:text-slate-300 rounded border border-slate-700/30 transition-all duration-150 font-mono"
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {result && !loading && (
          <>
            {/* Strategy Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 stagger-grid">
              <div className="surface-card-static p-3.5 animate-fade-up">
                <div className="data-label">
                  Strategy
                </div>
                <div className="text-base font-semibold text-brand-400" style={{ fontFamily: "'DM Sans', sans-serif" }}>
                  {result.strategy_name}
                </div>
              </div>
              <div className="surface-card-static p-3.5 animate-fade-up">
                <div className="data-label">
                  Legs
                </div>
                <div className="data-value text-slate-100">
                  {result.legs.length}
                </div>
              </div>
              <div className="surface-card-static p-3.5 animate-fade-up">
                <div className="data-label">
                  Underlying
                </div>
                <div className="data-value text-slate-100">
                  {result.legs[0]?.symbol ?? "—"}
                </div>
              </div>
            </div>

            {/* Aggregate Greeks Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 stagger-grid">
              <div className="surface-card-static p-3.5 animate-fade-up">
                <div className="data-label">
                  Net Premium
                </div>
                <div className="data-value">
                  <NumberDisplay value={result.greeks.net_premium} decimals={2} colorize />
                </div>
              </div>
              <div className="surface-card-static p-3.5 animate-fade-up">
                <div className="data-label">
                  Net Delta
                </div>
                <div className="data-value">
                  <NumberDisplay value={result.greeks.net_delta} decimals={4} colorize />
                </div>
              </div>
              <div className="surface-card-static p-3.5 animate-fade-up">
                <div className="data-label">
                  Net Gamma
                </div>
                <div className="data-value">
                  <NumberDisplay value={result.greeks.net_gamma} decimals={4} colorize />
                </div>
              </div>
              <div className="surface-card-static p-3.5 animate-fade-up">
                <div className="data-label">
                  Net Vega
                </div>
                <div className="data-value">
                  <NumberDisplay value={result.greeks.net_vega} decimals={4} colorize />
                </div>
              </div>
              <div className="surface-card-static p-3.5 animate-fade-up">
                <div className="data-label">
                  Net Theta
                </div>
                <div className="data-value">
                  <NumberDisplay value={result.greeks.net_theta} decimals={4} colorize />
                </div>
              </div>
              <div className="surface-card-static p-3.5 animate-fade-up">
                <div className="data-label">
                  Net Rho
                </div>
                <div className="data-value">
                  <NumberDisplay value={result.greeks.net_rho} decimals={4} colorize />
                </div>
              </div>
            </div>

            {/* Strategy Payoff Diagram */}
            <StrategyPayoffChart legs={result.legs} />

            {/* Greeks Sensitivity Chart */}
            <StrategyGreeksChart legs={result.legs} />

            {/* Legs Grid */}
            <StrategyGrid legs={result.legs} />
          </>
        )}
      </div>
    </div>
  );
}
