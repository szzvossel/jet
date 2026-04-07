/**
 * Vol smile/skew canvas chart.
 */

import React, { useRef, useEffect } from "react";
import type { VolSmile } from "../../types";

interface Props {
  smiles: VolSmile[];
}

const WIDTH = 560;
const HEIGHT = 320;
const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };

const COLORS = ["#818cf8", "#3b82f6", "#a855f7", "#eab308"];

export const VolSmileChart: React.FC<Props> = ({ smiles }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || smiles.length === 0) return;

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
    for (let i = 0; i <= 5; i++) {
      const x = PADDING.left + (plotW * i) / 5;
      ctx.beginPath();
      ctx.moveTo(x, PADDING.top);
      ctx.lineTo(x, HEIGHT - PADDING.bottom);
      ctx.stroke();
    }

    // Draw each smile
    smiles.forEach((smile, idx) => {
      ctx.strokeStyle = COLORS[idx % COLORS.length];
      ctx.lineWidth = 2;
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
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const val = minStrike + ((maxStrike - minStrike) * i) / 5;
      const x = PADDING.left + (plotW * i) / 5;
      ctx.fillText(val.toFixed(0), x, HEIGHT - PADDING.bottom + 18);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(1) + "%", PADDING.left - 8, y + 4);
    }

    // Axis titles
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Strike", WIDTH / 2, HEIGHT - 4);

    // Legend
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    let lx = PADDING.left + 12;
    const ly = PADDING.top + 12;
    smiles.forEach((smile, idx) => {
      const tenorLabel =
        smile.tenor < 1
          ? `${(smile.tenor * 12).toFixed(0)}M`
          : `${smile.tenor.toFixed(0)}Y`;
      ctx.strokeStyle = COLORS[idx % COLORS.length];
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(lx, ly + 6);
      ctx.lineTo(lx + 16, ly + 6);
      ctx.stroke();
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(tenorLabel, lx + 20, ly + 10);
      lx += 60;
    });
  }, [smiles]);

  return (
    <canvas
      ref={canvasRef}
      style={{ width: WIDTH, height: HEIGHT }}
      className="rounded"
    />
  );
};
