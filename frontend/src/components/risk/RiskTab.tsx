/**
 * RiskTab — Live Greeks exposure dashboard.
 *
 * Shows aggregate risk summary cards, position Greeks table, and delta exposure chart.
 * State persists across tab switches via useRiskStore.
 */

import { useEffect } from "react";
import { GreeksGrid } from "./GreeksGrid";
import { RiskPivotGrid } from "./RiskPivotGrid";
import { DeltaExposureChart } from "./DeltaExposureChart";
import { NumberDisplay } from "../shared/NumberDisplay";
import { fetchRiskSummary } from "../../hooks/usePricing";
import { useRiskStore } from "../../stores/useRiskStore";

const SUMMARY_CARDS = [
  { key: "total_delta", label: "Delta", color: "#3b82f6" },
  { key: "total_gamma", label: "Gamma", color: "#a855f7" },
  { key: "total_vega", label: "Vega", color: "#eab308" },
  { key: "total_theta", label: "Theta", color: "#f97316" },
  { key: "total_epsilon", label: "Epsilon", color: "#ec4899" },
  { key: "total_rho", label: "Rho", color: "#06b6d4" },
] as const;

export function RiskTab() {
  const riskData = useRiskStore((s) => s.riskData);
  const setRiskData = useRiskStore((s) => s.setRiskData);

  useEffect(() => {
    if (!riskData) {
      fetchRiskSummary().then(setRiskData).catch(console.error);
    }
  }, [riskData, setRiskData]);

  if (!riskData) {
    return (
      <div className="p-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="surface-card-static p-3.5 animate-pulse">
                <div className="h-2.5 bg-slate-700/50 rounded w-16 mb-3" />
                <div className="h-5 bg-slate-700/40 rounded w-20" />
              </div>
            ))}
          </div>
          <div className="mt-5 surface-card-static p-4">
            <div className="h-4 bg-slate-700/40 rounded w-32 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-8 bg-slate-700/30 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-3 stagger-grid">
          {SUMMARY_CARDS.map((card) => (
            <div
              key={card.key}
              className="surface-card-static p-3.5 animate-fade-up"
            >
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: card.color }}
                />
                <span className="data-label">Net {card.label}</span>
              </div>
              <div
                className="text-lg font-semibold"
                style={{ color: card.color, fontFamily: "var(--font-mono)" }}
              >
                <NumberDisplay
                  value={riskData[card.key]}
                  format="number"
                  decimals={1}
                  colorize
                />
              </div>
            </div>
          ))}
        </div>

        {/* Greeks Grid */}
        <div className="surface-card-static p-4 animate-fade-up">
          <span className="data-label">Position Greeks</span>
          <div className="mt-3">
            <GreeksGrid positions={riskData.positions} />
          </div>
        </div>

        {/* Delta exposure chart */}
        <div className="surface-card-static p-4 animate-fade-up">
          <span className="data-label">Delta Exposure</span>
          <div className="mt-3">
            <DeltaExposureChart positions={riskData.positions} />
          </div>
        </div>

        {/* Multi-dimensional pivot analysis */}
        <div className="surface-card-static p-4 animate-fade-up">
          <div className="flex items-center justify-between mb-3">
            <span className="data-label">Multi-Dimensional Analysis</span>
            <span className="text-[10px] text-slate-600">
              Drag columns to row groups / pivot / values in the sidebar
            </span>
          </div>
          <RiskPivotGrid positions={riskData.positions} />
        </div>
      </div>
    </div>
  );
}
