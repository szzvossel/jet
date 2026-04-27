import { create } from "zustand";
import type {
  OptionType,
  OptionContract,
  MarketData,
  PricingResult,
  GreeksCurveResult,
} from "../types";

interface PricingState {
  contract: OptionContract;
  market: MarketData;
  result: PricingResult | null;
  curveData: Array<{ spot: number; price: number }>;
  greeksData: GreeksCurveResult | null;
  useLiveSpot: boolean;
  liveSymbol: string;
  error: string | null;
  hasPricedOnce: boolean;
  setContract: (c: OptionContract) => void;
  setMarket: (m: MarketData) => void;
  setResult: (r: PricingResult | null) => void;
  setCurveData: (d: Array<{ spot: number; price: number }>) => void;
  setGreeksData: (d: GreeksCurveResult | null) => void;
  setUseLiveSpot: (v: boolean) => void;
  setLiveSymbol: (s: string) => void;
  setError: (e: string | null) => void;
  setHasPricedOnce: (v: boolean) => void;
}

export const usePricingStore = create<PricingState>((set) => ({
  contract: {
    option_type: "Call" as OptionType,
    strike: 100.0,
    time_to_expiry: 0.25,
  },
  market: {
    spot: 100.0,
    risk_free_rate: 0.05,
    volatility: 0.20,
    dividend_yield: 0.0,
  },
  result: null,
  curveData: [],
  greeksData: null,
  useLiveSpot: false,
  liveSymbol: "SPX",
  error: null,
  hasPricedOnce: false,
  setContract: (contract) => set({ contract }),
  setMarket: (market) => set({ market }),
  setResult: (result) => set({ result }),
  setCurveData: (curveData) => set({ curveData }),
  setGreeksData: (greeksData) => set({ greeksData }),
  setUseLiveSpot: (useLiveSpot) => set({ useLiveSpot }),
  setLiveSymbol: (liveSymbol) => set({ liveSymbol }),
  setError: (error) => set({ error }),
  setHasPricedOnce: (hasPricedOnce) => set({ hasPricedOnce }),
}));
