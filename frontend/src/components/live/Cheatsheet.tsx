/**
 * Cheatsheet — Modal explaining symbols used in the Live tab.
 */

interface CheatsheetProps {
  onClose: () => void;
}

const SECTIONS = [
  {
    title: "Quote Card Fields",
    items: [
      { symbol: "Spot", label: "Last traded price", desc: "Current market price of the underlying" },
      { symbol: "B", label: "Bid", desc: "Highest price a buyer is willing to pay" },
      { symbol: "A", label: "Ask", desc: "Lowest price a seller is willing to accept" },
      { symbol: "+/-", label: "Change %", desc: "Price change since first tick in session" },
    ],
  },
  {
    title: "Event Feed Tags",
    items: [
      { symbol: "LAST", label: "Last Trade", desc: "Last traded price for a symbol", color: "text-emerald-400" },
      { symbol: "BID", label: "Bid Tick", desc: "Bid price and bid size", color: "text-emerald-400" },
      { symbol: "ASK", label: "Ask Tick", desc: "Ask price and ask size", color: "text-emerald-400" },
    ],
  },
  {
    title: "Connection Status",
    items: [
      { symbol: "●", label: "Green", desc: "Connected to jet-bus", color: "text-emerald-500" },
      { symbol: "●", label: "Yellow", desc: "Connecting / reconnecting", color: "text-yellow-500" },
      { symbol: "●", label: "Red", desc: "Disconnected", color: "text-red-500" },
    ],
  },
  {
    title: "Underlying Symbols",
    items: [
      { symbol: "SPX", label: "S&P 500 Index", desc: "Base ~5500" },
      { symbol: "SPY", label: "SPDR S&P 500 ETF", desc: "Base ~500" },
      { symbol: "QQQ", label: "Invesco QQQ Trust", desc: "Base ~400" },
      { symbol: "IWM", label: "iShares Russell 2000", desc: "Base ~200" },
      { symbol: "DIA", label: "SPDR Dow Jones Industrial Avg", desc: "Base ~400" },
      { symbol: "EEM", label: "iShares MSCI Emerging Markets", desc: "Base ~40" },
      { symbol: "SX5E", label: "Euro Stoxx 50 Index", desc: "Base ~5000" },
    ],
  },
  {
    title: "Keyboard Shortcuts",
    items: [
      { symbol: "⌘`", label: "Toggle cheatsheet", desc: "Open or close this dialog" },
      { symbol: "Esc", label: "Close", desc: "Dismiss the cheatsheet" },
    ],
  },
];

export function Cheatsheet({ onClose }: CheatsheetProps) {
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
            Live Tab — Symbol Cheatsheet
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
              <div className="space-y-1">
                {section.items.map((item) => (
                  <div
                    key={item.symbol}
                    className="flex items-start gap-3 py-1"
                  >
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
                      <span className="text-[10px] text-slate-600 ml-1.5">
                        — {item.desc}
                      </span>
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
