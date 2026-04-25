/**
 * StrategyCheatsheet — Modal explaining quote syntax and grid columns
 * for the Option Strategy tab.
 */

interface StrategyCheatsheetProps {
  onClose: () => void;
}

const SECTIONS = [
  {
    title: "Quote Input Syntax",
    desc: "Enter a multi-leg strategy as a single line:",
    items: [
      { symbol: "SPX", label: "Symbol", desc: "SPX, SPY, QQQ, IWM, DIA, EEM" },
      { symbol: "may26", label: "Expiry", desc: "monYY, ISO date (2026-05-15), or DDMonYY" },
      { symbol: "+1 / -1", label: "Quantity", desc: "+1 = long, -1 = short" },
      { symbol: "110%C", label: "Strike + Type", desc: "Percentage of spot (110%C) or absolute (5500C)" },
      { symbol: "A / E", label: "Style", desc: "A = American (default), E = European" },
      { symbol: "/", label: "Leg separator", desc: "Separate legs with /" },
    ],
  },
  {
    title: "Example Quotes",
    items: [
      { symbol: "SPX may26 110%C A", label: "Single Call", desc: "" },
      { symbol: "SPX may26 +1 100%C A / +1 100%P A", label: "Straddle", desc: "Same strike Call + Put" },
      { symbol: "SPX may26 -1 105%C A / +1 110%C A / -1 95%P A / +1 90%P A", label: "Iron Condor", desc: "4-leg neutral" },
    ],
  },
  {
    title: "Grid Columns",
    items: [
      { symbol: "Symbol", label: "Underlying ticker", desc: "e.g. SPX, SPY" },
      { symbol: "Strike %", label: "Strike as % of spot", desc: "110% = 10% OTM" },
      { symbol: "Price", label: "BSM fair value", desc: "Black-Scholes model price" },
      { symbol: "Δ", label: "Delta", desc: "Price sensitivity per $1 move" },
      { symbol: "Γ", label: "Gamma", desc: "Rate of delta change" },
      { symbol: "V", label: "Vega", desc: "Sensitivity to implied vol ±1%" },
      { symbol: "Θ", label: "Theta", desc: "Daily time decay" },
      { symbol: "ρ", label: "Rho", desc: "Sensitivity to interest rate" },
    ],
  },
  {
    title: "Strategy Types",
    items: [
      { symbol: "Bullish", label: "Bull Spread, Bull Put", desc: "Profit when underlying rises", color: "text-green-400" },
      { symbol: "Bearish", label: "Bear Spread, Bear Put", desc: "Profit when underlying falls", color: "text-red-400" },
      { symbol: "Volatility", label: "Straddle, Strangle", desc: "Profit from large moves either direction", color: "text-yellow-400" },
      { symbol: "Neutral", label: "Iron Condor, Calendar", desc: "Profit from low volatility / time", color: "text-blue-400" },
    ],
  },
  {
    title: "Keyboard Shortcuts",
    items: [
      { symbol: "⌘Enter", label: "Parse quote", desc: "Submit the input field" },
      { symbol: "⌘`", label: "Toggle cheatsheet", desc: "This dialog" },
      { symbol: "Esc", label: "Close cheatsheet", desc: "" },
    ],
  },
];

export function StrategyCheatsheet({ onClose }: StrategyCheatsheetProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/60 backdrop-blur-sm animate-fade-up"
      onClick={onClose}
    >
      <div
        className="surface-card-static w-full max-w-lg mx-4 my-6 border border-slate-600/40 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-700/40">
          <h3 className="text-sm font-bold text-slate-100">
            Option Strategy — Cheatsheet
          </h3>
          <div className="flex items-center gap-2">
            <kbd className="text-[9px] px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-500 border border-slate-700/50 font-mono">
              ⌘`
            </kbd>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="px-5 py-3 space-y-4">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h4 className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-2">
                {section.title}
              </h4>
              {section.desc && (
                <p className="text-[10px] text-slate-600 mb-1.5">{section.desc}</p>
              )}
              <div className="space-y-1">
                {section.items.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-3 py-1">
                    <span
                      className={`text-[11px] font-mono font-bold min-w-[48px] text-right shrink-0 ${
                        ("color" in item ? (item as { color?: string }).color : "") || "text-brand-400"
                      }`}
                    >
                      {item.symbol}
                    </span>
                    <div className="min-w-0">
                      <span className="text-[11px] font-medium text-slate-300">
                        {item.label}
                      </span>
                      {item.desc && (
                        <span className="text-[10px] text-slate-600 ml-1.5">
                          — {item.desc}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-2.5 border-t border-slate-700/40 text-center">
          <span className="text-[10px] text-slate-600">
            Press <kbd className="px-1 py-0.5 rounded bg-slate-800/80 text-slate-500 border border-slate-700/50 font-mono text-[9px]">⌘`</kbd> or <kbd className="px-1 py-0.5 rounded bg-slate-800/80 text-slate-500 border border-slate-700/50 font-mono text-[9px]">Esc</kbd> to close
          </span>
        </div>
      </div>
    </div>
  );
}
