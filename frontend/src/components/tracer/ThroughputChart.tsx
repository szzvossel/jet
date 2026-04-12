/**
 * ThroughputChart — Line chart showing events per minute over time.
 */

import React, { useRef, useEffect } from "react";
import type { ThroughputPoint } from "../../types";

interface Props {
  throughput: ThroughputPoint[];
}

const WIDTH = 400;
const HEIGHT = 240;
const PADDING = { top: 20, right: 20, bottom: 40, left: 50 };

export const ThroughputChart: React.FC<Props> = ({ throughput }) => {
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

    if (throughput.length === 0) {
      ctx.fillStyle = "#64748b";
      ctx.font = "12px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("No throughput data", WIDTH / 2, HEIGHT / 2);
      return;
    }

    const maxVal = Math.max(...throughput.map((p) => p.count), 1) * 1.2;

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

    const step = plotW / Math.max(throughput.length - 1, 1);

    const toX = (i: number) => PADDING.left + step * i;
    const toY = (v: number) => PADDING.top + plotH - (v / maxVal) * plotH;

    // Line
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    throughput.forEach((point, i) => {
      const x = toX(i);
      const y = toY(point.count);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill area under line
    ctx.fillStyle = "#818cf822";
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

    // Dots
    throughput.forEach((point, i) => {
      const x = toX(i);
      const y = toY(point.count);
      ctx.fillStyle = "#818cf8";
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();
    });

    // X-axis labels (show up to 6 labels)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "9px monospace";
    ctx.textAlign = "center";
    const labelStep = Math.max(1, Math.floor(throughput.length / 6));
    throughput.forEach((point, i) => {
      if (i % labelStep === 0 || i === throughput.length - 1) {
        const x = toX(i);
        // Show only the time portion (HH:MM)
        const timeLabel = point.bucket.length >= 16 ? point.bucket.slice(11, 16) : point.bucket;
        ctx.fillText(timeLabel, x, HEIGHT - PADDING.bottom + 16);
      }
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
  }, [throughput]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: WIDTH, height: HEIGHT }}
      className="rounded"
    />
  );
};
