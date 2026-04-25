/**
 * SubscriptionControls — Add/remove symbols from the watchlist.
 * Persisted to localStorage.
 */

import { useState, useRef, useEffect } from "react";

const SYMBOL_INFO: { symbol: string; name: string }[] = [
  { symbol: "SPX", name: "S&P 500 Index" },
  { symbol: "SPY", name: "SPDR S&P 500 ETF" },
  { symbol: "QQQ", name: "Invesco QQQ Trust" },
  { symbol: "IWM", name: "iShares Russell 2000" },
  { symbol: "DIA", name: "SPDR Dow Jones Industrial Avg" },
  { symbol: "EEM", name: "iShares MSCI Emerging Markets" },
  { symbol: "SX5E", name: "Euro Stoxx 50 Index" },
];

interface SubscriptionControlsProps {
  watchlist: string[];
  onAdd: (symbol: string) => void;
  onRemove: (symbol: string) => void;
}

export function SubscriptionControls({
  watchlist,
  onAdd,
  onRemove,
}: SubscriptionControlsProps) {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const available = SYMBOL_INFO.filter((s) => !watchlist.includes(s.symbol));
  const filtered = available.filter(
    (s) =>
      s.symbol.toLowerCase().includes(input.toLowerCase()) ||
      s.name.toLowerCase().includes(input.toLowerCase())
  );

  // Close dropdown on outside click.
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = (sym: string) => {
    onAdd(sym);
    setInput("");
    setOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      const sym = input.trim().toUpperCase();
      if (available.some((s) => s.symbol === sym)) {
        handleSelect(sym);
      }
    }
    if (e.key === "Escape") {
      setOpen(false);
    }
  };

  return (
    <div className="surface-card-static p-3.5">
      <div className="flex items-center gap-2 mb-2.5">
        <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
          Watchlist
        </span>
        <span className="text-[10px] text-slate-600 font-mono">
          {watchlist.length} symbols
        </span>
      </div>

      {/* Current watchlist as removable chips */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        {watchlist.map((sym) => (
          <span
            key={sym}
            className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-medium bg-brand-500/10 text-brand-300 border border-brand-500/20"
          >
            {sym}
            <button
              onClick={() => onRemove(sym)}
              className="text-slate-500 hover:text-red-400 transition-colors ml-0.5"
              title={`Remove ${sym}`}
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </span>
        ))}
      </div>

      {/* Add symbol with dropdown */}
      <div className="flex items-center gap-2" ref={wrapperRef}>
        <div className="relative w-48">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            placeholder="Add symbol..."
            className="input-refined px-2 py-1 text-[11px] text-slate-200 w-full"
          />
          {open && filtered.length > 0 && (
            <div className="absolute z-40 top-full left-0 mt-1 w-full bg-slate-800 border border-slate-600/50 rounded shadow-xl overflow-hidden">
              {filtered.map((s) => (
                <button
                  key={s.symbol}
                  type="button"
                  onClick={() => handleSelect(s.symbol)}
                  className="w-full flex items-center justify-between px-2.5 py-1.5 text-[11px] hover:bg-slate-700/60 transition-colors"
                >
                  <span className="font-bold text-slate-200">{s.symbol}</span>
                  <span className="text-slate-500 truncate ml-2">{s.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={() => {
            const sym = input.trim().toUpperCase();
            if (available.some((s) => s.symbol === sym)) {
              handleSelect(sym);
            }
          }}
          disabled={!input.trim() || !available.some((s) => s.symbol === input.trim().toUpperCase())}
          className="px-2 py-1 text-[11px] font-medium bg-brand-600 text-white rounded hover:bg-brand-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          Add
        </button>
      </div>
    </div>
  );
}
