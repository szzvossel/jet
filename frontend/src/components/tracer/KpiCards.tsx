/**
 * KpiCards — Summary cards row for the Tracer tab.
 */

import React from "react";
import type { TracerKpis } from "../../types";

interface Props {
  kpis: TracerKpis;
}

export const KpiCards: React.FC<Props> = ({ kpis }) => {
  const cards = [
    {
      label: "Total Events",
      value: kpis.total_events.toLocaleString(),
      color: "text-brand-400",
    },
    {
      label: "Error Rate",
      value: `${(kpis.error_rate * 100).toFixed(1)}%`,
      color: kpis.error_rate > 0.05 ? "text-red-400" : "text-green-400",
    },
    {
      label: "Avg Latency",
      value:
        kpis.latency.avg_ms != null
          ? `${kpis.latency.avg_ms.toFixed(0)}ms`
          : "N/A",
      color: "text-yellow-400",
    },
    {
      label: "Monitored Files",
      value: kpis.monitored_files.length.toString(),
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card) => (
        <div key={card.label} className="bg-slate-800 rounded-lg p-4">
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
            {card.label}
          </span>
          <div className={`text-xl font-mono font-semibold ${card.color}`}>
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};
