/**
 * TracerTab — Log monitoring dashboard with KPI cards, charts, and event table.
 */

import { useState, useEffect, useCallback } from "react";
import { KpiCards } from "./KpiCards";
import { LogLevelChart } from "./LogLevelChart";
import { ThroughputChart } from "./ThroughputChart";
import { LatencyChart } from "./LatencyChart";
import { LogEventTable } from "./LogEventTable";
import { SourceBreakdown } from "./SourceBreakdown";
import { fetchTracerKpis } from "../../hooks/usePricing";
import type { TracerKpis } from "../../types";

const POLL_INTERVAL_MS = 3000;

export function TracerTab() {
  const [kpis, setKpis] = useState<TracerKpis | null>(null);

  const refresh = useCallback(() => {
    fetchTracerKpis().then(setKpis).catch(console.error);
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  if (!kpis) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-500 italic">Loading tracer data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
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
      </div>
    </div>
  );
}
