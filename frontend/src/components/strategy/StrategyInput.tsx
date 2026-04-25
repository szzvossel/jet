/**
 * StrategyInput — Text input form for option strategy quote strings.
 */

import React, { useState } from "react";

interface Props {
  onParse: (input: string) => void;
  loading: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
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

const SUPPORTED_STRATEGIES = [
  { name: "Single Option", legs: 1, type: "Directional", description: "Long or short Call / Put" },
  { name: "Bull Call Spread", legs: 2, type: "Bullish", description: "Long lower-strike Call, Short higher-strike Call" },
  { name: "Bear Call Spread", legs: 2, type: "Bearish", description: "Short lower-strike Call, Long higher-strike Call" },
  { name: "Bull Put Spread", legs: 2, type: "Bullish", description: "Short lower-strike Put, Long higher-strike Put" },
  { name: "Bear Put Spread", legs: 2, type: "Bearish", description: "Long higher-strike Put, Short lower-strike Put" },
  { name: "Call Calendar Spread", legs: 2, type: "Neutral", description: "Same-strike Calls, opposite directions" },
  { name: "Put Calendar Spread", legs: 2, type: "Neutral", description: "Same-strike Puts, opposite directions" },
  { name: "Straddle", legs: 2, type: "Volatility", description: "Call + Put at the same strike" },
  { name: "Strangle", legs: 2, type: "Volatility", description: "Call + Put at different strikes" },
  { name: "Iron Condor", legs: 4, type: "Neutral", description: "2 Puts + 2 Calls, 2 Long + 2 Short" },
  { name: "N-Leg Strategy", legs: 3, type: "Generic", description: "Any other multi-leg combination" },
];

function typeBadgeClass(type: string): string {
  switch (type) {
    case "Bullish": return "bg-green-900/50 text-green-400";
    case "Bearish": return "bg-red-900/50 text-red-400";
    case "Volatility": return "bg-yellow-900/50 text-yellow-400";
    case "Neutral": return "bg-blue-900/50 text-blue-400";
    default: return "bg-slate-700 text-slate-400";
  }
}

export function StrategyInput({ onParse, loading, inputRef }: Props) {
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onParse(input.trim());
    }
  };

  return (
    <div className="surface-card-static p-4">
      <div className="relative inline-block mb-3">
        <h2
          className="text-[13px] font-semibold text-slate-300 cursor-default tracking-tight"
          onMouseEnter={() => setShowHint(true)}
          onMouseLeave={() => setShowHint(false)}
        >
          Strategy Input
          <span className="ml-1.5 text-[10px] text-slate-600 bg-slate-800 px-1.5 py-0.5 rounded-full">?</span>
        </h2>

        {showHint && (
          <div className="absolute top-full left-0 mt-2 z-50 w-[520px] surface-card-static shadow-2xl shadow-black/50 overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-700/50">
              <h3 className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Supported Strategies
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800/50">
                  <th className="px-4 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase">Strategy</th>
                  <th className="px-3 py-1.5 text-center text-[10px] font-medium text-slate-500 uppercase">Legs</th>
                  <th className="px-3 py-1.5 text-center text-[10px] font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody>
                {SUPPORTED_STRATEGIES.map((s) => (
                  <tr key={s.name} className="border-b border-slate-800/30 last:border-0 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-1.5 text-xs font-medium text-brand-400">{s.name}</td>
                    <td className="px-3 py-1.5 text-xs text-slate-300 text-center">{s.legs}</td>
                    <td className="px-3 py-1.5 text-center">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${typeBadgeClass(s.type)}`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-1.5 text-xs text-slate-400">{s.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
