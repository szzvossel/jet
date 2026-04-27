import { create } from "zustand";
import type { PricedStrategyResult } from "../types";

const HISTORY_KEY = "jet-strategy-history";
const MAX_HISTORY = 10;

function loadHistory(): string[] {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveHistory(input: string) {
  const hist = loadHistory().filter((h) => h !== input);
  hist.unshift(input);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(hist.slice(0, MAX_HISTORY)));
}

interface StrategyState {
  result: PricedStrategyResult | null;
  error: string | null;
  loading: boolean;
  history: string[];
  showCheatsheet: boolean;
  setResult: (r: PricedStrategyResult | null) => void;
  setError: (e: string | null) => void;
  setLoading: (v: boolean) => void;
  addHistory: (input: string) => void;
  setShowCheatsheet: (v: boolean) => void;
  toggleCheatsheet: () => void;
}

export const useStrategyStore = create<StrategyState>((set) => ({
  result: null,
  error: null,
  loading: false,
  history: loadHistory(),
  showCheatsheet: false,
  setResult: (result) => set({ result }),
  setError: (error) => set({ error }),
  setLoading: (loading) => set({ loading }),
  addHistory: (input) => {
    saveHistory(input);
    set({ history: loadHistory() });
  },
  setShowCheatsheet: (showCheatsheet) => set({ showCheatsheet }),
  toggleCheatsheet: () => set((s) => ({ showCheatsheet: !s.showCheatsheet })),
}));
