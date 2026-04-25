/**
 * KpiCards — Summary cards row for the Tracer tab.
 */

import React from "react";
import type { TracerKpis } from "../../types";

interface Props {
  kpis: TracerKpis;
}

const CARD_DEFS = [
  { key: "events", label: "Total Events", color: "#6366f1" },
  { key: "error_rate", label: "Error Rate", color: "#ef4444" },
  { key: "latency", label: "Avg Latency", color: "#eab308" },
  { key: "files", label: "Monitored Files", color: "#06b6d4" },
] as const;

export const KpiCards: React.FC<Props> = ({ kpis }) => {
  const cards = [
    {
      label: "Total Events",
      value: kpis.total_events.toLocaleString(),
      color: "#6366f1",
    },
    {
      label: "Error Rate",
      value: `${(kpis.error_rate * 100).toFixed(1)}%`,
      color: kpis.error_rate > 0.05 ? "#ef4444" : "#22c55e",
    },
    {
      label: "Avg Latency",
      value:
        kpis.latency.avg_ms != null
          ? `${kpis.latency.avg_ms.toFixed(0)}ms`
          : "N/A",
      color: "#eab308",
    },
    {
      label: "Monitored Files",
      value: kpis.monitored_files.length.toString(),
      color: "#06b6d4",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-grid">
      {cards.map((card) => (
        <div key={card.label} className="surface-card-static p-3.5 animate-fade-up">
          <div className="flex items-center gap-1.5 mb-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: card.color }}
            />
            <span className="data-label">{card.label}</span>
          </div>
          <div
            className="text-lg font-semibold"
            style={{ color: card.color, fontFamily: "var(--font-mono)" }}
          >
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
};
