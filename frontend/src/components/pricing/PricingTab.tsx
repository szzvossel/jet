/**
 * PricingTab — Quote Parsing & Pricing tab.
 *
 * Extracted from original App.tsx. Option strategy builder and BSM pricing engine.
 */

import { useState, useCallback, useEffect, useRef } from "react";
import { OptionInput } from "./OptionInput";
import { ResultPanel } from "./ResultPanel";
import { PayoffChart } from "./PayoffChart";
import { GreeksChart } from "./GreeksChart";
import { priceOption, priceCurve, greeksCurve } from "../../hooks/usePricing";
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

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-4 bg-red-900/50 border border-red-700 text-red-200 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
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
          <div className="lg:col-span-9 space-y-6">
            <ResultPanel result={result} />

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
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
