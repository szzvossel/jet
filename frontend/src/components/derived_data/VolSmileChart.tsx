/**
 * VolSmileChart — Responsive canvas vol smile/skew chart.
 *
 * Uses ResizeObserver to auto-fit container width.
 * Design system fonts, surface-matched background.
 */

import React, { useRef, useEffect, useState } from "react";
import type { VolSmile } from "../../types";

interface Props {
  smiles: VolSmile[];
}

const HEIGHT = 320;
const PADDING = { top: 24, right: 24, bottom: 44, left: 64 };

const COLORS = ["#818cf8", "#3b82f6", "#a855f7", "#eab308"];

export const VolSmileChart: React.FC<Props> = ({ smiles }) => {
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
    if (!canvas || smiles.length === 0 || canvasWidth === 0) return;

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

    let allStrikes: number[] = [];
    let minVol = Infinity;
    let maxVol = -Infinity;
    for (const smile of smiles) {
      allStrikes = allStrikes.length === 0 ? [...smile.strikes] : allStrikes;
      for (const v of smile.vols) {
        if (v < minVol) minVol = v;
        if (v > maxVol) maxVol = v;
      }
    }

    const minStrike = Math.min(...allStrikes);
    const maxStrike = Math.max(...allStrikes);
    const volPad = (maxVol - minVol) * 0.1;
    const yMin = (minVol - volPad) * 100;
    const yMax = (maxVol + volPad) * 100;

    const xScale = (v: number) =>
      PADDING.left + ((v - minStrike) / (maxStrike - minStrike)) * plotW;
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

    // Draw each smile with gradient fill
    smiles.forEach((smile, idx) => {
      const color = COLORS[idx % COLORS.length];

      // Gradient fill under curve
      const gradient = ctx.createLinearGradient(0, PADDING.top, 0, HEIGHT - PADDING.bottom);
      gradient.addColorStop(0, color + "18");
      gradient.addColorStop(1, color + "00");

      ctx.beginPath();
      for (let i = 0; i < smile.strikes.length; i++) {
        const x = xScale(smile.strikes[i]);
        const y = yScale(smile.vols[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.lineTo(xScale(smile.strikes[smile.strikes.length - 1]), yScale(minVol));
      ctx.lineTo(xScale(smile.strikes[0]), yScale(minVol));
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Line
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < smile.strikes.length; i++) {
        const x = xScale(smile.strikes[i]);
        const y = yScale(smile.vols[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    });

    // Axis labels
    const monoFont = "11px 'JetBrains Mono', monospace";
    const sansFont = "11px 'DM Sans', sans-serif";

    ctx.fillStyle = "#64748b";
    ctx.font = monoFont;
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const val = minStrike + ((maxStrike - minStrike) * i) / 5;
      const x = PADDING.left + (plotW * i) / 5;
      ctx.fillText(val.toFixed(0), x, HEIGHT - PADDING.bottom + 16);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(1) + "%", PADDING.left - 8, y + 4);
    }

    // Axis title
    ctx.fillStyle = "#475569";
    ctx.font = sansFont;
    ctx.textAlign = "center";
    ctx.fillText("Strike", WIDTH / 2, HEIGHT - 4);

    // Legend pill
    const legendX = PADDING.left + 12;
    const legendY = PADDING.top + 10;
    const pillWidth = smiles.length * 58 + 12;
    ctx.fillStyle = "rgba(12, 19, 34, 0.85)";
    ctx.beginPath();
    ctx.roundRect(legendX - 6, legendY - 6, pillWidth, 28, 6);
    ctx.fill();

    ctx.font = sansFont;
    ctx.textAlign = "left";
    let lx = legendX;
    smiles.forEach((smile, idx) => {
      const tenorLabel =
        smile.tenor < 1
          ? `${(smile.tenor * 12).toFixed(0)}M`
          : `${smile.tenor.toFixed(0)}Y`;
      ctx.strokeStyle = COLORS[idx % COLORS.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, legendY + 8);
      ctx.lineTo(lx + 12, legendY + 8);
      ctx.stroke();
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(tenorLabel, lx + 16, legendY + 12);
      lx += 58;
    });
  }, [smiles, canvasWidth]);

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
