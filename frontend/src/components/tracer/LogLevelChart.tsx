/**
 * LogLevelChart — Responsive bar chart showing log level distribution.
 *
 * Gradient-filled bars with rounded tops, surface-matched background.
 */

import React, { useRef, useEffect, useState } from "react";
import type { LogLevelDistribution } from "../../types";

interface Props {
  distribution: LogLevelDistribution;
}

const HEIGHT = 260;
const PADDING = { top: 24, right: 24, bottom: 44, left: 50 };

const LEVEL_COLORS: Record<string, string> = {
  trace: "#64748b",
  debug: "#3b82f6",
  info: "#22c55e",
  warn: "#eab308",
  error: "#ef4444",
};

export const LogLevelChart: React.FC<Props> = ({ distribution }) => {
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

    const levels = ["trace", "debug", "info", "warn", "error"] as const;
    const values = levels.map((l) => distribution[l]);
    const maxVal = Math.max(...values, 1) * 1.2;

    const barWidth = Math.min(50, plotW / levels.length - 16);
    const barStep = plotW / levels.length;

    const monoFont = "11px 'JetBrains Mono', monospace";
    const sansFont = "11px 'DM Sans', sans-serif";

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
    levels.forEach((level, i) => {
      const val = values[i];
      const barH = (val / maxVal) * plotH;
      const x = PADDING.left + barStep * i + barStep / 2 - barWidth / 2;
      const y = PADDING.top + plotH - barH;

      const color = LEVEL_COLORS[level];

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
        val.toString(),
        PADDING.left + barStep * i + barStep / 2,
        y - 6,
      );

      // Category label
      ctx.fillStyle = "#94a3b8";
      ctx.font = sansFont;
      ctx.fillText(
        level.toUpperCase(),
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
      ctx.fillText(val.toFixed(0), PADDING.left - 8, y + 4);
    }
  }, [distribution, canvasWidth]);

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
