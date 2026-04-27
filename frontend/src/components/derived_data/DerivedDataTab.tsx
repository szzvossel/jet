/**
 * DerivedDataTab — Market data explorer: Vol Surface, Dividends, Repo Curves, Correlation.
 *
 * Sidebar navigation with brand-colored active indicator.
 * All sections use surface-card-static, data-label, and tighter spacing.
 * State persists across tab switches via useDerivedStore.
 */

import { useEffect } from "react";
import { VolSmileChart } from "./VolSmileChart";
import { YieldCurveChart } from "./YieldCurveChart";
import { CorrelationMatrixGrid } from "./CorrelationMatrix";
import { SortableTable, Column } from "../shared/SortableTable";
import { NumberDisplay } from "../shared/NumberDisplay";
import {
  fetchVolSurface,
  fetchCurves,
  fetchDividendCurve,
  fetchCorrelationMatrix,
  fetchCorrelationEntries,
} from "../../hooks/usePricing";
import { useDerivedStore } from "../../stores/useDerivedStore";
import type { VolSmileParams, CorrelationEntry } from "../../types";

const SECTIONS: { id: "volatility" | "dividend" | "repo" | "correlation"; label: string; icon: string }[] = [
  { id: "volatility", label: "Volatility", icon: "σ" },
  { id: "dividend", label: "Dividend", icon: "Δ" },
  { id: "repo", label: "Repo Curve", icon: "⌒" },
  { id: "correlation", label: "Correlation", icon: "ρ" },
];

function evaluateVolSmile(
  params: VolSmileParams,
  strikes: number[],
  spot: number,
): number[] {
  return strikes.map((k) => {
    const m = Math.log(k / spot);
    return (
      params.atm_vol +
      params.skew * m +
      params.c1 * m * m +
      params.c2 * m * m * m +
      params.c3 * m * m * m * m +
      params.c4 * m * m * m * m * m +
      params.c5 * m * m * m * m * m * m
    );
  });
}

/** Vol heatmap color: low vol=cool blue, high vol=warm amber */
function volCellColor(vol: number, minVol: number, maxVol: number): string {
  const range = maxVol - minVol || 1;
  const t = (vol - minVol) / range;
  const r = Math.round(20 + t * 40);
  const g = Math.round(30 + t * 20);
  const b = Math.round(60 + (1 - t) * 80);
  return `rgb(${r}, ${g}, ${b})`;
}

