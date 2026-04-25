/**
 * YieldCurveChart — Responsive canvas yield curve chart.
 *
 * Uses ResizeObserver to auto-fit container width.
 * Design system fonts, surface-matched background.
 */

import React, { useRef, useEffect, useState } from "react";
import type { CurveData } from "../../types";

interface Props {
  curves: CurveData[];
}

const HEIGHT = 340;
const PADDING = { top: 24, right: 24, bottom: 44, left: 64 };

const COLORS: Record<string, string> = {
  "Zero (SOFR)": "#818cf8",
  "Forward (3M)": "#3b82f6",
  Repo: "#eab308",
};

export const YieldCurveChart: React.FC<Props> = ({ curves }) => {
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
    if (!canvas || curves.length === 0 || canvasWidth === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const WIDTH = canvasWidth;
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
    for (let i = 0; i <= 5; i++) {
      const x = PADDING.left + (plotW * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, HEIGHT - PADDING.bottom);
      ctx.stroke();
    }

    // Draw curves with gradient fill
    for (const curve of curves) {
      const color = COLORS[curve.curve_type] || "#94a3b8";

      // Gradient fill
      const gradient = ctx.createLinearGradient(0, PADDING.top, 0, HEIGHT - PADDING.bottom);
      gradient.addColorStop(0, color + "15");
      gradient.addColorStop(1, color + "00");

      ctx.beginPath();
      for (let i = 0; i < curve.points.length; i++) {
        const x = xScale(curve.points[i].tenor);
        const y = yScale(curve.points[i].rate);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(xScale(curve.points[curve.points.length - 1].tenor), yScale(minRate));
      ctx.lineTo(xScale(curve.points[0].tenor), yScale(minRate));
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < curve.points.length; i++) {
        const x = xScale(curve.points[i].tenor);
        const y = yScale(curve.points[i].rate);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();

      // Dots
      ctx.fillStyle = color;
      for (const pt of curve.points) {
        ctx.beginPath();
        ctx.arc(xScale(pt.tenor), yScale(pt.rate), 3, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Axis labels
    const monoFont = "11px 'JetBrains Mono', monospace";
    const sansFont = "11px 'DM Sans', sans-serif";

    ctx.fillStyle = "#64748b";
    ctx.font = monoFont;
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const val = (maxTenor * i) / 5;
      const x = PADDING.left + (plotW * i) / 5;
      ctx.fillText(val.toFixed(1) + "Y", x, HEIGHT - PADDING.bottom + 16);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(2) + "%", PADDING.left - 8, y + 4);
    }

    // Axis title
    ctx.fillStyle = "#475569";
    ctx.font = sansFont;
    ctx.textAlign = "center";
    ctx.fillText("Tenor (Years)", WIDTH / 2, HEIGHT - 4);

    // Legend pill
    const legendX = PADDING.left + 12;
    const legendY = PADDING.top + 10;
    const pillWidth = curves.length * 110 + 12;
    ctx.fillStyle = "rgba(12, 19, 34, 0.85)";
    ctx.beginPath();
    ctx.roundRect(legendX - 6, legendY - 6, pillWidth, 28, 6);
    ctx.fill();

    ctx.font = sansFont;
    ctx.textAlign = "left";
    let lx = legendX;
    for (const curve of curves) {
      const color = COLORS[curve.curve_type] || "#94a3b8";
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, legendY + 8);
      ctx.lineTo(lx + 12, legendY + 8);
      ctx.stroke();
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(curve.curve_type, lx + 16, legendY + 12);
      lx += 110;
    }
  }, [curves, canvasWidth]);

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        style={{ height: HEIGHT }}
        className="rounded w-full"
      />
    </div>
  );
};
