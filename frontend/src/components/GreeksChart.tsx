/**
 * Greeks profile chart using HTML Canvas.
 *
 * Renders delta, gamma, vega, and theta across a range of spot prices.
 */

import React, { useRef, useEffect } from "react";
import type { GreeksCurveResult } from "../types";

interface Props {
  data: GreeksCurveResult | null;
}

const WIDTH = 600;
const HEIGHT = 360;
const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };

interface Series {
  values: number[];
  color: string;
  label: string;
}

export const GreeksChart: React.FC<Props> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.spots.length === 0) return;

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

    // Clear
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const series: Series[] = [
      { values: data.deltas, color: "#3b82f6", label: "Delta" },
      { values: data.gammas, color: "#a855f7", label: "Gamma" },
      { values: data.vegas, color: "#eab308", label: "Vega" },
      { values: data.thetas, color: "#f97316", label: "Theta" },
    ];

    const spots = data.spots;
    const minSpot = spots[0];
    const maxSpot = spots[spots.length - 1];

    // Compute global y bounds
    let allMin = Infinity;
    let allMax = -Infinity;
    for (const s of series) {
      for (const v of s.values) {
        if (v < allMin) allMin = v;
        if (v > allMax) allMax = v;
      }
    }
    const yPad = (allMax - allMin) * 0.1;
    const yMin = allMin - yPad;
    const yMax = allMax + yPad;

    const xScale = (v: number) =>
      PADDING.left + ((v - minSpot) / (maxSpot - minSpot)) * plotW;
    const yScale = (v: number) =>
      PADDING.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

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
    for (let i = 0; i <= 5; i++) {
      const x = PADDING.left + (plotW * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, HEIGHT - PADDING.bottom);
      ctx.stroke();
    }

    // Zero line
    if (yMin < 0 && yMax > 0) {
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, yScale(0));
      ctx.lineTo(WIDTH - PADDING.right, yScale(0));
      ctx.stroke();
    }

    // Draw each series
    for (const s of series) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < spots.length; i++) {
        const x = xScale(spots[i]);
        const y = yScale(s.values[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const val = minSpot + ((maxSpot - minSpot) * i) / 5;
      const x = PADDING.left + (plotW * i) / 5;
      ctx.fillText(val.toFixed(0), x, HEIGHT - PADDING.bottom + 18);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(3), PADDING.left - 8, y + 4);
    }

    // Axis titles
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Spot Price", WIDTH / 2, HEIGHT - 4);

    // Legend
    let legendX = PADDING.left + 12;
    const legendY = PADDING.top + 12;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";

    for (const s of series) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY + 6);
      ctx.lineTo(legendX + 16, legendY + 6);
      ctx.stroke();
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(s.label, legendX + 20, legendY + 10);
      legendX += 80;
    }
  }, [data]);

  if (!data) {
    return (
      <div className="bg-slate-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-slate-100 mb-4">
          Greeks Profile
        </h2>
        <p className="text-slate-500 italic">
          Calculate a price to see Greeks across spot prices.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-4">
        Greeks Profile
      </h2>
      <canvas
        ref={canvasRef}
        style={{ width: WIDTH, height: HEIGHT }}
        className="rounded"
      />
    </div>
  );
};
