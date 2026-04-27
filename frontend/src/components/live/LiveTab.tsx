/**
 * LiveTab — Real-time market data dashboard.
 *
 * Subscribes to jet-bus WebSocket, displays live quote cards for
 * watched symbols, and shows a scrollable event feed.
 * WebSocket connection is owned by App.tsx and passed in as a prop
 * so the subscription survives tab switches.
 * Watchlist persists via useLiveStore.
 */

import { useCallback, useMemo, useEffect } from "react";
import { QuoteBoard } from "./QuoteBoard";
import { EventLog } from "./EventLog";
import { SubscriptionControls } from "./SubscriptionControls";
import { Cheatsheet } from "./Cheatsheet";
import { useLiveStore } from "../../stores/useLiveStore";
import type { MarketEvent } from "../../types";

interface MarketEventsSource {
  events: MarketEvent[];
  connectionState: number;
  connect: () => void;
  disconnect: () => void;
}

interface LiveTabProps {
  marketEvents: MarketEventsSource;
}

export function LiveTab({ marketEvents }: LiveTabProps) {
  const watchlist = useLiveStore((s) => s.watchlist);
  const showCheatsheet = useLiveStore((s) => s.showCheatsheet);
  const addSymbol = useLiveStore((s) => s.addSymbol);
  const removeSymbol = useLiveStore((s) => s.removeSymbol);
  const setShowCheatsheet = useLiveStore((s) => s.setShowCheatsheet);
  const toggleCheatsheet = useLiveStore((s) => s.toggleCheatsheet);

  const { events, connectionState, connect, disconnect } = marketEvents;

  // Cmd+` to toggle cheatsheet, Escape to close.
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "`" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleCheatsheet();
      }
      if (e.key === "Escape") {
        setShowCheatsheet(false);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCheatsheet, setShowCheatsheet]);

  const isConnected = connectionState === WebSocket.OPEN || connectionState === WebSocket.CONNECTING;

  // Filter events to watchlist symbols only.
  const filteredEvents = useMemo(() =>
    events.filter((e) => {
      if (e.kind !== "price_update") return false;
      const sym = (e.payload as { type: string; data: { symbol: string } }).data.symbol;
      return watchlist.includes(sym);
    }),
    [events, watchlist]
  );

  const handleAddSymbol = useCallback(
    (sym: string) => {
      addSymbol(sym);
    },
    [addSymbol]
  );

  const handleRemoveSymbol = useCallback(
    (sym: string) => {
      removeSymbol(sym);
    },
    [removeSymbol]
  );

  const connectionLabel =
    connectionState === WebSocket.OPEN
      ? "Connected"
      : connectionState === WebSocket.CONNECTING
        ? "Connecting"
        : "Disconnected";

  const connectionColor =
    connectionState === WebSocket.OPEN
      ? "bg-emerald-500"
      : connectionState === WebSocket.CONNECTING
        ? "bg-yellow-500"
        : "bg-red-500";

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-100">
              Live Market Data
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Real-time price feeds via WebSocket (jet-bus :3001)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCheatsheet(true)}
              className="flex items-center justify-center w-5 h-5 rounded-full border border-slate-600/50 text-[11px] text-slate-500 hover:text-slate-300 hover:border-slate-500/60 transition-all duration-150"
              title="Cheatsheet (⌘`)"
            >
              ?
            </button>
            <div className="h-3 w-px bg-slate-700/50" />
            <button
              onClick={() => isConnected ? disconnect() : connect()}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-medium transition-all duration-150 border ${
                isConnected
                  ? "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
                  : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            >
              {isConnected ? (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"/><rect x="14" y="4" width="4" height="16"/></svg>
                  Stop
                </>
              ) : (
                <>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>
                  Start
                </>
              )}
            </button>
            <span
              className={`w-2 h-2 rounded-full ${connectionColor} ${
                connectionState === WebSocket.CONNECTING ? "animate-pulse" : ""
              }`}
            />
            <span className="text-[11px] text-slate-400 font-mono">
              {connectionLabel}
            </span>
          </div>
        </div>

        {/* Connection error state — only show when user hasn't manually stopped */}
        {connectionState === WebSocket.CLOSED && (
          <div className="surface-card-static p-3.5 border border-slate-600/30">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 text-xs">
                Subscription paused. Click <strong className="text-slate-400">Start</strong> to resume, or ensure{" "}
                <code className="text-slate-400 bg-slate-800/60 px-1 rounded font-mono">cargo run -p jet-bus</code>{" "}
                is running on port 3001.
              </span>
            </div>
          </div>
        )}

        {/* Watchlist controls */}
        <SubscriptionControls
          watchlist={watchlist}
          onAdd={handleAddSymbol}
          onRemove={handleRemoveSymbol}
        />

        {/* Quote board */}
        <QuoteBoard watchlist={watchlist} events={filteredEvents} />

        {/* Event log */}
        <EventLog events={filteredEvents} />
      </div>

      {/* Cheatsheet modal */}
      {showCheatsheet && (
        <Cheatsheet onClose={() => setShowCheatsheet(false)} />
      )}
    </div>
  );
}
