/**
 * TracerTab — Log monitoring dashboard with KPI cards, charts, and event table.
 *
 * Logs are NOT loaded automatically. The user must click "Load Logs" to trigger
 * a one-time scan and start live monitoring.
 */

import { useState, useEffect, useCallback } from "react";
import { KpiCards } from "./KpiCards";
import { LogLevelChart } from "./LogLevelChart";
import { ThroughputChart } from "./ThroughputChart";
import { LatencyChart } from "./LatencyChart";
import { LogEventTable } from "./LogEventTable";
import { SourceBreakdown } from "./SourceBreakdown";
import { fetchTracerKpis, setWatchDir, loadLogs } from "../../hooks/usePricing";
import type { TracerKpis } from "../../types";

const POLL_INTERVAL_MS = 3000;
const LS_KEY = "tracer_watch_dir";

export function TracerTab() {
  const [kpis, setKpis] = useState<TracerKpis | null>(null);
  const [logDir, setLogDir] = useState(() => localStorage.getItem(LS_KEY) ?? "");
  const [error, setError] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(() => {
    fetchTracerKpis().then(setKpis).catch(console.error);
  }, []);

  // Poll for KPI updates only after the user has loaded logs
  useEffect(() => {
    if (!loaded) return;
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loaded, refresh]);

  const handleLoad = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await loadLogs();
      setLoaded(true);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [refresh]);

  const handleApply = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      await setWatchDir(logDir);
      localStorage.setItem(LS_KEY, logDir);
      setLoaded(true);
      refresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }, [logDir, refresh]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Config bar: log folder + load / apply buttons */}
        <div className="bg-slate-800 rounded-lg p-4 flex items-center gap-3">
          <label className="text-slate-300 text-sm font-medium">Log Folder</label>
          <input
            type="text"
            value={logDir}
            onChange={(e) => setLogDir(e.target.value)}
            className="flex-1 bg-slate-700 text-slate-100 rounded px-3 py-1.5 text-sm border border-slate-600 focus:border-brand-500 focus:outline-none"
            placeholder="/path/to/logs"
          />
          <button
            onClick={handleApply}
            disabled={loading || !logDir}
            className="px-4 py-1.5 bg-brand-600 hover:bg-brand-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded font-medium"
          >
            Apply
          </button>
          <button
            onClick={handleLoad}
            disabled={loading}
            className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm rounded font-medium"
          >
            {loading ? "Loading..." : "Load Logs"}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm">{error}</p>
        )}

        {!loaded ? (
          <div className="bg-slate-800 rounded-lg p-8 text-center">
            <p className="text-slate-400 text-lg mb-2">No logs loaded</p>
            <p className="text-slate-500 text-sm">
              Click <span className="text-emerald-400 font-medium">Load Logs</span> to scan the
              log folder, or enter a custom path and click{" "}
              <span className="text-brand-400 font-medium">Apply</span>.
            </p>
          </div>
        ) : !kpis ? (
          <p className="text-slate-500 italic">Loading tracer data...</p>
        ) : (
          <>
            {/* KPI summary cards */}
            <KpiCards kpis={kpis} />

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">
                  Log Level Distribution
                </h2>
                <LogLevelChart distribution={kpis.level_distribution} />
              </div>
              <div className="bg-slate-800 rounded-lg p-6">
                <h2 className="text-xl font-semibold text-slate-100 mb-4">
                  Throughput (Events/min)
                </h2>
                <ThroughputChart throughput={kpis.throughput} />
              </div>
            </div>

            {/* Latency */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">
                Latency Statistics
              </h2>
              <LatencyChart latency={kpis.latency} />
            </div>

            {/* Source breakdown */}
            <SourceBreakdown sources={kpis.sources} />

            {/* Log event table */}
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">
                Recent Log Events
              </h2>
              <LogEventTable />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
