/**
 * OptionInput — Parameter form for single-option BSM pricing.
 *
 * Grouped into Contract (type, strike, expiry) and Market (spot, rate, vol, dividend)
 * sections. Each parameter has a slider + editable number input for precision.
 * Auto-pricing is active after first click, so no Calculate button needed.
 */

import React from "react";
import type { OptionContract, MarketData } from "../../types";

interface Props {
  contract: OptionContract;
  market: MarketData;
  onContractChange: (contract: OptionContract) => void;
  onMarketChange: (market: MarketData) => void;
  onPrice: () => void;
}

function SliderField({
  label,
  value,
  displayValue,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  displayValue: string;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <input
          type="number"
          value={value}
          step={step}
          min={min}
          max={max}
          onChange={(e) => {
            const v = parseFloat(e.target.value);
            if (!isNaN(v) && v >= min && v <= max) onChange(v);
          }}
          className="w-20 text-right text-xs font-mono bg-slate-900/60 border border-slate-700/40 rounded px-1.5 py-0.5 text-slate-200 focus:outline-none focus:border-brand-500/50 transition-colors"
        />
      </div>
      <div className="relative">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-1.5 rounded-full appearance-none cursor-pointer slider-refined"
        />
      </div>
      <div className="flex justify-between text-[9px] text-slate-600 font-mono">
        <span>{min}</span>
        <span>{displayValue}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}

export const OptionInput: React.FC<Props> = ({
  contract,
  market,
  onContractChange,
  onMarketChange,
  onPrice,
}) => {
  return (
    <div className="surface-card-static p-4 space-y-5">
      <div>
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Contract
        </h3>

        {/* Option Type — pill toggle */}
        <div className="mb-4">
          <div className="flex rounded-md overflow-hidden border border-slate-700/40">
            <button
              onClick={() =>
                onContractChange({ ...contract, option_type: "Call" })
              }
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                contract.option_type === "Call"
                  ? "bg-green-600/80 text-white"
                  : "bg-slate-800/40 text-slate-500 hover:text-slate-300"
              }`}
            >
              Call
            </button>
            <button
              onClick={() =>
                onContractChange({ ...contract, option_type: "Put" })
              }
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-all duration-150 ${
                contract.option_type === "Put"
                  ? "bg-red-600/80 text-white"
                  : "bg-slate-800/40 text-slate-500 hover:text-slate-300"
              }`}
            >
              Put
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <SliderField
            label="Strike (K)"
            value={contract.strike}
            displayValue={contract.strike.toFixed(2)}
            min={50}
            max={150}
            step={1}
            onChange={(v) => onContractChange({ ...contract, strike: v })}
          />
          <SliderField
            label="Expiry (T)"
            value={contract.time_to_expiry}
            displayValue={`${contract.time_to_expiry.toFixed(2)} yr`}
            min={0.01}
            max={2}
            step={0.01}
            onChange={(v) =>
              onContractChange({ ...contract, time_to_expiry: v })
            }
          />
        </div>
      </div>

      <div className="border-t border-slate-700/30" />

      <div>
        <h3 className="text-[11px] font-semibold text-slate-500 uppercase tracking-widest mb-3">
          Market
        </h3>
        <div className="space-y-4">
          <SliderField
            label="Spot (S)"
            value={market.spot}
            displayValue={market.spot.toFixed(2)}
            min={50}
            max={150}
            step={1}
            onChange={(v) => onMarketChange({ ...market, spot: v })}
          />
          <SliderField
            label="Rate (r)"
            value={market.risk_free_rate}
            displayValue={`${(market.risk_free_rate * 100).toFixed(1)}%`}
            min={0}
            max={0.15}
            step={0.001}
            onChange={(v) =>
              onMarketChange({ ...market, risk_free_rate: v })
            }
          />
          <SliderField
            label="Volatility"
            value={market.volatility}
            displayValue={`${(market.volatility * 100).toFixed(0)}%`}
            min={0.01}
            max={1.0}
            step={0.01}
            onChange={(v) => onMarketChange({ ...market, volatility: v })}
          />
          <SliderField
            label="Div Yield (q)"
            value={market.dividend_yield}
            displayValue={`${(market.dividend_yield * 100).toFixed(1)}%`}
            min={0}
            max={0.1}
            step={0.001}
            onChange={(v) =>
              onMarketChange({ ...market, dividend_yield: v })
            }
          />
        </div>
      </div>

      {/* Calculate button — secondary style since auto-pricing is active */}
      <button
        onClick={onPrice}
        className="btn-primary w-full py-2 text-xs"
      >
        Calculate Price
      </button>
    </div>
  );
};
