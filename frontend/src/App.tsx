/**
 * JET - Equity Derivatives Analytics
 *
 * Main application component. Tab-based layout with 6 tabs,
 * keyboard shortcuts, toast notifications, and theme support.
 */

import { useState, useCallback, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { SplashScreen } from "./components/SplashScreen";
import { TabBar } from "./components/shared/TabBar";
import { PricingTab } from "./components/pricing/PricingTab";
import { LiveTab } from "./components/live/LiveTab";
import { DerivedDataTab } from "./components/derived_data/DerivedDataTab";
import { StrategyTab } from "./components/strategy/StrategyTab";
import { RiskTab } from "./components/risk/RiskTab";
import { PnLTab } from "./components/pnl/PnLTab";
import { TracerTab } from "./components/tracer/TracerTab";
import { ToastProvider } from "./components/shared/Toast";
import { setBackend } from "./hooks/usePricing";
import type { BackendMode } from "./hooks/usePricing";
import { LiveSpotContext, useLiveSpotProvider } from "./contexts/LiveSpotContext";
import { HelmetIcon, TriumphIcon, DucatiIcon, YamahaIcon } from "./components/shared/MotorcycleIcons";
import motoBg from "./assets/moto.png";

const THEME_ICONS: Record<string, React.FC> = {
  "": HelmetIcon,
  "765rs": TriumphIcon,
  "v4s": DucatiIcon,
  "r1m": YamahaIcon,
};

const BACKEND_KEY = "jet-backend-mode";
const REMOTE_URL_KEY = "jet-remote-url";
const THEME_KEY = "jet-theme";

// Tab icons as inline SVGs
const TabIconLive = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
  </svg>
);
const TabIconStrategy = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z" />
  </svg>
);
const TabIconPricing = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);
const TabIconDerived = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12c0 1.2-4 6-9 6s-9-4.8-9-6c0-1.2 4-6 9-6s9 4.8 9 6z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const TabIconRisk = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
    <line x1="12" y1="9" x2="12" y2="13" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);
const TabIconPnl = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="1" x2="12" y2="23" />
    <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" />
  </svg>
);
const TabIconTracer = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

const TABS = [
  { id: "live", label: "Live", icon: <TabIconLive /> },
  { id: "strategy", label: "Option Strategy", icon: <TabIconStrategy /> },
  { id: "pricing", label: "Option Pricing", icon: <TabIconPricing /> },
  { id: "derived", label: "Derived Data", icon: <TabIconDerived /> },
  { id: "risk", label: "Risk View", icon: <TabIconRisk /> },
  { id: "pnl", label: "P&L Explanation", icon: <TabIconPnl /> },
  { id: "tracer", label: "Tracer", icon: <TabIconTracer /> },
];

