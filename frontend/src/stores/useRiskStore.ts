import { create } from "zustand";
import type { RiskSummary } from "../types";

interface RiskState {
  riskData: RiskSummary | null;
  setRiskData: (d: RiskSummary | null) => void;
}

export const useRiskStore = create<RiskState>((set) => ({
  riskData: null,
  setRiskData: (riskData) => set({ riskData }),
}));
