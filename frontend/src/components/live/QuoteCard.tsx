/**
 * QuoteCard — Live quote display for a single symbol.
 *
 * Shows spot, bid/ask, change%, volume, and a color flash on tick direction.
 */

import type { MarketEvent, PriceUpdatePayload } from "../../types";

interface Quote {
  spot: number;
  bid: number;
  ask: number;
  openSpot: number;
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
    tickDirection: spot > prevSpot ? "up" : spot < prevSpot ? "down" : "flat",
  };
}

interface QuoteCardProps {
  symbol: string;
  quote: Quote | null;
}

export function QuoteCard({ symbol, quote }: QuoteCardProps) {
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
  const flashClass =
    quote.tickDirection === "up"
      ? "bg-emerald-500/10"
      : quote.tickDirection === "down"
        ? "bg-red-500/10"
        : "";

  return (
    <div
      className={`surface-card-static p-3.5 transition-colors duration-300 ${flashClass}`}
    >
      {/* Header: symbol + change */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-bold text-slate-100 tracking-wide">
          {symbol}
        </span>
        <span
          className={`text-[11px] font-mono font-medium px-1.5 py-0.5 rounded ${
            isPositive
              ? "text-emerald-400 bg-emerald-500/10"
              : "text-red-400 bg-red-500/10"
          }`}
        >
          {isPositive ? "+" : ""}
          {changePct.toFixed(2)}%
        </span>
      </div>

      {/* Spot price */}
      <div className="mb-1.5">
        <span
          className={`text-xl font-bold font-mono ${
            isPositive ? "text-emerald-400" : "text-red-400"
          }`}
        >
          {quote.spot.toFixed(2)}
        </span>
      </div>

      {/* Bid / Ask */}
      <div className="flex items-center gap-3 text-[10px] text-slate-500 font-mono mb-2">
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
