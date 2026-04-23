/**
 * StrategyInput — Text input form for option strategy quote strings.
 */

import React, { useState } from "react";

interface Props {
  onParse: (input: string) => void;
  loading: boolean;
}

const EXAMPLES = [
  "SPX may26 110% Call A",
  "SPX may26 5500 Call E",
  "SPX 2026-05-15 110% C A",
  "SPX 15May26 110% Call A",
  "SPY jun26 105P A",
  "SPX may26 +1 110%C A / -1 100%P A",
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

export function StrategyInput({ onParse, loading }: Props) {
  const [input, setInput] = useState("");
  const [showHint, setShowHint] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onParse(input.trim());
    }
  };

  return (
    <div className="bg-slate-800 rounded-lg p-4 border border-slate-700">
      <div className="relative inline-block mb-3">
        <h2
          className="text-sm font-semibold text-slate-300 cursor-default"
          onMouseEnter={() => setShowHint(true)}
          onMouseLeave={() => setShowHint(false)}
        >
          Option Strategy Input
          <span className="ml-1 text-xs text-slate-500">?</span>
        </h2>

        {showHint && (
          <div className="absolute top-full left-0 mt-2 z-50 w-[520px] bg-slate-900 border border-slate-600 rounded-lg shadow-2xl shadow-black/50">
            <div className="px-4 py-2 border-b border-slate-700">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Supported Strategies
              </h3>
            </div>
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="px-4 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">Strategy</th>
                  <th className="px-3 py-1.5 text-center text-xs font-medium text-slate-500 uppercase">Legs</th>
                  <th className="px-3 py-1.5 text-center text-xs font-medium text-slate-500 uppercase">Type</th>
                  <th className="px-4 py-1.5 text-left text-xs font-medium text-slate-500 uppercase">Description</th>
                </tr>
              </thead>
              <tbody>
                {SUPPORTED_STRATEGIES.map((s) => (
                  <tr key={s.name} className="border-b border-slate-800 last:border-0">
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
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g. SPX may26 110% Call A'
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
