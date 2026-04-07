/**
 * PnLTab — P&L attribution breakdown by Greek risk factors.
 */

import { useState, useEffect, useRef } from "react";
import { PnLAttributionTable } from "./PnLAttributionTable";
import { NumberDisplay } from "../shared/NumberDisplay";
import { fetchPnlAttribution } from "../../hooks/usePricing";
import type { PnlExplain } from "../../types";

const WIDTH = 700;
const HEIGHT = 320;
const PADDING = { top: 30, right: 30, bottom: 50, left: 80 };

export function PnLTab() {
  const [pnlData, setPnlData] = useState<PnlExplain | null>(null);

  useEffect(() => {
    fetchPnlAttribution().then(setPnlData).catch(console.error);
  }, []);

  if (!pnlData) {
    return (
      <div className="p-6">
        <div className="max-w-7xl mx-auto">
          <p className="text-slate-500 italic">Loading P&L data...</p>
        </div>
      </div>
    );
  }

  const summaryCards = [
    {
      label: "Total P&L",
      value: pnlData.total_pnl,
      color:
        pnlData.total_pnl >= 0 ? "text-green-400" : "text-red-400",
    },
    {
      label: "Delta P&L",
      value: pnlData.total_delta_pnl,
      color: "text-blue-400",
    },
    {
      label: "Gamma+Vega P&L",
      value: pnlData.total_gamma_pnl + pnlData.total_vega_pnl,
      color: "text-purple-400",
    },
    {
      label: "Theta+Residual",
      value: pnlData.total_theta_pnl + pnlData.total_residual,
      color: "text-orange-400",
    },
  ];

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {summaryCards.map((card) => (
            <div key={card.label} className="bg-slate-800 rounded-lg p-4">
              <span className="text-xs font-medium text-slate-500 uppercase tracking-wide">
                {card.label}
              </span>
              <div
                className={`text-xl font-mono font-semibold ${card.color}`}
              >
                <NumberDisplay
                  value={card.value}
                  format="currency"
                  decimals={0}
                  colorize
                />
              </div>
            </div>
          ))}
        </div>

        {/* P&L Attribution Table */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            P&L Attribution
          </h2>
          <PnLAttributionTable positions={pnlData.positions} />
        </div>

        {/* Waterfall chart */}
        <div className="bg-slate-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-slate-100 mb-4">
            P&L Decomposition
          </h2>
          <WaterfallChart pnlData={pnlData} />
        </div>
      </div>
    </div>
  );
}

/**
 * Waterfall chart showing P&L decomposition as stacked bars.
 */
function WaterfallChart({ pnlData }: { pnlData: PnlExplain }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;

    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const factors = [
      { label: "Delta", value: pnlData.total_delta_pnl, color: "#3b82f6" },
      { label: "Gamma", value: pnlData.total_gamma_pnl, color: "#a855f7" },
      { label: "Vega", value: pnlData.total_vega_pnl, color: "#eab308" },
      { label: "Theta", value: pnlData.total_theta_pnl, color: "#f97316" },
      { label: "Rho", value: pnlData.total_rho_pnl, color: "#06b6d4" },
      { label: "Residual", value: pnlData.total_residual, color: "#64748b" },
    ];

    // Add total bar
    factors.push({
      label: "Total",
      value: pnlData.total_pnl,
      color: pnlData.total_pnl >= 0 ? "#22c55e" : "#ef4444",
    });

    const maxVal = Math.max(...factors.map((f) => Math.abs(f.value))) * 1.3;
    const yMin = -maxVal;
    const yMax = maxVal;

    const barStep = plotW / factors.length;
    const barWidth = Math.min(60, barStep - 20);

    const yScale = (v: number) =>
      PADDING.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
    const zeroY = yScale(0);

    // Grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = PADDING.top + (plotH * i) / 5;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(WIDTH - PADDING.right, y);
      ctx.stroke();
    }

    // Zero line
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, zeroY);
    ctx.lineTo(WIDTH - PADDING.right, zeroY);
    ctx.stroke();

    // Bars
    factors.forEach((factor, i) => {
      const x = PADDING.left + barStep * i + barStep / 2 - barWidth / 2;
      const barH = Math.abs(yScale(factor.value) - zeroY);
      const barY =
        factor.value >= 0 ? zeroY - barH : zeroY;

      ctx.fillStyle = factor.color + "88";
      ctx.fillRect(x, barY, barWidth, barH);

      ctx.strokeStyle = factor.color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, barY, barWidth, barH);

      // Value label
      ctx.fillStyle = factor.color;
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      const labelY =
        factor.value >= 0 ? barY - 6 : barY + barH + 14;
      ctx.fillText(
        `$${factor.value.toFixed(0)}`,
        PADDING.left + barStep * i + barStep / 2,
        labelY,
      );

      // Category label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px sans-serif";
      ctx.fillText(
        factor.label,
        PADDING.left + barStep * i + barStep / 2,
        HEIGHT - PADDING.bottom + 18,
      );
    });

    // Y-axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(`$${val.toFixed(0)}`, PADDING.left - 8, y + 4);
    }
  }, [pnlData]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: WIDTH, height: HEIGHT }}
      className="rounded"
    />
  );
}
