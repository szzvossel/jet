import { create } from "zustand";
import type { TracerKpis } from "../types";

const LS_KEY = "tracer_watch_dir";

interface TracerState {
  kpis: TracerKpis | null;
  logDir: string;
  error: string | null;
  loaded: boolean;
  loading: boolean;
  setKpis: (k: TracerKpis | null) => void;
  setLogDir: (d: string) => void;
  setError: (e: string | null) => void;
  setLoaded: (v: boolean) => void;
  setLoading: (v: boolean) => void;
}

export const useTracerStore = create<TracerState>((set) => ({
  kpis: null,
  logDir: localStorage.getItem(LS_KEY) ?? "",
  error: null,
  loaded: false,
  loading: false,
  setKpis: (kpis) => set({ kpis }),
  setLogDir: (logDir) => {
    localStorage.setItem(LS_KEY, logDir);
    set({ logDir });
  },
  setError: (error) => set({ error }),
  setLoaded: (loaded) => set({ loaded }),
  setLoading: (loading) => set({ loading }),
}));
