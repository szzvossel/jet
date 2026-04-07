/**
 * StrategyInput — Text input form for option strategy quote strings.
 */

import React, { useState } from "react";

interface Props {
  onParse: (input: string) => void;
  loading: boolean;
}

const EXAMPLES = [
  "SPX apr26 110% Call A",
  "SPX apr26 5500 Call E",
  "SPX 2026-04-18 110% C A",
  "SPX 18Apr26 110% Call A",
  "SPY jun26 105P A",
  "SPX apr26 +1 110%C A / -1 100%P A",
];

export function StrategyInput({ onParse, loading }: Props) {
  const [input, setInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onParse(input.trim());
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <h2 className="text-sm font-semibold text-slate-300 mb-3">
        Option Strategy Input
      </h2>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g. SPX apr26 110% Call A'
            className="flex-1 bg-slate-900 border border-slate-600 rounded px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 font-mono"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="px-4 py-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-700 disabled:text-slate-500 text-white text-sm font-medium rounded transition-colors"
          >
            {loading ? "Parsing..." : "Parse"}
          </button>
        </div>
        <div className="flex flex-wrap gap-1">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              type="button"
              onClick={() => {
                setInput(ex);
                onParse(ex);
              }}
              className="text-xs px-2 py-1 bg-slate-900 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded border border-slate-700 transition-colors font-mono"
            >
              {ex}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
}
