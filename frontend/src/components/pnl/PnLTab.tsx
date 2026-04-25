/**
 * PnLTab — P&L attribution breakdown by Greek risk factors.
 *
 * Summary cards, attribution table, and waterfall decomposition chart.
 */

import { useState, useEffect, useRef } from "react";
import { PnLAttributionTable } from "./PnLAttributionTable";
import { NumberDisplay } from "../shared/NumberDisplay";
import { fetchPnlAttribution } from "../../hooks/usePricing";
import type { PnlExplain } from "../../types";

const WATERFALL_HEIGHT = 320;
const WATERFALL_PADDING = { top: 24, right: 24, bottom: 44, left: 72 };

export function PnLTab() {
  const [pnlData, setPnlData] = useState<PnlExplain | null>(null);

  useEffect(() => {
    fetchPnlAttribution().then(setPnlData).catch(console.error);
  }, []);

  if (!pnlData) {
    return (
      <div className="p-5">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="surface-card-static p-3.5 animate-pulse">
                <div className="h-2.5 bg-slate-700/50 rounded w-20 mb-3" />
                <div className="h-5 bg-slate-700/40 rounded w-24" />
              </div>
            ))}
          </div>
          <div className="mt-5 surface-card-static p-4">
            <div className="h-4 bg-slate-700/40 rounded w-32 mb-4" />
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-8 bg-slate-700/30 rounded" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  const cards = [
    {
      label: "Total P&L",
      value: pnlData.total_pnl,
      color: pnlData.total_pnl >= 0 ? "#22c55e" : "#ef4444",
    },
    {
      label: "Delta P&L",
      value: pnlData.total_delta_pnl,
      color: "#3b82f6",
    },
    {
      label: "Gamma+Vega P&L",
      value: pnlData.total_gamma_pnl + pnlData.total_vega_pnl,
      color: "#a855f7",
    },
    {
      label: "Theta+Residual",
      value: pnlData.total_theta_pnl + pnlData.total_residual,
      color: "#f97316",
    },
  ];

  return (
    <div className="p-5">
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 stagger-grid">
          {cards.map((card) => (
            <div key={card.label} className="surface-card-static p-3.5 animate-fade-up">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: card.color }}
                />
                <span className="data-label">{card.label}</span>
              </div>
              <div
                className="text-lg font-semibold"
                style={{ color: card.color, fontFamily: "var(--font-mono)" }}
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
        <div className="surface-card-static p-4 animate-fade-up">
          <span className="data-label">P&L Attribution</span>
          <div className="mt-3">
            <PnLAttributionTable positions={pnlData.positions} />
          </div>
        </div>

        {/* Waterfall chart */}
        <div className="surface-card-static p-4 animate-fade-up">
          <span className="data-label">P&L Decomposition</span>
          <div className="mt-3">
            <WaterfallChart pnlData={pnlData} />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Waterfall chart — responsive canvas P&L decomposition.
 */
function WaterfallChart({ pnlData }: { pnlData: PnlExplain }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const update = () => {
      const w = container.clientWidth;
      if (w > 0) setCanvasWidth(w);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || canvasWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const WIDTH = canvasWidth;
    const HEIGHT = WATERFALL_HEIGHT;
    const PADDING = WATERFALL_PADDING;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    ctx.scale(dpr, dpr);

    const plotW = WIDTH - PADDING.left - PADDING.right;
    const plotH = HEIGHT - PADDING.top - PADDING.bottom;

    ctx.fillStyle = "#0c1322";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const factors = [
      { label: "Delta", value: pnlData.total_delta_pnl, color: "#3b82f6" },
      { label: "Gamma", value: pnlData.total_gamma_pnl, color: "#a855f7" },
      { label: "Vega", value: pnlData.total_vega_pnl, color: "#eab308" },
      { label: "Theta", value: pnlData.total_theta_pnl, color: "#f97316" },
      { label: "Rho", value: pnlData.total_rho_pnl, color: "#06b6d4" },
      { label: "Residual", value: pnlData.total_residual, color: "#64748b" },
      {
        label: "Total",
        value: pnlData.total_pnl,
        color: pnlData.total_pnl >= 0 ? "#22c55e" : "#ef4444",
        isTotal: true,
      },
    ];

    const maxVal = Math.max(...factors.map((f) => Math.abs(f.value))) * 1.3;
    const yMin = -maxVal;
    const yMax = maxVal;

    const barStep = plotW / factors.length;
    const barWidth = Math.min(60, barStep - 20);

    const yScale = (v: number) =>
      PADDING.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;
    const zeroY = yScale(0);

    // Subtle grid
    ctx.strokeStyle = "#1a2538";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = PADDING.top + (plotH * i) / 5;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(WIDTH - PADDING.right, y);
      ctx.stroke();
    }

    // Zero line
    ctx.strokeStyle = "#2a3a50";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(PADDING.left, zeroY);
    ctx.lineTo(WIDTH - PADDING.right, zeroY);
    ctx.stroke();

    const monoFont = "11px 'JetBrains Mono', monospace";
    const sansFont = "11px 'DM Sans', sans-serif";

    // Bars
    factors.forEach((factor, i) => {
      const x = PADDING.left + barStep * i + barStep / 2 - barWidth / 2;
      const barH = Math.abs(yScale(factor.value) - zeroY);
      const barY = factor.value >= 0 ? zeroY - barH : zeroY;

      if (factor.isTotal) {
        // Total bar — solid fill with border
        ctx.fillStyle = factor.color;
        ctx.beginPath();
        ctx.roundRect(x, barY, barWidth, barH, [3, 3, 0, 0]);
        ctx.fill();
      } else {
        // Factor bar — gradient fill
        const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
        if (factor.value >= 0) {
          grad.addColorStop(0, factor.color + "aa");
          grad.addColorStop(1, factor.color + "30");
        } else {
          grad.addColorStop(0, factor.color + "30");
          grad.addColorStop(1, factor.color + "aa");
        }
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.roundRect(x, barY, barWidth, barH, [3, 3, 0, 0]);
        ctx.fill();

        // Border
        ctx.strokeStyle = factor.color + "80";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x, barY, barWidth, barH, [3, 3, 0, 0]);
        ctx.stroke();
      }

      // Value label
      ctx.fillStyle = factor.isTotal ? "#fff" : factor.color;
      ctx.font = factor.isTotal ? `bold ${monoFont}` : monoFont;
      ctx.textAlign = "center";
      const labelY = factor.value >= 0 ? barY - 6 : barY + barH + 14;
      ctx.fillText(
        `$${factor.value.toFixed(0)}`,
        PADDING.left + barStep * i + barStep / 2,
        labelY,
      );

      // Category label
      ctx.fillStyle = factor.isTotal ? "#cbd5e1" : "#94a3b8";
      ctx.font = factor.isTotal ? `600 ${sansFont}` : sansFont;
      ctx.fillText(
        factor.label,
        PADDING.left + barStep * i + barStep / 2,
        HEIGHT - PADDING.bottom + 16,
      );
    });

    // Y-axis labels
    ctx.fillStyle = "#64748b";
    ctx.font = monoFont;
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(`$${val.toFixed(0)}`, PADDING.left - 8, y + 4);
    }

    // Separator line before Total bar
    const sepX = PADDING.left + barStep * (factors.length - 1) - 6;
    ctx.strokeStyle = "#33415580";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(sepX, PADDING.top);
    ctx.lineTo(sepX, HEIGHT - PADDING.bottom);
    ctx.stroke();
    ctx.setLineDash([]);
  }, [pnlData, canvasWidth]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        style={{ height: WATERFALL_HEIGHT }}
        className="rounded w-full"
      />
    </div>
  );
}
