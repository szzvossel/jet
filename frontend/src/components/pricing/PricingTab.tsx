/**
 * PricingTab — Option Pricing tab.
 *
 * Split layout: left sidebar for parameters, right area for results and charts.
 * Auto-prices after first manual calculation.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { OptionInput } from "./OptionInput";
import { ResultPanel } from "./ResultPanel";
import { PayoffChart } from "./PayoffChart";
import { GreeksChart } from "./GreeksChart";
import { priceOption, priceCurve, greeksCurve } from "../../hooks/usePricing";
import { useLiveSpotMap } from "../../contexts/LiveSpotContext";
import type {
  OptionType,
  OptionContract,
  MarketData,
  PricingResult,
  GreeksCurveResult,
} from "../../types";

export function PricingTab() {
  const [contract, setContract] = useState<OptionContract>({
    option_type: "Call" as OptionType,
    strike: 100.0,
    time_to_expiry: 0.25,
  });

  const [market, setMarket] = useState<MarketData>({
    spot: 100.0,
    risk_free_rate: 0.05,
    volatility: 0.20,
    dividend_yield: 0.0,
  });

  const [useLiveSpot, setUseLiveSpot] = useState(false);
  const [liveSymbol, setLiveSymbol] = useState("SPX");
  const liveSpotMap = useLiveSpotMap();

  const [result, setResult] = useState<PricingResult | null>(null);
  const [curveData, setCurveData] = useState<
    Array<{ spot: number; price: number }>
  >([]);
  const [greeksData, setGreeksData] = useState<GreeksCurveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasPricedOnce = useRef(false);

  const handlePrice = useCallback(async () => {
    hasPricedOnce.current = true;
    setError(null);
    try {
      const pricingResult = await priceOption(contract, market);
      setResult(pricingResult);

      const spotMin = Math.max(market.spot * 0.5, 1.0);
      const spotMax = market.spot * 1.5;
      const curve = await priceCurve(contract, market, [spotMin, spotMax], 100);
      setCurveData(curve);

      const greeks = await greeksCurve({
        contract,
        market,
        spot_range: [spotMin, spotMax],
        num_points: 100,
      });
      setGreeksData(greeks);
    } catch (e) {
      setError(String(e));
    }
  }, [contract, market]);

  // Auto-price whenever parameters change (after first manual click)
  useEffect(() => {
    if (!hasPricedOnce.current) return;
    handlePrice();
  }, [handlePrice]);

  // Sync live spot from bus into market state.
  useEffect(() => {
    if (!useLiveSpot) return;
    const spot = liveSpotMap.get(liveSymbol);
    if (spot !== undefined && spot !== market.spot) {
      setMarket((prev) => ({ ...prev, spot }));
    }
  }, [useLiveSpot, liveSymbol, liveSpotMap, market.spot]);

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 bg-red-900/30 border border-red-800/50 text-red-300 px-4 py-3 rounded-lg text-sm animate-fade-up">
            {error}
          </div>
        )}

        {/* Live spot toggle */}
        <div className="mb-4 flex items-center gap-3 surface-card-static px-3.5 py-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={useLiveSpot}
              onChange={(e) => setUseLiveSpot(e.target.checked)}
              className="rounded border-slate-600 bg-slate-800 text-brand-500 focus:ring-brand-500/50 focus:ring-offset-0 w-3.5 h-3.5"
            />
            <span className="text-[11px] text-slate-400">Use live prices</span>
          </label>
          {useLiveSpot && (
            <>
              <select
                value={liveSymbol}
                onChange={(e) => setLiveSymbol(e.target.value)}
                className="bg-slate-800/60 border border-slate-700/50 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none focus:border-brand-500 transition-colors"
              >
                {liveSpotMap.symbols().length > 0
                  ? liveSpotMap.symbols().map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))
                  : ["SPX", "SPY", "QQQ", "IWM", "DIA", "EEM"].map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
              </select>
              {liveSpotMap.get(liveSymbol) !== undefined && (
                <span className="text-[10px] text-emerald-400 font-mono">
                  {liveSymbol} = {liveSpotMap.get(liveSymbol)!.toFixed(2)}
                </span>
              )}
            </>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Left: Input Panel */}
          <div className="lg:col-span-3">
            <OptionInput
              contract={contract}
              market={market}
              onContractChange={setContract}
              onMarketChange={setMarket}
              onPrice={handlePrice}
            />
          </div>

          {/* Right: Results + Charts */}
          <div className="lg:col-span-9 space-y-5">
            <ResultPanel
              result={result}
              optionType={contract.option_type}
              strike={contract.strike}
              timeToExpiry={contract.time_to_expiry}
              spot={market.spot}
            />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <PayoffChart
                priceCurve={curveData}
                strike={contract.strike}
                optionType={contract.option_type}
              />
              <GreeksChart data={greeksData} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
