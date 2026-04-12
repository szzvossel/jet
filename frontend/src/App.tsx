/**
 * JET - Equity Derivatives Analytics
 *
 * Main application component. Tab-based layout with 4 industry-standard tabs.
 */

import { useState, useCallback } from "react";
import { SplashScreen } from "./components/SplashScreen";
import { TabBar } from "./components/shared/TabBar";
import { PricingTab } from "./components/pricing/PricingTab";
import { DerivedDataTab } from "./components/derived_data/DerivedDataTab";
import { StrategyTab } from "./components/strategy/StrategyTab";
import { RiskTab } from "./components/risk/RiskTab";
import { PnLTab } from "./components/pnl/PnLTab";
import { TracerTab } from "./components/tracer/TracerTab";

const TABS = [
  { id: "strategy", label: "Option Strategy" },
  { id: "pricing", label: "Option Pricing" },
  { id: "derived", label: "Derived Data Marking" },
  { id: "risk", label: "Risk View" },
  { id: "pnl", label: "P&L Explanation" },
  { id: "tracer", label: "Tracer" },
];

function App() {
  const [activeTab, setActiveTab] = useState("strategy");
  const [showSplash, setShowSplash] = useState(true);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  const renderTab = () => {
    switch (activeTab) {
      case "pricing":
        return <PricingTab />;
      case "strategy":
        return <StrategyTab />;
      case "derived":
        return <DerivedDataTab />;
      case "risk":
        return <RiskTab />;
      case "pnl":
        return <PnLTab />;
      case "tracer":
        return <TracerTab />;
      default:
        return <StrategyTab />;
    }
  };

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
        {/* Header */}
        <header className="bg-slate-900 border-b border-slate-800 px-6 py-3">
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

        {/* Tab Navigation */}
        <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto pb-10">
          {renderTab()}
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-2">
          <div className="flex justify-between items-center text-xs text-slate-600">
            <span>JET v0.1.0</span>
            <span>Black-Scholes-Merton Pricing Engine</span>
            <span>Ready</span>
          </div>
        </footer>
      </div>
    </>
  );
}

export default App;
