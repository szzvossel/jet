/**
 * SourceBreakdown — Per-source stats cards with mini level distribution bars.
 */

import React from "react";
import type { SourceStats } from "../../types";

interface Props {
  sources: SourceStats[];
}

const LEVEL_COLORS: Record<string, string> = {
  trace: "#64748b",
  debug: "#3b82f6",
  info: "#22c55e",
  warn: "#eab308",
  error: "#ef4444",
};

export const SourceBreakdown: React.FC<Props> = ({ sources }) => {
  if (sources.length === 0) {
    return (
      <div className="surface-card-static p-4">
        <span className="data-label">Source Breakdown</span>
        <p className="text-slate-500 italic mt-3 text-sm">No source data available</p>
      </div>
    );
  }

  return (
    <div className="surface-card-static p-4 animate-fade-up">
      <span className="data-label">Source Breakdown</span>
      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 stagger-grid">
        {sources.map((src) => {
          const errorRate = src.total_events > 0
            ? (src.error_count / src.total_events) * 100
            : 0;

          return (
            <div
              key={src.source}
              className="surface-card-static p-3.5 animate-fade-up"
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-slate-200">
                  {src.source}
                </h3>
                <span
                  className="text-xs font-mono"
                  style={{ color: "#64748b" }}
                >
                  {src.total_events} events
                </span>
              </div>
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Errors</span>
                  <span
                    className="font-mono"
                    style={{ color: src.error_count > 0 ? "#ef4444" : "#22c55e" }}
                  >
                    {src.error_count}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Error Rate</span>
                  <span
                    className="font-mono"
                    style={{ color: errorRate > 5 ? "#ef4444" : "#22c55e" }}
                  >
                    {errorRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Avg Latency</span>
                  <span className="font-mono" style={{ color: "#eab308" }}>
                    {src.latency.avg_ms != null
                      ? `${src.latency.avg_ms.toFixed(0)}ms`
                      : "N/A"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">P99 Latency</span>
                  <span className="font-mono" style={{ color: "#f97316" }}>
                    {src.latency.p99_ms != null
                      ? `${src.latency.p99_ms.toFixed(0)}ms`
                      : "N/A"}
                  </span>
                </div>
                {/* Mini level distribution bar */}
                <div className="mt-2 flex gap-px h-1.5 rounded overflow-hidden">
                  {(
                    [
                      ["trace", src.level_distribution.trace],
                      ["debug", src.level_distribution.debug],
                      ["info", src.level_distribution.info],
                      ["warn", src.level_distribution.warn],
                      ["error", src.level_distribution.error],
                    ] as const
                  ).map(([level, count]) => {
                    if (count === 0) return null;
                    return (
                      <div
                        key={level}
                        style={{
                          flexGrow: count,
                          backgroundColor: LEVEL_COLORS[level],
                        }}
                        title={`${level}: ${count}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
