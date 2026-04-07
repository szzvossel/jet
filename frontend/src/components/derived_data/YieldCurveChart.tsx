/**
 * Yield curve canvas chart with overlaid curves.
 */

import React, { useRef, useEffect } from "react";
import type { CurveData } from "../../types";

interface Props {
  curves: CurveData[];
}

const WIDTH = 700;
const HEIGHT = 340;
const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };

const COLORS: Record<string, string> = {
  "Zero (SOFR)": "#818cf8",
  "Forward (3M)": "#3b82f6",
  Repo: "#eab308",
};

export const YieldCurveChart: React.FC<Props> = ({ curves }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || curves.length === 0) return;

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

    let maxTenor = 0;
    let minRate = Infinity;
    let maxRate = -Infinity;
    for (const curve of curves) {
      for (const pt of curve.points) {
        if (pt.tenor > maxTenor) maxTenor = pt.tenor;
        if (pt.rate < minRate) minRate = pt.rate;
        if (pt.rate > maxRate) maxRate = pt.rate;
      }
    }

    const ratePad = (maxRate - minRate) * 0.15;
    const yMin = (minRate - ratePad) * 100;
    const yMax = (maxRate + ratePad) * 100;

    const xScale = (v: number) =>
      PADDING.left + (v / maxTenor) * plotW;
    const yScale = (v: number) =>
      PADDING.top + plotH - ((v * 100 - yMin) / (yMax - yMin)) * plotH;

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

    // Draw curves
    for (const curve of curves) {
      const color = COLORS[curve.curve_type] || "#94a3b8";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < curve.points.length; i++) {
        const x = xScale(curve.points[i].tenor);
        const y = yScale(curve.points[i].rate);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Draw dots
      ctx.fillStyle = color;
      for (const pt of curve.points) {
        ctx.beginPath();
        ctx.arc(xScale(pt.tenor), yScale(pt.rate), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const val = (maxTenor * i) / 5;
      const x = PADDING.left + (plotW * i) / 5;
      ctx.fillText(val.toFixed(1) + "Y", x, HEIGHT - PADDING.bottom + 18);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(2) + "%", PADDING.left - 8, y + 4);
    }

    // Axis titles
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Tenor (Years)", WIDTH / 2, HEIGHT - 4);

    // Legend
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    let lx = WIDTH - PADDING.right - 180;
    const ly = PADDING.top + 12;
    for (const curve of curves) {
      const color = COLORS[curve.curve_type] || "#94a3b8";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly + 6);
      ctx.lineTo(lx + 16, ly + 6);
      ctx.stroke();
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(curve.curve_type, lx + 20, ly + 10);
      lx -= 90;
    }
  }, [curves]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: WIDTH, height: HEIGHT }}
      className="rounded"
    />
  );
};
