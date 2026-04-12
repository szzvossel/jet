/**
 * DerivedDataTab — Vol + Dividends + Repo + Correlation sub-sections.
 *
 * Market data inputs that drive pricing: volatility, dividends, repo, correlation.
 */

import { useState, useEffect } from "react";
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
import type {
  VolSurface,
  CurveData,
  DividendCurve,
  CorrelationMatrix,
  CorrelationEntry,
} from "../../types";

type DerivedSection = "volatility" | "dividend" | "repo" | "correlation";

const SECTIONS: { id: DerivedSection; label: string }[] = [
  { id: "volatility", label: "Volatility Surface" },
  { id: "dividend", label: "Dividend" },
  { id: "repo", label: "Repo Curve" },
  { id: "correlation", label: "Correlation" },
];

export function DerivedDataTab() {
  const [activeSection, setActiveSection] = useState<DerivedSection>("volatility");
  const [volSurface, setVolSurface] = useState<VolSurface | null>(null);
  const [curves, setCurves] = useState<CurveData[]>([]);
  const [dividends, setDividends] = useState<DividendCurve | null>(null);
  const [correlationMatrix, setCorrelationMatrix] =
    useState<CorrelationMatrix | null>(null);
  const [correlationEntries, setCorrelationEntries] = useState<
    CorrelationEntry[]
  >([]);

  useEffect(() => {
    fetchVolSurface().then(setVolSurface).catch(console.error);
    fetchCurves().then(setCurves).catch(console.error);
    fetchDividendCurve().then(setDividends).catch(console.error);
    fetchCorrelationMatrix().then(setCorrelationMatrix).catch(console.error);
    fetchCorrelationEntries().then(setCorrelationEntries).catch(console.error);
  }, []);

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

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto flex gap-6">
        {/* Sidebar */}
        <nav className="w-48 shrink-0">
          <div className="bg-slate-800 rounded-lg p-2 space-y-1 sticky top-6">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeSection === s.id
                    ? "bg-slate-700 text-slate-100"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-700/50"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </nav>

        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-8">
          {/* Volatility Surface */}
          {activeSection === "volatility" && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">
                Volatility Surface
                <span className="ml-3 text-sm font-normal text-slate-400">
                  {volSurface?.underlying ?? "..."} | Spot:{" "}
                  {volSurface?.spot.toFixed(2) ?? "..."}
                </span>
              </h2>

              {volSurface && (
                <>
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-slate-400 mb-3">
                      Vol Smile / Skew
                    </h3>
                    <VolSmileChart smiles={volSurface.smiles} />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                            Strike
                          </th>
                          {volSurface.smiles.map((smile) => (
                            <th
                              key={smile.tenor}
                              className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase"
                            >
                              {smile.tenor < 1
                                ? `${(smile.tenor * 12).toFixed(0)}M`
                                : `${smile.tenor.toFixed(0)}Y`}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {volSurface.smiles[0]?.strikes.map((strike, i) => (
                          <tr
                            key={strike}
                            className="border-b border-slate-800 hover:bg-slate-700/30"
                          >
                            <td className="px-3 py-1 font-mono text-slate-300">
                              {strike.toFixed(0)}
                            </td>
                            {volSurface.smiles.map((smile) => (
                              <td
                                key={`${strike}-${smile.tenor}`}
                                className="px-3 py-1 text-right font-mono text-slate-200"
                              >
                                {(smile.vols[i] * 100).toFixed(1)}%
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

          {/* Dividend */}
          {activeSection === "dividend" && (
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">
                Dividends
                <span className="ml-3 text-sm font-normal text-slate-400">
                  {dividends?.underlying ?? "..."}
                </span>
              </h2>

              {dividends && (
                <>
                  <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-slate-900 rounded-lg p-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Current Yield
                      </span>
                      <div className="text-lg font-mono font-semibold text-green-400">
                        <NumberDisplay
                          value={dividends.current_yield}
                          format="percent"
                          decimals={3}
                        />
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Implied Yield
                      </span>
                      <div className="text-lg font-mono font-semibold text-blue-400">
                        <NumberDisplay
                          value={dividends.implied_yield}
                          format="percent"
                          decimals={3}
                        />
                      </div>
                    </div>
                    <div className="bg-slate-900 rounded-lg p-3">
                      <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                        Next Ex-Date
                      </span>
                      <div className="text-lg font-mono font-semibold text-amber-400">
                        {dividends.next_ex_date}
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                            Ex-Date
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-slate-400 uppercase">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                            Declared
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                            Record
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                            Pay
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {dividends.events.map((evt) => (
                          <tr
                            key={evt.ex_date}
                            className="border-b border-slate-800 hover:bg-slate-700/30"
                          >
                            <td className="px-4 py-2 font-mono text-slate-300">
                              {evt.ex_date}
                            </td>
                            <td className="px-4 py-2 text-right font-mono text-green-400">
                              ${evt.amount.toFixed(2)}
                            </td>
                            <td className="px-4 py-2 text-slate-400">
                              {evt.declared_date}
                            </td>
                            <td className="px-4 py-2 text-slate-400">
                              {evt.record_date}
                            </td>
                            <td className="px-4 py-2 text-slate-400">
                              {evt.pay_date}
                            </td>
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
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">
                Repo & Yield Curves
              </h2>

              {curves.length > 0 && (
                <>
                  <div className="mb-6">
                    <YieldCurveChart curves={curves} />
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-slate-700">
                          <th className="px-3 py-2 text-left text-xs font-medium text-slate-400 uppercase">
                            Tenor
                          </th>
                          {curves.map((curve) => (
                            <th
                              key={curve.curve_type}
                              className="px-3 py-2 text-right text-xs font-medium text-slate-400 uppercase"
                            >
                              {curve.curve_type}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {curves[0]?.points.map((pt, i) => (
                          <tr
                            key={pt.tenor}
                            className="border-b border-slate-800 hover:bg-slate-700/30"
                          >
                            <td className="px-3 py-1 font-mono text-slate-300">
                              {pt.tenor < 1
                                ? `${(pt.tenor * 12).toFixed(1)}M`
                                : `${pt.tenor.toFixed(1)}Y`}
                            </td>
                            {curves.map((curve) => (
                              <td
                                key={`${pt.tenor}-${curve.curve_type}`}
                                className="px-3 py-1 text-right font-mono text-slate-200"
                              >
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
            <div className="bg-slate-800 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-slate-100 mb-4">
                Correlation Matrix
                <span className="ml-3 text-sm font-normal text-slate-400">
                  6x6 ETF Grid
                </span>
              </h2>

              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">
                    Heatmap
                  </h3>
                  {correlationMatrix && (
                    <CorrelationMatrixGrid matrix={correlationMatrix} />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-medium text-slate-400 mb-3">
                    Pairwise Correlations
                  </h3>
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
