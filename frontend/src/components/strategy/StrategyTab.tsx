/**
 * StrategyTab — Option Strategy tab.
 *
 * Accepts trader-style option quote strings, parses and prices them
 * server-side, and displays structured contract terms with BSM pricing
 * and Greeks in a grid.
 * State persists across tab switches via useStrategyStore.
 */

import { useEffect, useRef } from "react";
import { StrategyInput } from "./StrategyInput";
import { StrategyGrid } from "./StrategyGrid";
import { StrategyPayoffChart } from "./StrategyPayoffChart";
import { StrategyGreeksChart } from "./StrategyGreeksChart";
import { StrategyCheatsheet } from "./StrategyCheatsheet";
import { priceStrategy } from "../../hooks/usePricing";
import { NumberDisplay } from "../shared/NumberDisplay";
import { useToast } from "../shared/Toast";
import { SkeletonCard, SkeletonTable } from "../shared/Skeleton";
import { useStrategyStore } from "../../stores/useStrategyStore";

export function StrategyTab() {
  const result = useStrategyStore((s) => s.result);
  const error = useStrategyStore((s) => s.error);
  const loading = useStrategyStore((s) => s.loading);
  const history = useStrategyStore((s) => s.history);
  const showCheatsheet = useStrategyStore((s) => s.showCheatsheet);

  const setResult = useStrategyStore((s) => s.setResult);
  const setError = useStrategyStore((s) => s.setError);
  const setLoading = useStrategyStore((s) => s.setLoading);
  const addHistory = useStrategyStore((s) => s.addHistory);
  const setShowCheatsheet = useStrategyStore((s) => s.setShowCheatsheet);
  const toggleCheatsheet = useStrategyStore((s) => s.toggleCheatsheet);

  const inputRef = useRef<HTMLInputElement>(null);
  const { addToast } = useToast();

  // Auto-focus the input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Cmd+` to toggle cheatsheet, Escape to close.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "`" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCheatsheet();
      }
      if (e.key === "Escape") {
        setShowCheatsheet(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCheatsheet, setShowCheatsheet]);

  const handleParse = async (input: string) => {
    setLoading(true);
    setError(null);
    try {
      const priced = await priceStrategy(input);
      setResult(priced);
      addHistory(input);
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
          onCheatsheet={() => setShowCheatsheet(true)}
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

        {/* Cheatsheet shortcut hint */}
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setShowCheatsheet(true)}
            className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors flex items-center gap-1"
          >
            <kbd className="px-1 py-0.5 rounded bg-slate-800/80 text-slate-600 border border-slate-700/50 font-mono text-[9px]">⌘`</kbd>
            Cheatsheet
          </button>
        </div>
      </div>

      {/* Cheatsheet modal */}
      {showCheatsheet && (
        <StrategyCheatsheet onClose={() => setShowCheatsheet(false)} />
      )}
    </div>
  );
}
