/**
 * ThroughputChart — Responsive line chart showing events per minute over time.
 *
 * Gradient area fill, dot markers, surface-matched background.
 */

import React, { useRef, useEffect, useState } from "react";
import type { ThroughputPoint } from "../../types";

interface Props {
  throughput: ThroughputPoint[];
}

const HEIGHT = 260;
const PADDING = { top: 24, right: 24, bottom: 44, left: 50 };

export const ThroughputChart: React.FC<Props> = ({ throughput }) => {
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

    if (throughput.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = sansFont;
      ctx.textAlign = "center";
      ctx.fillText("No throughput data", WIDTH / 2, HEIGHT / 2);
      return;
    }

    const maxVal = Math.max(...throughput.map((p) => p.count), 1) * 1.2;

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

    const step = plotW / Math.max(throughput.length - 1, 1);

    const toX = (i: number) => PADDING.left + step * i;
    const toY = (v: number) => PADDING.top + plotH - (v / maxVal) * plotH;

    // Gradient area fill
    const grad = ctx.createLinearGradient(0, PADDING.top, 0, PADDING.top + plotH);
    grad.addColorStop(0, "rgba(129, 140, 248, 0.25)");
    grad.addColorStop(1, "rgba(129, 140, 248, 0.02)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    throughput.forEach((point, i) => {
      const x = toX(i);
      const y = toY(point.count);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(toX(throughput.length - 1), PADDING.top + plotH);
    ctx.lineTo(toX(0), PADDING.top + plotH);
    ctx.closePath();
    ctx.fill();

    // Line
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2;
    ctx.lineJoin = "round";
    ctx.beginPath();
    throughput.forEach((point, i) => {
      const x = toX(i);
      const y = toY(point.count);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Dots
    throughput.forEach((point, i) => {
      const x = toX(i);
      const y = toY(point.count);
      ctx.fillStyle = "#818cf8";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // X-axis labels (up to 6)
    ctx.fillStyle = "#64748b";
    ctx.font = monoFont;
    ctx.textAlign = "center";
    const labelStep = Math.max(1, Math.floor(throughput.length / 6));
    throughput.forEach((point, i) => {
      if (i % labelStep === 0 || i === throughput.length - 1) {
        const x = toX(i);
        const timeLabel = point.bucket.length >= 16 ? point.bucket.slice(11, 16) : point.bucket;
        ctx.fillText(timeLabel, x, HEIGHT - PADDING.bottom + 16);
      }
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

    // Legend pill
    const legendX = PADDING.left + 12;
    const legendY = PADDING.top + 8;
    ctx.fillStyle = "rgba(12, 19, 34, 0.85)";
    ctx.beginPath();
    ctx.roundRect(legendX - 6, legendY - 6, 140, 28, 6);
    ctx.fill();

    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 8);
    ctx.lineTo(legendX + 16, legendY + 8);
    ctx.stroke();
    ctx.fillStyle = "#818cf8";
    ctx.beginPath();
    ctx.arc(legendX + 8, legendY + 8, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#cbd5e1";
    ctx.font = sansFont;
    ctx.textAlign = "left";
    ctx.fillText("Events / min", legendX + 22, legendY + 12);
  }, [throughput, canvasWidth]);

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
