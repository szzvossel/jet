/**
 * EventLog — Scrollable feed of recent bus events with color coding.
 */

import { useRef, useEffect } from "react";
import type { EventKind, MarketEvent, PriceUpdatePayload } from "../../types";

const KIND_STYLES: Record<EventKind, { label: string; color: string; bg: string }> = {
  price_update: { label: "PRICE", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  greeks_update: { label: "GREEK", color: "text-blue-400", bg: "bg-blue-500/10" },
  vol_surface_shift: { label: "VOL", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  risk_alert: { label: "RISK", color: "text-red-400", bg: "bg-red-500/10" },
  pnl_snapshot: { label: "P&L", color: "text-purple-400", bg: "bg-purple-500/10" },
  market_snapshot: { label: "SNAP", color: "text-cyan-400", bg: "bg-cyan-500/10" },
};

/** Override label for price_update events based on tick_type. */
function priceLabel(event: MarketEvent): string {
  if (event.kind !== "price_update") return "PRICE";
  const d = (event.payload as PriceUpdatePayload).data;
  switch (d.tick_type) {
    case "last": return "LAST";
    case "bid": return "BID";
    case "ask": return "ASK";
  }
}

function formatEventSummary(event: MarketEvent): string {
  const p = event.payload as { type: string; data: Record<string, unknown> };
  const d = p.data;
  switch (event.kind) {
    case "price_update": {
      const pd = (event.payload as PriceUpdatePayload).data;
      switch (pd.tick_type) {
        case "last":
          return `${pd.symbol} ${pd.price.toFixed(2)}`;
        case "bid":
          return `${pd.symbol} bid=${pd.price.toFixed(2)} size=${pd.size}`;
        case "ask":
          return `${pd.symbol} ask=${pd.price.toFixed(2)} size=${pd.size}`;
      }
    }
    case "greeks_update":
      return `${d.symbol} Δ=${(d.delta as number).toFixed(4)} Γ=${(d.gamma as number).toFixed(6)} V=${(d.vega as number).toFixed(4)}`;
    case "risk_alert":
      return `[${d.severity}] ${d.message}`;
    case "pnl_snapshot":
      return `total=${(d.total_pnl as number).toFixed(2)} Δ=${(d.delta_pnl as number).toFixed(2)} Γ=${(d.gamma_pnl as number).toFixed(2)}`;
    case "market_snapshot":
      return `${d.symbol} spot=${(d.spot as number).toFixed(2)} IV=${((d.implied_vol as number) * 100).toFixed(2)}%`;
    case "vol_surface_shift":
      return `${d.symbol} ATM=${((d.atm_vol as number) * 100).toFixed(2)}% skew=${(d.skew as number).toFixed(4)}`;
    default:
      return JSON.stringify(d);
  }
}

interface EventLogProps {
  events: MarketEvent[];
  maxVisible?: number;
}

export function EventLog({ events, maxVisible = 80 }: EventLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new events.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, [events]);

  const visible = events.slice(-maxVisible);

  return (
    <div className="surface-card-static">
      <div className="px-3.5 py-2.5 border-b border-slate-700/30 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Event Feed
        </h3>
        <span className="text-[10px] text-slate-600 font-mono">
          {events.length} events
        </span>
      </div>
      <div
        ref={scrollRef}
        className="overflow-y-auto font-mono text-[10px] leading-relaxed"
        style={visible.length > 0 ? { maxHeight: "340px" } : undefined}
      >
        {visible.length === 0 ? (
          <div className="px-3.5 py-6 text-center text-slate-600">
            Waiting for events...
          </div>
        ) : (
          visible.map((event) => {
            const style = KIND_STYLES[event.kind] ?? {
              label: "???",
              color: "text-slate-400",
              bg: "bg-slate-500/10",
            };
            const label = event.kind === "price_update" ? priceLabel(event) : style.label;
            const time = new Date(event.timestamp).toLocaleTimeString("en-US", {
              hour12: false,
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            });

            return (
              <div
                key={event.id}
                className="px-3.5 py-1 border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors"
              >
                <span className="text-slate-600 mr-2">{time}</span>
                <span
                  className={`inline-block px-1 py-0.5 rounded text-[9px] font-bold ${style.color} ${style.bg} mr-2`}
                >
                  {label}
                </span>
                <span className="text-slate-400">
                  {formatEventSummary(event)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
