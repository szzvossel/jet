/**
 * ResultPanel — Pricing result display with hero price and compact Greeks.
 */

import React from "react";
import type { PricingResult } from "../../types";

interface Props {
  result: PricingResult | null;
  optionType: string;
  strike: number;
  timeToExpiry: number;
  spot: number;
}

function fmt(value: number, decimals: number = 4): string {
  return value.toFixed(decimals);
}

function moneynessLabel(
  optionType: string,
  spot: number,
  strike: number
): { label: string; cls: string } {
  if (optionType === "Call") {
    if (spot > strike) return { label: "ITM", cls: "bg-green-900/50 text-green-400" };
    if (spot < strike) return { label: "OTM", cls: "bg-red-900/40 text-red-400" };
    return { label: "ATM", cls: "bg-yellow-900/40 text-yellow-400" };
  }
  if (spot < strike) return { label: "ITM", cls: "bg-green-900/50 text-green-400" };
  if (spot > strike) return { label: "OTM", cls: "bg-red-900/40 text-red-400" };
  return { label: "ATM", cls: "bg-yellow-900/40 text-yellow-400" };
}

const GREEK_ROWS = [
  { key: "delta", label: "Delta", color: "#3b82f6" },
  { key: "gamma", label: "Gamma", color: "#a855f7" },
  { key: "vega", label: "Vega", color: "#eab308" },
  { key: "theta", label: "Theta", color: "#f97316" },
  { key: "rho", label: "Rho", color: "#06b6d4" },
];

export const ResultPanel: React.FC<Props> = ({ result, optionType, strike, timeToExpiry, spot }) => {
  if (!result) {
    return (
      <div className="surface-card-static p-6 flex flex-col items-center justify-center py-12">
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: 'var(--surface-card)', border: '1px solid var(--surface-card-border)' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-600">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
          </svg>
        </div>
        <p className="text-slate-500 text-sm">
          Adjust parameters to see pricing results.
        </p>
      </div>
    );
  }

  const money = moneynessLabel(optionType, spot, strike);

  return (
    <div className="surface-card-static p-4 animate-fade-up">
      {/* Hero Price Row */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="data-label">BSM Price</span>
            <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${money.cls}`}>
              {money.label}
            </span>
          </div>
          <div className="text-3xl font-bold text-green-400 tracking-tight" style={{ fontFamily: "var(--font-mono)" }}>
            {fmt(result.price, 4)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider mb-0.5">Type</div>
          <div className={`text-sm font-semibold ${optionType === "Call" ? "text-green-400" : "text-red-400"}`}>
            {optionType}
          </div>
          <div className="text-[10px] text-slate-600 mt-0.5" style={{ fontFamily: "var(--font-mono)" }}>
            K={strike.toFixed(0)} T={timeToExpiry.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Greeks — compact horizontal strip */}
      <div className="grid grid-cols-5 gap-2 stagger-grid">
        {GREEK_ROWS.map((g) => (
          <div key={g.key} className="rounded-md p-2.5 animate-fade-up" style={{ background: 'rgba(15, 23, 42, 0.4)', border: `1px solid ${g.color}15` }}>
            <div className="flex items-center gap-1.5 mb-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: g.color }} />
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                {g.label}
              </span>
            </div>
            <div className="text-sm font-semibold" style={{ color: g.color, fontFamily: "var(--font-mono)" }}>
              {fmt(result[g.key as keyof PricingResult] as number, 4)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
