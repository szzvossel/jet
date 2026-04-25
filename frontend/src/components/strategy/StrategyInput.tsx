/**
 * StrategyInput — Text input form for option strategy quote strings.
 */

import React, { useState } from "react";

interface Props {
  onParse: (input: string) => void;
  loading: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
  onCheatsheet?: () => void;
}

const EXAMPLES = [
  { label: "Single Call", quote: "SPX may26 110% Call A" },
  { label: "Single Put", quote: "SPX may26 90% Put A" },
  { label: "Bull Call Spread", quote: "SPX may26 +1 100%C A / -1 110%C A" },
  { label: "Bear Call Spread", quote: "SPX may26 -1 100%C A / +1 110%C A" },
  { label: "Bull Put Spread", quote: "SPX may26 -1 90%P A / +1 80%P A" },
  { label: "Bear Put Spread", quote: "SPX may26 +1 100%P A / -1 90%P A" },
  { label: "Straddle", quote: "SPX may26 +1 100%C A / +1 100%P A" },
  { label: "Strangle", quote: "SPX may26 +1 105%C A / +1 95%P A" },
  { label: "Call Calendar", quote: "SPX may26 +1 100%C A / -1 100%C A" },
  { label: "Iron Condor", quote: "SPX may26 -1 105%C A / +1 110%C A / -1 95%P A / +1 90%P A" },
];

export function StrategyInput({ onParse, loading, inputRef, onCheatsheet }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onParse(input.trim());
    }
  };

  return (
    <div className="surface-card-static p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-[13px] font-semibold text-slate-300 cursor-default tracking-tight">
          Strategy Input
        </h2>
        {onCheatsheet && (
          <button
            type="button"
            onClick={onCheatsheet}
            className="w-5 h-5 rounded-full border border-slate-600/50 text-slate-500 hover:text-slate-300 hover:border-slate-500/60 transition-colors flex items-center justify-center text-[11px] font-bold leading-none"
            title="Cheatsheet (⌘`)"
          >
            ?
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            ref={inputRef ?? undefined}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && input.trim()) {
                e.preventDefault();
                onParse(input.trim());
              }
            }}
            placeholder='e.g. SPX may26 110% Call A  —  Cmd+Enter to parse'
            className="input-refined flex-1 px-3 py-2 text-sm text-slate-100"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="btn-primary px-4 py-2 text-sm"
          >
            {loading ? (
              <span className="flex items-center gap-1.5">
                <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Parsing
              </span>
            ) : "Parse"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => {
                setInput(ex.quote);
                onParse(ex.quote);
              }}
              className="text-[11px] px-2 py-1 bg-slate-900/60 hover:bg-slate-700/60 text-slate-500 hover:text-slate-300 rounded border border-slate-700/40 transition-all duration-150 hover:border-slate-600/50"
              title={ex.quote}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
