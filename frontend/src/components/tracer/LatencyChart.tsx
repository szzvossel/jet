/**
 * LatencyChart — Responsive bar chart for latency percentiles (Min, P50, P95, P99, Max).
 *
 * Gradient-filled bars with rounded tops, surface-matched background.
 */

import React, { useRef, useEffect, useState } from "react";
import type { LatencyStats } from "../../types";

interface Props {
  latency: LatencyStats;
}

const HEIGHT = 260;
const PADDING = { top: 24, right: 24, bottom: 44, left: 60 };

const BAR_COLORS = ["#64748b", "#3b82f6", "#eab308", "#ef4444", "#f97316"];

export const LatencyChart: React.FC<Props> = ({ latency }) => {
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

    const monoFont = "11px 'JetBrains Mono', monospace";
    const sansFont = "11px 'DM Sans', sans-serif";

    if (latency.sample_count === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = sansFont;
      ctx.textAlign = "center";
      ctx.fillText("No latency data", WIDTH / 2, HEIGHT / 2);
      return;
    }

    const labels = ["Min", "P50", "P95", "P99", "Max"];
    const values = [
      latency.min_ms ?? 0,
      latency.p50_ms ?? 0,
      latency.p95_ms ?? 0,
      latency.p99_ms ?? 0,
      latency.max_ms ?? 0,
    ];
    const maxVal = Math.max(...values, 1) * 1.2;

    const barWidth = Math.min(50, plotW / labels.length - 16);
    const barStep = plotW / labels.length;

    // Subtle grid
    ctx.strokeStyle = "#1a2538";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PADDING.top + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(WIDTH - PADDING.right, y);
      ctx.stroke();
    }

    // Bars with gradient fills
    labels.forEach((label, i) => {
      const val = values[i];
      const barH = (val / maxVal) * plotH;
      const x = PADDING.left + barStep * i + barStep / 2 - barWidth / 2;
      const y = PADDING.top + plotH - barH;
      const color = BAR_COLORS[i];

      // Gradient fill
      const grad = ctx.createLinearGradient(0, y, 0, y + barH);
      grad.addColorStop(0, color + "aa");
      grad.addColorStop(1, color + "30");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
      ctx.fill();

      // Border
      ctx.strokeStyle = color + "80";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(x, y, barWidth, barH, [3, 3, 0, 0]);
      ctx.stroke();

      // Value label
      ctx.fillStyle = color;
      ctx.font = monoFont;
      ctx.textAlign = "center";
      ctx.fillText(
        `${val.toFixed(0)}ms`,
        PADDING.left + barStep * i + barStep / 2,
        y - 6,
      );

      // Category label
      ctx.fillStyle = "#94a3b8";
      ctx.font = sansFont;
      ctx.fillText(
        label,
        PADDING.left + barStep * i + barStep / 2,
        HEIGHT - PADDING.bottom + 16,
      );
    });

    // Y-axis labels
    ctx.fillStyle = "#64748b";
    ctx.font = monoFont;
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = maxVal - (maxVal * i) / 4;
      const y = PADDING.top + (plotH * i) / 4;
      ctx.fillText(val.toFixed(0) + "ms", PADDING.left - 8, y + 4);
    }
  }, [latency, canvasWidth]);

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
