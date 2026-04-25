/**
 * QuoteBoard — Grid of live QuoteCards for the watchlist.
 */

import { useMemo } from "react";
import { QuoteCard, buildQuote } from "./QuoteCard";
import type { MarketEvent } from "../../types";

interface QuoteBoardProps {
  watchlist: string[];
  events: MarketEvent[];
}

export function QuoteBoard({ watchlist, events }: QuoteBoardProps) {
  const quotes = useMemo(() => {
    const map = new Map<string, ReturnType<typeof buildQuote>>();
    for (const sym of watchlist) {
      map.set(sym, buildQuote(events, sym));
    }
    return map;
  }, [watchlist, events]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {watchlist.map((sym) => (
        <QuoteCard
          key={sym}
          symbol={sym}
          quote={quotes.get(sym) ?? null}
        />
      ))}
    </div>
  );
}
