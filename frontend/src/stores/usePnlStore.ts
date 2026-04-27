import { create } from "zustand";
import type { PnlExplain } from "../types";

interface PnlState {
  pnlData: PnlExplain | null;
  setPnlData: (d: PnlExplain | null) => void;
}

export const usePnlStore = create<PnlState>((set) => ({
  pnlData: null,
  setPnlData: (pnlData) => set({ pnlData }),
}));
