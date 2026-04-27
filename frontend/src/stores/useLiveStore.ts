import { create } from "zustand";

const WATCHLIST_KEY = "jet-watchlist";
const DEFAULT_WATCHLIST = ["SPX", "SPY", "QQQ", "SX5E"];

function loadWatchlist(): string[] {
  try {
    const stored = localStorage.getItem(WATCHLIST_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_WATCHLIST;
}

interface LiveState {
  watchlist: string[];
  showCheatsheet: boolean;
  addSymbol: (sym: string) => void;
  removeSymbol: (sym: string) => void;
  setShowCheatsheet: (v: boolean) => void;
  toggleCheatsheet: () => void;
}

export const useLiveStore = create<LiveState>((set) => ({
  watchlist: loadWatchlist(),
  showCheatsheet: false,
  addSymbol: (sym) =>
    set((s) => {
      if (s.watchlist.includes(sym)) return s;
      const watchlist = [...s.watchlist, sym];
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
      return { watchlist };
    }),
  removeSymbol: (sym) =>
    set((s) => {
      const watchlist = s.watchlist.filter((w) => w !== sym);
      localStorage.setItem(WATCHLIST_KEY, JSON.stringify(watchlist));
      return { watchlist };
    }),
  setShowCheatsheet: (showCheatsheet) => set({ showCheatsheet }),
  toggleCheatsheet: () => set((s) => ({ showCheatsheet: !s.showCheatsheet })),
}));
