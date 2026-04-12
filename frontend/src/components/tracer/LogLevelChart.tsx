/**
 * LogLevelChart — Bar chart showing log level distribution.
 */

import React, { useRef, useEffect } from "react";
import type { LogLevelDistribution } from "../../types";

interface Props {
  distribution: LogLevelDistribution;
}

const WIDTH = 400;
const HEIGHT = 240;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

const LEVEL_COLORS: Record<string, string> = {
  trace: "#64748b",
  debug: "#3b82f6",
  info: "#22c55e",
  warn: "#eab308",
  error: "#ef4444",
};

export const LogLevelChart: React.FC<Props> = ({ distribution }) => {
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

    const levels = ["trace", "debug", "info", "warn", "error"] as const;
    const values = levels.map((l) => distribution[l]);
    const maxVal = Math.max(...values, 1) * 1.2;

    const barWidth = Math.min(50, plotW / levels.length - 16);
    const barStep = plotW / levels.length;

    // Grid
    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = PADDING.top + (plotH * i) / 4;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, y);
      ctx.lineTo(WIDTH - PADDING.right, y);
      ctx.stroke();
    }

    // Bars
    levels.forEach((level, i) => {
      const val = values[i];
      const barH = (val / maxVal) * plotH;
      const x = PADDING.left + barStep * i + barStep / 2 - barWidth / 2;
      const y = PADDING.top + plotH - barH;

      ctx.fillStyle = LEVEL_COLORS[level] + "88";
      ctx.fillRect(x, y, barWidth, barH);

      ctx.strokeStyle = LEVEL_COLORS[level];
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barH);

      // Label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        level.toUpperCase(),
        PADDING.left + barStep * i + barStep / 2,
        HEIGHT - PADDING.bottom + 16,
      );

      // Value
      ctx.fillStyle = LEVEL_COLORS[level];
      ctx.font = "10px monospace";
      ctx.fillText(
        val.toString(),
        PADDING.left + barStep * i + barStep / 2,
        y - 6,
      );
    });

    // Y-axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "10px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 4; i++) {
      const val = maxVal - (maxVal * i) / 4;
      const y = PADDING.top + (plotH * i) / 4;
      ctx.fillText(val.toFixed(0), PADDING.left - 8, y + 4);
    }
  }, [distribution]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: WIDTH, height: HEIGHT }}
      className="rounded"
    />
  );
};