function App() {
  const [activeTab, setActiveTab] = useState("live");
  const [showSplash, setShowSplash] = useState(true);
  const liveSpotMap = useLiveSpotProvider();

  const [backendMode, setBackendMode] = useState<BackendMode>(() => {
    return (localStorage.getItem(BACKEND_KEY) as BackendMode) || "local";
  });
  const [remoteUrl, setRemoteUrl] = useState<string>(
    () => localStorage.getItem(REMOTE_URL_KEY) || "http://localhost:3000",
  );

  const [theme, setTheme] = useState<string>(
    () => localStorage.getItem(THEME_KEY) || "",
  );

  useEffect(() => {
    setBackend(backendMode, remoteUrl);
    localStorage.setItem(BACKEND_KEY, backendMode);
  }, [backendMode, remoteUrl]);

  useEffect(() => {
    localStorage.setItem(REMOTE_URL_KEY, remoteUrl);
  }, [remoteUrl]);

  useEffect(() => {
    if (theme) {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // F12 to toggle devtools
      if (e.key === "F12") {
        e.preventDefault();
        invoke("toggle_devtools").catch(() => {});
        return;
      }

      // Cmd/Ctrl + 1-7 to switch tabs
      if ((e.metaKey || e.ctrlKey) && e.key >= "1" && e.key <= "7") {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (TABS[idx]) {
          setActiveTab(TABS[idx].id);
        }
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
      case "live":
        return <LiveTab />;
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
        return <LiveTab />;
    }
  };

  return (
    <LiveSpotContext.Provider value={liveSpotMap}>
    <ToastProvider>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col relative">
        {/* Background motorcycle watermark */}
        <img
          src={motoBg}
          alt=""
          className="fixed bottom-0 right-0 pointer-events-none z-0 opacity-[0.04]"
          style={{ width: "500px", height: "auto" }}
        />

        {/* Header — compact command bar */}
        <header className="relative z-10 px-5 py-2.5" style={{ background: 'var(--surface-header)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(71, 85, 105, 0.3)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-md flex items-center justify-center font-bold text-white text-xs" style={{ background: 'linear-gradient(135deg, var(--brand-500) 0%, var(--brand-700) 100%)' }}>
                J
              </div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-bold text-slate-100 tracking-tight" style={{ fontFamily: "'DM Sans', sans-serif" }}>JET</h1>
                <span className="text-[10px] text-slate-500 hidden sm:inline">Equity Derivatives Analytics</span>
              </div>
              {THEME_ICONS[theme] && (() => {
                const Icon = THEME_ICONS[theme];
                return <span className="text-brand-400 ml-1"><Icon /></span>;
              })()}
            </div>
            <div className="flex items-center gap-2.5">
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-slate-800/60 border border-slate-700/50 rounded px-2 py-1 text-[11px] text-slate-300 focus:outline-none focus:border-brand-500 transition-colors"
              >
                <option value="">Default</option>
                <option value="765rs">765RS</option>
                <option value="v4s">V4S</option>
                <option value="r1m">R1M</option>
              </select>
              <div className="h-4 w-px bg-slate-700/50" />
              <span className="text-slate-600 uppercase tracking-widest text-[10px] font-medium">
                Backend
              </span>
              <div className="flex rounded-md border border-slate-700/50 overflow-hidden">
                <button
                  onClick={() => setBackendMode("local")}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                    backendMode === "local"
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-800/60 text-slate-500 hover:text-slate-300"
                  }`}
                >
                  Local
                </button>
                <button
                  onClick={() => setBackendMode("remote")}
                  className={`px-2.5 py-1 text-[11px] font-medium transition-all duration-150 ${
                    backendMode === "remote"
                      ? "bg-brand-600 text-white shadow-sm"
                      : "bg-slate-800/60 text-slate-500 hover:text-slate-300"
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
                  className="input-refined px-2 py-1 text-[11px] text-slate-200 w-48"
                />
              )}
              <span className="text-slate-600 text-[10px] font-mono">
                {backendMode === "local" ? "IPC" : remoteUrl.replace(/^https?:\/\//, '')}
              </span>
            </div>
          </div>
        </header>

        {/* Tab Navigation */}
        <div className="relative z-10">
          <TabBar tabs={TABS} activeTab={activeTab} onTabChange={setActiveTab} />
        </div>

        {/* Tab Content */}
        <main className="flex-1 overflow-y-auto pb-10 relative z-10">
          <div key={activeTab} className="tab-content-enter">
            {renderTab()}
          </div>
        </main>

        {/* Footer */}
        <footer className="fixed bottom-0 left-0 right-0 px-5 py-1.5 z-10" style={{ background: 'var(--surface-header)', backdropFilter: 'blur(12px)', borderTop: '1px solid rgba(71, 85, 105, 0.2)' }}>
          <div className="flex justify-between items-center text-[10px] text-slate-600 font-mono">
            <span>v0.1.0</span>
            <span>Black-Scholes-Merton</span>
            <span className="flex items-center gap-1.5">
              <span className="hidden sm:inline">Cmd+1-7</span>
              <span className="hidden sm:inline text-slate-700">|</span>
              <span className="hidden sm:inline">Cmd+Enter</span>
            </span>
          </div>
        </footer>
      </div>
    </ToastProvider>
    </LiveSpotContext.Provider>
  );
}

export default App;
