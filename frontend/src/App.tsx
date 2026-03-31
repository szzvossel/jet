/**
 * JET - Equity Derivatives Analytics
 *
 * Main application component. Manages state and orchestrates the layout.
 */

import { useState, useCallback } from "react";
import { OptionInput } from "./components/OptionInput";
import { ResultPanel } from "./components/ResultPanel";
import { PayoffChart } from "./components/PayoffChart";
import { GreeksChart } from "./components/GreeksChart";
import { priceOption, priceCurve, greeksCurve } from "./hooks/usePricing";
import type {
  OptionType,
  OptionContract,
  MarketData,
  PricingResult,
  GreeksCurveResult,
} from "./types";

function App() {
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
  const [loading, setLoading] = useState(false);

  const handlePrice = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Price the option
      const pricingResult = await priceOption(contract, market);
      setResult(pricingResult);

      // Compute price curve for payoff diagram
      const spotMin = Math.max(market.spot * 0.5, 1.0);
      const spotMax = market.spot * 1.5;
      const curve = await priceCurve(contract, market, [spotMin, spotMax], 100);
      setCurveData(curve);

      // Compute Greeks curve
      const greeks = await greeksCurve({
        contract,
        market,
        spot_range: [spotMin, spotMax],
        num_points: 100,
      });
      setGreeksData(greeks);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }, [contract, market]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center font-bold text-white text-sm">
            J
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-100">JET</h1>
            <p className="text-xs text-slate-500">
              Equity Derivatives Analytics
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-7xl mx-auto">
          {/* Error Banner */}
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
              {/* Result Panel */}
              <ResultPanel result={result} />

              {/* Charts Row */}
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
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-2">
        <div className="flex justify-between items-center text-xs text-slate-600">
          <span>JET v0.1.0</span>
          <span>Black-Scholes-Merton Pricing Engine</span>
          <span>{loading ? "Computing..." : "Ready"}</span>
        </div>
      </footer>
    </div>
  );
}

export default App;
