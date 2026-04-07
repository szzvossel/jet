/**
 * StrategyTab — Option Strategy tab.
 *
 * Accepts trader-style option quote strings, parses and prices them
 * server-side, and displays structured contract terms with BSM pricing
 * and Greeks in a grid.
 */

import { useState, useEffect } from "react";
import { StrategyInput } from "./StrategyInput";
import { StrategyGrid } from "./StrategyGrid";
import { priceStrategy, setBackend } from "../../hooks/usePricing";
import type { BackendMode } from "../../hooks/usePricing";
import { NumberDisplay } from "../shared/NumberDisplay";
import type { PricedStrategyResult } from "../../types";

const BACKEND_KEY = "jet-backend-mode";
const REMOTE_URL_KEY = "jet-remote-url";

export function StrategyTab() {
  const [result, setResult] = useState<PricedStrategyResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Backend selector state, initialized from localStorage
  const [backendMode, setBackendMode] = useState<BackendMode>(() => {
    return (localStorage.getItem(BACKEND_KEY) as BackendMode) || "local";
  });
  const [remoteUrl, setRemoteUrl] = useState<string>(
    () => localStorage.getItem(REMOTE_URL_KEY) || "http://localhost:3000",
  );

  // Apply backend on mount and when it changes
  useEffect(() => {
    setBackend(backendMode, remoteUrl);
    localStorage.setItem(BACKEND_KEY, backendMode);
  }, [backendMode, remoteUrl]);

  useEffect(() => {
    localStorage.setItem(REMOTE_URL_KEY, remoteUrl);
  }, [remoteUrl]);

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
        {/* Backend Selector */}
        <div className="flex items-center gap-4 text-sm">
          <span className="text-slate-400 uppercase tracking-wider text-xs">
            Backend
          </span>
          <div className="flex rounded-lg border border-slate-600 overflow-hidden">
            <button
              onClick={() => setBackendMode("local")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                backendMode === "local"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Local
            </button>
            <button
              onClick={() => setBackendMode("remote")}
              className={`px-3 py-1 text-xs font-medium transition-colors ${
                backendMode === "remote"
                  ? "bg-indigo-600 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              Remote
            </button>
          </div>
          {backendMode === "remote" && (
            <input
              type="text"
              value={remoteUrl}
              onChange={(e) => setRemoteUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 w-56 focus:outline-none focus:border-indigo-500"
            />
          )}
          <span className="text-slate-500 text-xs">
            {backendMode === "local" ? "Tauri IPC" : `HTTP → ${remoteUrl}`}
          </span>
        </div>

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
