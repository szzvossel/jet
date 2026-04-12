/**
 * SourceBreakdown — Per-source stats cards.
 */

import React from "react";
import type { SourceStats } from "../../types";

interface Props {
  sources: SourceStats[];
}

export const SourceBreakdown: React.FC<Props> = ({ sources }) => {
  if (sources.length === 0) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">
          Source Breakdown
        </h2>
        <p className="text-slate-500 italic">No source data available</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-4">
        Source Breakdown
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sources.map((src) => (
          <div key={src.source} className="bg-slate-900 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-slate-200">
                {src.source}
              </h3>
              <span className="text-xs text-slate-500">
                {src.total_events} events
              </span>
            </div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Errors</span>
                <span
                  className={
                    src.error_count > 0 ? "text-red-400" : "text-green-400"
                  }
                >
                  {src.error_count}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Error Rate</span>
                <span
                  className={
                    src.total_events > 0 &&
                    src.error_count / src.total_events > 0.05
                      ? "text-red-400"
                      : "text-green-400"
                  }
                >
                  {src.total_events > 0
                    ? `${((src.error_count / src.total_events) * 100).toFixed(1)}%`
                    : "0%"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Avg Latency</span>
                <span className="text-yellow-400">
                  {src.latency.avg_ms != null
                    ? `${src.latency.avg_ms.toFixed(0)}ms`
                    : "N/A"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">P99 Latency</span>
                <span className="text-orange-400">
                  {src.latency.p99_ms != null
                    ? `${src.latency.p99_ms.toFixed(0)}ms`
                    : "N/A"}
                </span>
              </div>
              {/* Mini level distribution bar */}
              <div className="mt-2 flex gap-px h-2 rounded overflow-hidden">
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
                  const colors: Record<string, string> = {
                    trace: "bg-slate-600",
                    debug: "bg-blue-500",
                    info: "bg-green-500",
                    warn: "bg-yellow-500",
                    error: "bg-red-500",
                  };
                  return (
                    <div
                      key={level}
                      className={`${colors[level]}`}
                      style={{
                        flexGrow: count,
                      }}
                      title={`${level}: ${count}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
