/**
 * DeltaExposureChart — Responsive canvas bar chart for delta exposure by underlying.
 *
 * Uses ResizeObserver. Surface-matched background, design system fonts.
 * Gradient-filled bars with rounded tops.
 */

import React, { useRef, useEffect, useState } from "react";
import type { PositionRisk } from "../../types";

interface Props {
  positions: PositionRisk[];
}

const HEIGHT = 280;
const PADDING = { top: 24, right: 24, bottom: 44, left: 64 };

export const DeltaExposureChart: React.FC<Props> = ({ positions }) => {
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
    if (!canvas || positions.length === 0 || canvasWidth === 0) return;

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

    // Bars with gradients
    labels.forEach((label, i) => {
      const val = values[i];
      const x = PADDING.left + barStep * i + barStep / 2 - barWidth / 2;
      const barH = Math.abs(yScale(val) - zeroY);
      const barY = val >= 0 ? zeroY - barH : zeroY;

      // Gradient fill
      const grad = ctx.createLinearGradient(0, barY, 0, barY + barH);
      if (val >= 0) {
        grad.addColorStop(0, "rgba(59, 130, 246, 0.7)");
        grad.addColorStop(1, "rgba(59, 130, 246, 0.25)");
      } else {
        grad.addColorStop(0, "rgba(239, 68, 68, 0.25)");
        grad.addColorStop(1, "rgba(239, 68, 68, 0.7)");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, barY, barWidth, barH, [3, 3, 0, 0]);
      ctx.fill();

      // Label
      ctx.fillStyle = "#94a3b8";
      ctx.font = sansFont;
      ctx.textAlign = "center";
      ctx.fillText(
        label,
        PADDING.left + barStep * i + barStep / 2,
        HEIGHT - PADDING.bottom + 16,
      );

      // Value label
      ctx.fillStyle = val >= 0 ? "#3b82f6" : "#ef4444";
      ctx.font = monoFont;
      ctx.fillText(
        val.toFixed(1),
        PADDING.left + barStep * i + barStep / 2,
        val >= 0 ? zeroY - barH - 6 : zeroY + barH + 14,
      );
    });

    // Y-axis labels
    ctx.fillStyle = "#64748b";
    ctx.font = monoFont;
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(0), PADDING.left - 8, y + 4);
    }

    // Legend pill
    const legendX = PADDING.left + 12;
    const legendY = PADDING.top + 8;
    ctx.fillStyle = "rgba(12, 19, 34, 0.85)";
    ctx.beginPath();
    ctx.roundRect(legendX - 6, legendY - 6, 190, 28, 6);
    ctx.fill();

    ctx.fillStyle = "rgba(59, 130, 246, 0.5)";
    ctx.fillRect(legendX, legendY + 2, 12, 12);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = sansFont;
    ctx.textAlign = "left";
    ctx.fillText("Long", legendX + 16, legendY + 12);

    ctx.fillStyle = "rgba(239, 68, 68, 0.5)";
    ctx.fillRect(legendX + 80, legendY + 2, 12, 12);
    ctx.fillStyle = "#cbd5e1";
    ctx.fillText("Short", legendX + 96, legendY + 12);
  }, [positions, canvasWidth]);

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
