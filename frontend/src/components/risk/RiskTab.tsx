/**
 * RiskTab — Live Greeks exposure dashboard.
 */

import { useState, useEffect } from "react";
import { GreeksGrid } from "./GreeksGrid";
import { DeltaExposureChart } from "./DeltaExposureChart";
import { NumberDisplay } from "../shared/NumberDisplay";
import { fetchRiskSummary } from "../../hooks/usePricing";
import type { RiskSummary } from "../../types";

export function RiskTab() {
  const [riskData, setRiskData] = useState<RiskSummary | null>(null);

  useEffect(() => {
    fetchRiskSummary().then(setRiskData).catch(console.error);
  }, []);

  if (!riskData) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-500 italic">Loading risk data...</p>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Total Delta",
      value: riskData.total_delta,
      color: "text-blue-400",
    },
    {
      label: "Total Gamma",
      value: riskData.total_gamma,
      color: "text-purple-400",
    },
    {
      label: "Total Vega",
      value: riskData.total_vega,
      color: "text-yellow-400",
    },
    {
      label: "Total Theta",
      value: riskData.total_theta,
      color: "text-orange-400",
    },
    {
      label: "Total Epsilon",
      value: riskData.total_epsilon,
      color: "text-pink-400",
    },
    {
      label: "Total Rho",
      value: riskData.total_rho,
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-3 lg:grid-cols-6 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-slate-800 rounded-lg p-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {card.label}
              </span>
              <div className={`text-xl font-mono font-semibold ${card.color}`}>
                <NumberDisplay
                  value={card.value}
                  format="number"
                  decimals={1}
                  colorize
                />
              </div>
            </div>
          ))}
        </div>

        {/* Greeks Grid */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Position Greeks
          </h2>
          <GreeksGrid positions={riskData.positions} />
        </div>

        {/* Delta exposure chart */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            Delta Exposure
          </h2>
          <DeltaExposureChart positions={riskData.positions} />
        </div>
      </div>
    </div>
  );
}
