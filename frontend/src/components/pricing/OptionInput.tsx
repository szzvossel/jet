/**
 * Option parameters input form.
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

export const OptionInput: React.FC<Props> = ({
  contract,
  market,
  onContractChange,
  onMarketChange,
  onPrice,
}) => {
  return (
    <div className="bg-slate-800 rounded-lg p-6 space-y-6">
      <h2 className="text-xl font-semibold text-slate-100">
        Option Parameters
      </h2>

      {/* Option Type */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Option Type
        </label>
        <div className="flex gap-4">
          <button
            onClick={() =>
              onContractChange({ ...contract, option_type: "Call" })
            }
            className={`px-4 py-2 rounded-lg font-medium transition ${
              contract.option_type === "Call"
                ? "bg-brand-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Call
          </button>
          <button
            onClick={() =>
              onContractChange({ ...contract, option_type: "Put" })
            }
            className={`px-4 py-2 rounded-lg font-medium transition ${
              contract.option_type === "Put"
                ? "bg-brand-600 text-white"
                : "bg-slate-700 text-slate-300 hover:bg-slate-600"
            }`}
          >
            Put
          </button>
        </div>
      </div>

      {/* Strike Price */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Strike Price (K): {contract.strike.toFixed(2)}
        </label>
        <input
          type="range"
          min={50}
          max={150}
          step={1}
          value={contract.strike}
          onChange={(e) =>
            onContractChange({
              ...contract,
              strike: parseFloat(e.target.value),
            })
          }
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Time to Expiry */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Time to Expiry (T): {contract.time_to_expiry.toFixed(2)} years
        </label>
        <input
          type="range"
          min={0.01}
          max={2}
          step={0.01}
          value={contract.time_to_expiry}
          onChange={(e) =>
            onContractChange({
              ...contract,
              time_to_expiry: parseFloat(e.target.value),
            })
          }
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      <hr className="border-slate-700" />

      {/* Spot Price */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Spot Price (S): {market.spot.toFixed(2)}
        </label>
        <input
          type="range"
          min={50}
          max={150}
          step={1}
          value={market.spot}
          onChange={(e) =>
            onMarketChange({
              ...market,
              spot: parseFloat(e.target.value),
            })
          }
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Risk-Free Rate */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Risk-Free Rate (r): {(market.risk_free_rate * 100).toFixed(1)}%
        </label>
        <input
          type="range"
          min={0}
          max={0.15}
          step={0.001}
          value={market.risk_free_rate}
          onChange={(e) =>
            onMarketChange({
              ...market,
              risk_free_rate: parseFloat(e.target.value),
            })
          }
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Volatility */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Volatility (sigma): {(market.volatility * 100).toFixed(1)}%
        </label>
        <input
          type="range"
          min={0.01}
          max={1.0}
          step={0.01}
          value={market.volatility}
          onChange={(e) =>
            onMarketChange({
              ...market,
              volatility: parseFloat(e.target.value),
            })
          }
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Dividend Yield */}
      <div>
        <label className="block text-sm font-medium text-slate-300 mb-2">
          Dividend Yield (q): {(market.dividend_yield * 100).toFixed(1)}%
        </label>
        <input
          type="range"
          min={0}
          max={0.1}
          step={0.001}
          value={market.dividend_yield}
          onChange={(e) =>
            onMarketChange({
              ...market,
              dividend_yield: parseFloat(e.target.value),
            })
          }
          className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* Price Button */}
      <button
        onClick={onPrice}
        className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 px-6 rounded-lg transition"
      >
        Calculate Price
      </button>
    </div>
  );
};
