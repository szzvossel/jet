/**
 * LiveSpotContext — Shared live spot prices from jet-bus.
 *
 * LiveTab writes spot prices here, PricingTab reads them.
 * The context is optional — if no live data is available, components
 * fall back to their own state.
 */

import { createContext, useContext, useRef, useCallback } from "react";

interface LiveSpotMap {
  get: (symbol: string) => number | undefined;
  set: (symbol: string, spot: number) => void;
  symbols: () => string[];
}

const LiveSpotContext = createContext<LiveSpotMap | null>(null);

export function useLiveSpotMap(): LiveSpotMap {
  return useContext(LiveSpotContext)!;
}

export function useLiveSpotProvider(): LiveSpotMap {
  const mapRef = useRef<Map<string, number>>(new Map());

  const get = useCallback((symbol: string) => {
    return mapRef.current.get(symbol);
  }, []);

  const set = useCallback((symbol: string, spot: number) => {
    mapRef.current.set(symbol, spot);
  }, []);

  const symbols = useCallback(() => {
    return Array.from(mapRef.current.keys());
  }, []);

  return { get, set, symbols };
}

export { LiveSpotContext };
