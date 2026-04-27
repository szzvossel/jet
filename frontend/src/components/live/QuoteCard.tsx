/**
 * QuoteCard — Live quote display for a single symbol.
 *
 * Shows spot, bid/ask, change%, and a flash + scale animation on each tick.
 */

import { useEffect, useRef, useState } from "react";
import type { MarketEvent, PriceUpdatePayload } from "../../types";

interface Quote {
  spot: number;
  bid: number;
  ask: number;
  openSpot: number;
  lastPrice: number;
  tickDirection: "up" | "down" | "flat";
}

export function buildQuote(events: MarketEvent[], symbol: string): Quote | null {
  const priceEvents = events.filter(
    (e) =>
      e.kind === "price_update" &&
      (e.payload as PriceUpdatePayload).data.symbol === symbol
  );
  if (priceEvents.length === 0) return null;

  // Accumulate state from the 3 tick types.
  let spot = 0;
  let bid = 0;
  let ask = 0;
  let openSpot = 0;
  let prevSpot = 0;
  let lastPrice = 0;
  let hasLast = false;
  let hasOpen = false;

  for (const evt of priceEvents) {
    const d = (evt.payload as PriceUpdatePayload).data;
    switch (d.tick_type) {
      case "last":
        if (!hasOpen) {
          openSpot = d.price;
          hasOpen = true;
        }
        prevSpot = spot;
        spot = d.price;
        lastPrice = d.price;
        hasLast = true;
        break;
      case "bid":
        bid = d.price;
        break;
      case "ask":
        ask = d.price;
        break;
    }
  }

  if (!hasLast) return null;

  return {
    spot,
    bid,
    ask,
    openSpot,
    lastPrice,
    tickDirection: spot > prevSpot ? "up" : spot < prevSpot ? "down" : "flat",
  };
}

interface QuoteCardProps {
  symbol: string;
  quote: Quote | null;
}

export function QuoteCard({ symbol, quote }: QuoteCardProps) {
  const prevSpotRef = useRef(0);
  const [tickId, setTickId] = useState(0);
  const [tickDir, setTickDir] = useState<"up" | "down">("up");

  // Detect spot changes and fire animation
  useEffect(() => {
    if (!quote) return;
    if (prevSpotRef.current !== 0 && quote.lastPrice !== prevSpotRef.current) {
      setTickDir(quote.lastPrice > prevSpotRef.current ? "up" : "down");
      setTickId((n) => n + 1);
    }
    prevSpotRef.current = quote.lastPrice;
  }, [quote?.lastPrice]);

  if (!quote) {
    return (
      <div className="surface-card-static p-3.5 animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-4 bg-slate-700/50 rounded w-12" />
          <div className="h-3 bg-slate-700/40 rounded w-14" />
        </div>
        <div className="h-6 bg-slate-700/40 rounded w-24 mb-2" />
        <div className="h-3 bg-slate-700/30 rounded w-32" />
      </div>
    );
  }

  const changePct = ((quote.spot - quote.openSpot) / quote.openSpot) * 100;
  const isPositive = changePct >= 0;

  const isFirstTick = tickId === 0;

  return (
    <div className="surface-card-static p-3.5 overflow-hidden relative">
      {/* Background glow — plays once via CSS animation, keyed by tickId */}
      {!isFirstTick && (
        <div
          key={`glow-${tickId}`}
          className="absolute inset-0"
          style={{
            animation: "tick-glow 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
            background:
              tickDir === "up"
                ? "radial-gradient(ellipse at 50% 80%, rgba(16, 185, 129, 0.12) 0%, transparent 70%)"
                : "radial-gradient(ellipse at 50% 80%, rgba(239, 68, 68, 0.12) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Header: symbol + change */}
      <div className="relative flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-100 tracking-wide">
          {symbol}
        </span>
        <span
          className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded transition-colors duration-300 ${
            isPositive
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-red-400 bg-red-500/10"
          }`}
        >
          {isPositive ? "+" : ""}
          {changePct.toFixed(2)}%
        </span>
      </div>

      {/* Spot price — new key per tick replays animation once, lands at normal */}
      <div className="relative mb-1.5">
        <span
          key={`price-${tickId}`}
          className={`inline-block text-xl font-bold font-mono transition-colors duration-300 ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
          style={{
            animation: isFirstTick
              ? "none"
              : "tick-flash 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
          }}
        >
          {quote.spot.toFixed(2)}
        </span>
        {/* Direction arrow — animates in and fades out */}
        {!isFirstTick && (
          <span
            key={`arrow-${tickId}`}
            className="ml-1.5 text-xs font-bold inline-block"
            style={{
              animation: "tick-arrow 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards",
              color: tickDir === "up" ? "#34d399" : "#f87171",
            }}
          >
            {tickDir === "up" ? "▲" : "▼"}
          </span>
        )}
      </div>

      {/* Bid / Ask */}
      <div className="relative flex items-center gap-3 text-[10px] text-slate-500 font-mono mb-2">
        <span>
          B <span className="text-slate-300">{quote.bid.toFixed(2)}</span>
        </span>
        <span>
          A <span className="text-slate-300">{quote.ask.toFixed(2)}</span>
        </span>
      </div>
    </div>
  );
}
