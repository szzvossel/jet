/**
 * JET - Equity Derivatives Analytics
 *
 * Main application component. Tab-based layout with 4 industry-standard tabs.
 */

import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SplashScreen } from "./components/SplashScreen";
import { TabBar } from "./components/shared/TabBar";
import { PricingTab } from "./components/pricing/PricingTab";
import { DerivedDataTab } from "./components/derived_data/DerivedDataTab";
import { StrategyTab } from "./components/strategy/StrategyTab";
import { RiskTab } from "./components/risk/RiskTab";
import { PnLTab } from "./components/pnl/PnLTab";
import { TracerTab } from "./components/tracer/TracerTab";
import { setBackend } from "./hooks/usePricing";
import type { BackendMode } from "./hooks/usePricing";

const BACKEND_KEY = "jet-backend-mode";
const REMOTE_URL_KEY = "jet-remote-url";

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

  const [backendMode, setBackendMode] = useState<BackendMode>(() => {
    return (localStorage.getItem(BACKEND_KEY) as BackendMode) || "local";
  });
  const [remoteUrl, setRemoteUrl] = useState<string>(
    () => localStorage.getItem(REMOTE_URL_KEY) || "http://localhost:3000",
  );

  useEffect(() => {
    setBackend(backendMode, remoteUrl);
    localStorage.setItem(BACKEND_KEY, backendMode);
  }, [backendMode, remoteUrl]);

  useEffect(() => {
    localStorage.setItem(REMOTE_URL_KEY, remoteUrl);
  }, [remoteUrl]);

  // F12 to toggle devtools
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "F12") {
        e.preventDefault();
        invoke("toggle_devtools").catch(() => {});
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

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
          <div className="flex items-center justify-between">
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
            <div className="flex items-center gap-3">
              <span className="text-slate-500 uppercase tracking-wider text-xs">
                Backend
              </span>
              <div className="flex rounded-lg border border-slate-600 overflow-hidden">
                <button
                  onClick={() => setBackendMode("local")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    backendMode === "local"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Local
                </button>
                <button
                  onClick={() => setBackendMode("remote")}
                  className={`px-3 py-1 text-xs font-medium transition-colors ${
                    backendMode === "remote"
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  Remote
                </button>
              </div>
              {backendMode === "remote" && (
                <input
                  type="text"
                  value={remoteUrl}
                  onChange={(e) => setRemoteUrl(e.target.value)}
                  placeholder="http://localhost:3000"
                  className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-xs text-slate-200 w-56 focus:outline-none focus:border-indigo-500"
                />
              )}
              <span className="text-slate-500 text-xs">
                {backendMode === "local" ? "Tauri IPC" : `HTTP → ${remoteUrl}`}
              </span>
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
