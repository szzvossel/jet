/**
 * LatencyChart — Bar chart for latency percentiles (p50, p95, p99).
 */

import React, { useRef, useEffect } from "react";
import type { LatencyStats } from "../../types";

interface Props {
  latency: LatencyStats;
}

const WIDTH = 400;
const HEIGHT = 240;
const PADDING = { top: 20, right: 20, bottom: 40, left: 60 };

const PERCENTILE_COLORS = ["#3b82f6", "#eab308", "#ef4444"];

export const LatencyChart: React.FC<Props> = ({ latency }) => {
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

    if (latency.sample_count === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
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
    labels.forEach((label, i) => {
      const val = values[i];
      const barH = (val / maxVal) * plotH;
      const x = PADDING.left + barStep * i + barStep / 2 - barWidth / 2;
      const y = PADDING.top + plotH - barH;

      const color =
        i === 0
          ? "#64748b"
          : i <= 3
            ? PERCENTILE_COLORS[i - 1]
            : "#ef4444";

      ctx.fillStyle = color + "88";
      ctx.fillRect(x, y, barWidth, barH);

      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, barWidth, barH);

      // Label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        label,
        PADDING.left + barStep * i + barStep / 2,
        HEIGHT - PADDING.bottom + 16,
      );

      // Value
      ctx.fillStyle = color;
      ctx.font = "10px monospace";
      ctx.fillText(
        `${val.toFixed(0)}ms`,
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
  }, [latency]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: WIDTH, height: HEIGHT }}
      className="rounded"
    />
  );
};
