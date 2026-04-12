/**
 * StrategyTab — Option Strategy tab.
 *
 * Accepts trader-style option quote strings, parses and prices them
 * server-side, and displays structured contract terms with BSM pricing
 * and Greeks in a grid.
 */

import { useState } from "react";
import { StrategyInput } from "./StrategyInput";
import { StrategyGrid } from "./StrategyGrid";
import { priceStrategy } from "../../hooks/usePricing";
import { NumberDisplay } from "../shared/NumberDisplay";
import type { PricedStrategyResult } from "../../types";

export function StrategyTab() {
  const [result, setResult] = useState<PricedStrategyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleParse = async (input: string) => {
    setLoading(true);
    setError(null);
    try {
      const priced = await priceStrategy(input);
      setResult(priced);
    } catch (e) {
      setError(String(e));
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {error && (
          <div className="bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        <StrategyInput onParse={handleParse} loading={loading} />

        {result && (
          <>
            {/* Strategy Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Strategy
                </div>
                <div className="text-lg font-semibold text-brand-400">
                  {result.strategy_name}
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Legs
                </div>
                <div className="text-lg font-semibold text-slate-100">
                  {result.legs.length}
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Underlying
                </div>
                <div className="text-lg font-semibold text-slate-100">
                  {result.legs[0]?.symbol ?? "—"}
                </div>
              </div>
            </div>

            {/* Aggregate Greeks Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Net Premium
                </div>
                <div className="text-lg font-semibold">
                  <NumberDisplay value={result.greeks.net_premium} decimals={2} colorize />
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Net Delta
                </div>
                <div className="text-lg font-semibold">
                  <NumberDisplay value={result.greeks.net_delta} decimals={4} colorize />
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Net Gamma
                </div>
                <div className="text-lg font-semibold">
                  <NumberDisplay value={result.greeks.net_gamma} decimals={4} colorize />
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Net Vega
                </div>
                <div className="text-lg font-semibold">
                  <NumberDisplay value={result.greeks.net_vega} decimals={4} colorize />
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Net Theta
                </div>
                <div className="text-lg font-semibold">
                  <NumberDisplay value={result.greeks.net_theta} decimals={4} colorize />
                </div>
              </div>
              <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                <div className="text-xs text-slate-500 uppercase tracking-wider mb-1">
                  Net Rho
                </div>
                <div className="text-lg font-semibold">
                  <NumberDisplay value={result.greeks.net_rho} decimals={4} colorize />
                </div>
              </div>
            </div>

            {/* Legs Grid */}
            <StrategyGrid legs={result.legs} />
          </>
        )}
      </div>
    </div>
  );
}
