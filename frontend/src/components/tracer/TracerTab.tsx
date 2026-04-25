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
    <div className="p-5">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Config bar: log folder + load / apply buttons */}
        <div className="surface-card-static p-3.5 flex items-center gap-3">
          <label className="data-label shrink-0">Log Folder</label>
          <input
            type="text"
            value={logDir}
            onChange={(e) => setLogDir(e.target.value)}
            className="flex-1 input-refined px-3 py-1.5 text-sm"
            placeholder="/path/to/logs"
          />
          <button
            onClick={handleApply}
            disabled={loading || !logDir}
            className="btn-primary px-4 py-1.5 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Apply
          </button>
          <button
            onClick={handleLoad}
            disabled={loading}
            className="px-4 py-1.5 text-sm rounded font-medium transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              backgroundColor: loading ? "rgba(34, 197, 94, 0.3)" : "rgba(34, 197, 94, 0.2)",
              color: "#4ade80",
              border: "1px solid rgba(34, 197, 94, 0.3)",
            }}
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 border-2 border-green-400/40 border-t-green-400 rounded-full animate-spin" />
                Loading...
              </span>
            ) : "Load Logs"}
          </button>
        </div>

        {error && (
          <div className="surface-card-static p-3.5" style={{ borderLeft: "3px solid #ef4444" }}>
            <p className="text-sm" style={{ color: "#f87171" }}>{error}</p>
          </div>
        )}

        {!loaded ? (
          <div className="surface-card-static p-8 text-center animate-fade-up">
            <div className="text-slate-400 text-lg mb-2">No logs loaded</div>
            <p className="text-slate-500 text-sm">
              Click <span style={{ color: "#4ade80" }} className="font-medium">Load Logs</span> to scan the
              log folder, or enter a custom path and click{" "}
              <span style={{ color: "#818cf8" }} className="font-medium">Apply</span>.
            </p>
          </div>
        ) : !kpis ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-card-static p-3.5 animate-pulse">
                <div className="h-2.5 bg-slate-700/50 rounded w-20 mb-3" />
                <div className="h-5 bg-slate-700/40 rounded w-24" />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* KPI summary cards */}
            <KpiCards kpis={kpis} />

            {/* Charts row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="surface-card-static p-4 animate-fade-up">
                <span className="data-label">Log Level Distribution</span>
                <div className="mt-3">
                  <LogLevelChart distribution={kpis.level_distribution} />
                </div>
              </div>
              <div className="surface-card-static p-4 animate-fade-up">
                <span className="data-label">Throughput (Events/min)</span>
                <div className="mt-3">
                  <ThroughputChart throughput={kpis.throughput} />
                </div>
              </div>
            </div>

            {/* Latency */}
            <div className="surface-card-static p-4 animate-fade-up">
              <span className="data-label">Latency Statistics</span>
              <div className="mt-3">
                <LatencyChart latency={kpis.latency} />
              </div>
            </div>

            {/* Source breakdown */}
            <SourceBreakdown sources={kpis.sources} />

            {/* Log event table */}
            <div className="surface-card-static p-4 animate-fade-up">
              <span className="data-label">Recent Log Events</span>
              <div className="mt-3">
                <LogEventTable />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