export function DerivedDataTab() {
  const activeSection = useDerivedStore((s) => s.activeSection);
  const volSurface = useDerivedStore((s) => s.volSurface);
  const curves = useDerivedStore((s) => s.curves);
  const dividends = useDerivedStore((s) => s.dividends);
  const correlationMatrix = useDerivedStore((s) => s.correlationMatrix);
  const correlationEntries = useDerivedStore((s) => s.correlationEntries);

  const setActiveSection = useDerivedStore((s) => s.setActiveSection);
  const setVolSurface = useDerivedStore((s) => s.setVolSurface);
  const setCurves = useDerivedStore((s) => s.setCurves);
  const setDividends = useDerivedStore((s) => s.setDividends);
  const setCorrelationMatrix = useDerivedStore((s) => s.setCorrelationMatrix);
  const setCorrelationEntries = useDerivedStore((s) => s.setCorrelationEntries);

  useEffect(() => {
    // Only fetch if data hasn't been loaded yet
    if (!volSurface) fetchVolSurface().then(setVolSurface).catch(console.error);
    if (curves.length === 0) fetchCurves().then(setCurves).catch(console.error);
    if (!dividends) fetchDividendCurve().then(setDividends).catch(console.error);
    if (!correlationMatrix) fetchCorrelationMatrix().then(setCorrelationMatrix).catch(console.error);
    if (correlationEntries.length === 0) fetchCorrelationEntries().then(setCorrelationEntries).catch(console.error);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleParamChange = (
    smileIndex: number,
    paramKey: keyof VolSmileParams,
    value: number,
  ) => {
    if (!volSurface) return;
    const updated = { ...volSurface };
    const smile = { ...updated.smiles[smileIndex] };
    smile.params = { ...smile.params, [paramKey]: value };
    smile.vols = evaluateVolSmile(smile.params, smile.strikes, volSurface.spot);
    updated.smiles = [...updated.smiles];
    updated.smiles[smileIndex] = smile;
    setVolSurface(updated);
  };

  const divColumns: Column<CorrelationEntry>[] = [
    { key: "asset1", header: "Asset 1", align: "left" },
    { key: "asset2", header: "Asset 2", align: "left" },
    {
      key: "correlation",
      header: "Correlation",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="number" decimals={3} />
      ),
    },
  ];

  // Compute vol range for heatmap
  const volRange = (() => {
    if (!volSurface) return { min: 0, max: 1 };
    let min = Infinity, max = -Infinity;
    for (const s of volSurface.smiles) {
      for (const v of s.vols) {
        if (v < min) min = v;
        if (v > max) max = v;
      }
    }
    return { min, max };
  })();

  const inputCls = "w-20 input-refined px-2 py-0.5 text-right text-xs";

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto flex gap-5">
        {/* Sidebar */}
        <nav className="w-40 shrink-0">
          <div className="surface-card-static p-2 space-y-0.5 sticky top-6">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-[13px] font-medium transition-all duration-150 flex items-center gap-2 ${
                  activeSection === s.id
                    ? "text-brand-300"
                    : "text-slate-500 hover:text-slate-300"
                }`}
                style={{
                  background: activeSection === s.id ? "rgba(99, 102, 241, 0.08)" : "transparent",
                }}
              >
                <span className={`text-[11px] ${activeSection === s.id ? "text-brand-400" : "text-slate-600"}`}>
                  {s.icon}
                </span>
                {s.label}
                {activeSection === s.id && (
                  <span
                    className="ml-auto w-1 h-4 rounded-full"
                    style={{ background: "var(--brand-500)" }}
                  />
                )}
              </button>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-5">
          {/* Volatility Surface */}
          {activeSection === "volatility" && (
            <div className="surface-card-static p-4 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <span className="data-label">Volatility Surface</span>
                {volSurface && (
                  <span className="text-[11px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
                    {volSurface.underlying} | S={volSurface.spot.toFixed(2)}
                  </span>
                )}
              </div>

              {volSurface && (
                <>
                  {volSurface.smiles.some((s) => s.params) && (
                    <div className="mb-5">
                      <div className="data-label mb-2">Smile Parameters</div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-slate-700/50">
                              <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase">Tenor</th>
                              <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">ATM Vol</th>
                              <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">Skew</th>
                              <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">c1</th>
                              <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">c2</th>
                              <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">c3</th>
                              <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">c4</th>
                              <th className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">c5</th>
                            </tr>
                          </thead>
                          <tbody>
                            {volSurface.smiles.map((smile, smileIdx) => (
                              <tr key={smile.tenor} className="border-b border-slate-800/50 hover:bg-slate-700/20 transition-colors">
                                <td className="px-2 py-1 font-mono text-xs text-slate-300">
                                  {smile.tenor < 1 ? `${(smile.tenor * 12).toFixed(0)}M` : `${smile.tenor.toFixed(0)}Y`}
                                </td>
                                <td className="px-2 py-1">
                                  <input type="number" step={0.1} className={inputCls}
                                    value={+(smile.params.atm_vol * 100).toFixed(1)}
                                    onChange={(e) => handleParamChange(smileIdx, "atm_vol", (parseFloat(e.target.value) || 0) / 100)}
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input type="number" step={0.01} className={inputCls}
                                    value={smile.params.skew}
                                    onChange={(e) => handleParamChange(smileIdx, "skew", parseFloat(e.target.value) || 0)}
                                  />
                                </td>
                                <td className="px-2 py-1"><input type="number" step={0.01} className={inputCls} value={smile.params.c1} onChange={(e) => handleParamChange(smileIdx, "c1", parseFloat(e.target.value) || 0)} /></td>
                                <td className="px-2 py-1"><input type="number" step={0.01} className={inputCls} value={smile.params.c2} onChange={(e) => handleParamChange(smileIdx, "c2", parseFloat(e.target.value) || 0)} /></td>
                                <td className="px-2 py-1"><input type="number" step={0.01} className={inputCls} value={smile.params.c3} onChange={(e) => handleParamChange(smileIdx, "c3", parseFloat(e.target.value) || 0)} /></td>
                                <td className="px-2 py-1"><input type="number" step={0.001} className={inputCls} value={smile.params.c4} onChange={(e) => handleParamChange(smileIdx, "c4", parseFloat(e.target.value) || 0)} /></td>
                                <td className="px-2 py-1"><input type="number" step={0.001} className={inputCls} value={smile.params.c5} onChange={(e) => handleParamChange(smileIdx, "c5", parseFloat(e.target.value) || 0)} /></td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  <div className="mb-5">
                    <div className="data-label mb-2">Vol Smile / Skew</div>
                    <VolSmileChart smiles={volSurface.smiles} />
                  </div>

                  {/* Vol grid with heatmap coloring */}
                  <div className="data-label mb-2">Vol Grid</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="px-2 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase">Strike</th>
                          {volSurface.smiles.map((smile) => (
                            <th key={smile.tenor} className="px-2 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">
                              {smile.tenor < 1 ? `${(smile.tenor * 12).toFixed(0)}M` : `${smile.tenor.toFixed(0)}Y`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {volSurface.smiles[0]?.strikes.map((strike, i) => (
                          <tr key={strike} className="border-b border-slate-800/30">
                            <td className="px-2 py-1 font-mono text-xs text-slate-400">{strike.toFixed(0)}</td>
                            {volSurface.smiles.map((smile) => {
                              const vol = smile.vols[i];
                              return (
                                <td
                                  key={`${strike}-${smile.tenor}`}
                                  className="px-2 py-1 text-right font-mono text-xs rounded-sm"
                                  style={{
                                    backgroundColor: volCellColor(vol, volRange.min, volRange.max),
                                    color: "#cbd5e1",
                                  }}
                                >
                                  {(vol * 100).toFixed(1)}%
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Dividend */}
          {activeSection === "dividend" && (
            <div className="surface-card-static p-4 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <span className="data-label">Dividends</span>
                {dividends && (
                  <span className="text-[11px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>
                    {dividends.underlying}
                  </span>
                )}
              </div>

              {dividends && (
                <>
                  <div className="grid grid-cols-3 gap-3 mb-5 stagger-grid">
                    <div className="surface-card-static p-3 animate-fade-up">
                      <div className="data-label">Current Yield</div>
                      <div className="data-value text-green-400">
                        <NumberDisplay value={dividends.current_yield} format="percent" decimals={3} />
                      </div>
                    </div>
                    <div className="surface-card-static p-3 animate-fade-up">
                      <div className="data-label">Implied Yield</div>
                      <div className="data-value text-blue-400">
                        <NumberDisplay value={dividends.implied_yield} format="percent" decimals={3} />
                      </div>
                    </div>
                    <div className="surface-card-static p-3 animate-fade-up">
                      <div className="data-label">Next Ex-Date</div>
                      <div className="data-value text-amber-400">
                        {dividends.next_ex_date}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="px-3 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase">Ex-Date</th>
                          <th className="px-3 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">Amount</th>
                          <th className="px-3 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase">Declared</th>
                          <th className="px-3 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase">Record</th>
                          <th className="px-3 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase">Pay</th>
                        </tr>
                      </thead>
                      <tbody>
                        {dividends.events.map((evt) => (
                          <tr key={evt.ex_date} className="border-b border-slate-800/30 hover:bg-slate-700/20 transition-colors">
                            <td className="px-3 py-1.5 font-mono text-xs text-slate-300">{evt.ex_date}</td>
                            <td className="px-3 py-1.5 text-right font-mono text-xs text-green-400">${evt.amount.toFixed(2)}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{evt.declared_date}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{evt.record_date}</td>
                            <td className="px-3 py-1.5 text-xs text-slate-500">{evt.pay_date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Repo & Yield Curves */}
          {activeSection === "repo" && (
            <div className="surface-card-static p-4 animate-fade-up">
              <span className="data-label">Repo & Yield Curves</span>

              {curves.length > 0 && (
                <>
                  <div className="mt-3 mb-5">
                    <YieldCurveChart curves={curves} />
                  </div>

                  <div className="data-label mb-2">Rate Table</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700/50">
                          <th className="px-3 py-1.5 text-left text-[10px] font-medium text-slate-500 uppercase">Tenor</th>
                          {curves.map((curve) => (
                            <th key={curve.curve_type} className="px-3 py-1.5 text-right text-[10px] font-medium text-slate-500 uppercase">
                              {curve.curve_type}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {curves[0]?.points.map((pt, i) => (
                          <tr key={pt.tenor} className="border-b border-slate-800/30 hover:bg-slate-700/20 transition-colors">
                            <td className="px-3 py-1 font-mono text-xs text-slate-300">
                              {pt.tenor < 1 ? `${(pt.tenor * 12).toFixed(1)}M` : `${pt.tenor.toFixed(1)}Y`}
                            </td>
                            {curves.map((curve) => (
                              <td key={`${pt.tenor}-${curve.curve_type}`} className="px-3 py-1 text-right font-mono text-xs text-slate-200">
                                {(curve.points[i]?.rate * 100).toFixed(3)}%
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Correlation */}
          {activeSection === "correlation" && (
            <div className="surface-card-static p-4 animate-fade-up">
              <div className="flex items-center justify-between mb-4">
                <span className="data-label">Correlation Matrix</span>
                <span className="text-[11px] text-slate-500" style={{ fontFamily: "var(--font-mono)" }}>6×6 ETF Grid</span>
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                <div>
                  <div className="data-label mb-2">Heatmap</div>
                  {correlationMatrix && <CorrelationMatrixGrid matrix={correlationMatrix} />}
                </div>

                <div>
                  <div className="data-label mb-2">Pairwise Correlations</div>
                  <SortableTable
                    columns={divColumns}
                    data={correlationEntries}
                    rowKey={(row) => `${row.asset1}-${row.asset2}`}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
