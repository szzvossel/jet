/**
 * Delta exposure bar chart using HTML Canvas.
 */

import React, { useRef, useEffect } from "react";
import type { PositionRisk } from "../../types";

interface Props {
  positions: PositionRisk[];
}

const WIDTH = 700;
const HEIGHT = 280;
const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };

export const DeltaExposureChart: React.FC<Props> = ({ positions }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || positions.length === 0) return;

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

    // Aggregate delta by underlying
    const deltaByUnderlying = new Map<string, number>();
    for (const pos of positions) {
      const prev = deltaByUnderlying.get(pos.underlying) ?? 0;
      deltaByUnderlying.set(pos.underlying, prev + pos.delta);
    }

    const labels = Array.from(deltaByUnderlying.keys());
    const values = Array.from(deltaByUnderlying.values());

    const maxVal = Math.max(...values.map(Math.abs)) * 1.2;
    const yMin = -maxVal;
    const yMax = maxVal;

    const barWidth = Math.min(60, plotW / labels.length - 20);
    const barStep = plotW / labels.length;

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
    labels.forEach((label, i) => {
      const val = values[i];
      const x = PADDING.left + barStep * i + barStep / 2 - barWidth / 2;
      const barH = Math.abs(yScale(val) - zeroY);

      ctx.fillStyle = val >= 0 ? "#3b82f688" : "#ef444488";
      ctx.fillRect(x, val >= 0 ? zeroY - barH : zeroY, barWidth, barH);

      // Border
      ctx.strokeStyle = val >= 0 ? "#3b82f6" : "#ef4444";
      ctx.lineWidth = 1;
      ctx.strokeRect(x, val >= 0 ? zeroY - barH : zeroY, barWidth, barH);

      // Label
      ctx.fillStyle = "#94a3b8";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(
        label,
        PADDING.left + barStep * i + barStep / 2,
        HEIGHT - PADDING.bottom + 18,
      );

      // Value label
      ctx.fillStyle = val >= 0 ? "#3b82f6" : "#ef4444";
      ctx.font = "10px monospace";
      ctx.fillText(
        val.toFixed(1),
        PADDING.left + barStep * i + barStep / 2,
        val >= 0 ? zeroY - barH - 6 : zeroY + barH + 14,
      );
    });

    // Y-axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(0), PADDING.left - 8, y + 4);
    }

    // Title
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Delta Exposure by Underlying", WIDTH / 2, HEIGHT - 4);
  }, [positions]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: WIDTH, height: HEIGHT }}
      className="rounded"
    />
  );
};
