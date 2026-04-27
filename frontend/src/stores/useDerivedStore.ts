import { create } from "zustand";
import type {
  VolSurface,
  CurveData,
  DividendCurve,
  CorrelationMatrix,
  CorrelationEntry,
} from "../types";

type DerivedSection = "volatility" | "dividend" | "repo" | "correlation";

interface DerivedState {
  activeSection: DerivedSection;
  volSurface: VolSurface | null;
  curves: CurveData[];
  dividends: DividendCurve | null;
  correlationMatrix: CorrelationMatrix | null;
  correlationEntries: CorrelationEntry[];
  setActiveSection: (s: DerivedSection) => void;
  setVolSurface: (v: VolSurface | null) => void;
  setCurves: (c: CurveData[]) => void;
  setDividends: (d: DividendCurve | null) => void;
  setCorrelationMatrix: (m: CorrelationMatrix | null) => void;
  setCorrelationEntries: (e: CorrelationEntry[]) => void;
}

export const useDerivedStore = create<DerivedState>((set) => ({
  activeSection: "volatility",
  volSurface: null,
  curves: [],
  dividends: null,
  correlationMatrix: null,
  correlationEntries: [],
  setActiveSection: (activeSection) => set({ activeSection }),
  setVolSurface: (volSurface) => set({ volSurface }),
  setCurves: (curves) => set({ curves }),
  setDividends: (dividends) => set({ dividends }),
  setCorrelationMatrix: (correlationMatrix) => set({ correlationMatrix }),
  setCorrelationEntries: (correlationEntries) => set({ correlationEntries }),
}));
