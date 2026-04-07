/**
 * Pricing result display panel.
 */

import React from "react";
import type { PricingResult } from "../../types";

interface Props {
  result: PricingResult | null;
}

function fmt(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}

export const ResultPanel: React.FC<Props> = ({ result }) => {
  if (!result) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">
          Pricing Result
        </h2>
        <p className="text-slate-500 italic">
          Set parameters and click "Calculate Price" to see results.
        </p>
      </div>
    );
  }

  const rows = [
    {
      label: "Price",
      value: fmt(result.price),
      color: "text-green-400",
    },
    {
      label: "Delta",
      value: fmt(result.delta),
      color: "text-blue-400",
    },
    {
      label: "Gamma",
      value: fmt(result.gamma),
      color: "text-purple-400",
    },
    {
      label: "Vega",
      value: fmt(result.vega),
      color: "text-yellow-400",
    },
    {
      label: "Theta",
      value: fmt(result.theta),
      color: "text-orange-400",
    },
    {
      label: "Rho",
      value: fmt(result.rho),
      color: "text-cyan-400",
    },
  ];

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-4">
        Pricing Result
        <span className="ml-3 text-sm font-normal text-slate-400">
          {result.option_type} | Black-Scholes
        </span>
      </h2>

      <div className="grid grid-cols-2 gap-3">
        {rows.map((row) => (
          <div
            key={row.label}
            className="bg-slate-900 rounded-lg p-3 flex flex-col"
          >
            <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
              {row.label}
            </span>
            <span className={`text-lg font-mono font-semibold ${row.color}`}>
              {row.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
