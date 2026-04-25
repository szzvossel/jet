/**
 * StrategyPayoffChart — P&L at expiry diagram for multi-leg strategies.
 *
 * Renders a canvas-based chart showing:
 * - Combined payoff at expiry (solid line)
 * - Individual leg payoffs (faded lines)
 * - Zero line and breakeven markers
 * - Interactive hover crosshair with tooltip
 *
 * Uses ResizeObserver to auto-fit container width.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { PricedLeg } from "../../types";

interface Props {
  legs: PricedLeg[];
}

const HEIGHT = 360;
const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };
const NUM_POINTS = 200;

interface HoverState {
  spot: number;
  pnl: number;
  x: number;
  y: number;
}

export const StrategyPayoffChart: React.FC<Props> = ({ legs }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [hover, setHover] = useState<HoverState | null>(null);

  // Compute payoff data
  const { spots, combinedPnl, legPnls, minSpot, maxSpot } = (() => {
    if (legs.length === 0)
      return {
        spots: [], combinedPnl: [], legPnls: [], minSpot: 0, maxSpot: 0,
      };

    const spot = legs[0].strike; // Use first leg's strike as reference
    const range = spot * 0.4;
    const lo = spot - range;
    const hi = spot + range;
    const pts: number[] = [];
    const combined: number[] = [];
    const individual: number[][] = legs.map(() => []);

    for (let i = 0; i < NUM_POINTS; i++) {
      const s = lo + ((hi - lo) * i) / (NUM_POINTS - 1);
      pts.push(s);
      let total = 0;
      legs.forEach((leg, legIdx) => {
        const intrinsic =
          leg.option_type === "Call"
            ? Math.max(s - leg.strike, 0)
            : Math.max(leg.strike - s, 0);
        const sign = leg.direction === "Long" ? 1 : -1;
        const legPnl = sign * leg.quantity * (intrinsic - leg.price);
        individual[legIdx].push(legPnl);
        total += legPnl;
      });
      combined.push(total);
    }

    return { spots: pts, combinedPnl: combined, legPnls: individual, minSpot: lo, maxSpot: hi };
  })();

  // Measure container width
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

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || spots.length === 0 || canvasWidth === 0) return;

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

    // Background
    ctx.fillStyle = "#0c1322";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Y bounds
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const v of combinedPnl) {
      if (v < yMin) yMin = v;
      if (v > yMax) yMax = v;
    }
    for (const lp of legPnls) {
      for (const v of lp) {
        if (v < yMin) yMin = v;
        if (v > yMax) yMax = v;
      }
    }
    const yPad = Math.max((yMax - yMin) * 0.1, 1);
    yMin -= yPad;
    yMax += yPad;

    const xScale = (v: number) =>
      PADDING.left + ((v - minSpot) / (maxSpot - minSpot)) * plotW;
    const yScale = (v: number) =>
      PADDING.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

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

    // Zero line
    if (yMin < 0 && yMax > 0) {
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, yScale(0));
      ctx.lineTo(WIDTH - PADDING.right, yScale(0));
      ctx.stroke();
    }

    // Fill profit/loss area
    ctx.beginPath();
    ctx.moveTo(xScale(spots[0]), yScale(0));
    for (let i = 0; i < spots.length; i++) {
      ctx.lineTo(xScale(spots[i]), yScale(combinedPnl[i]));
    }
    ctx.lineTo(xScale(spots[spots.length - 1]), yScale(0));
    ctx.closePath();
    for (let i = 0; i < spots.length - 1; i++) {
      const pnl = combinedPnl[i];
      const x = xScale(spots[i]);
      const y = yScale(pnl);
      const nextX = xScale(spots[i + 1]);
      const baseY = yScale(0);
      ctx.fillStyle = pnl >= 0 ? "rgba(74, 222, 128, 0.08)" : "rgba(248, 113, 113, 0.08)";
      ctx.fillRect(Math.min(x, xScale(spots[i])), Math.min(y, baseY), nextX - x, Math.abs(baseY - y));
    }

    // Individual leg payoffs (faded)
    const legColors = ["#3b82f680", "#a855f780", "#eab30880", "#f9731680", "#ec489980", "#14b8a680"];
    legPnls.forEach((pnl, idx) => {
      ctx.strokeStyle = legColors[idx % legColors.length];
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let i = 0; i < spots.length; i++) {
        const x = xScale(spots[i]);
        const y = yScale(pnl[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Combined payoff (solid, prominent)
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < spots.length; i++) {
      const x = xScale(spots[i]);
      const y = yScale(combinedPnl[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Strike vertical lines
    const uniqueStrikes = [...new Set(legs.map((l) => l.strike))];
    ctx.setLineDash([4, 4]);
    uniqueStrikes.forEach((strike) => {
      ctx.strokeStyle = "#f59e0b44";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(xScale(strike), PADDING.top);
      ctx.lineTo(xScale(strike), HEIGHT - PADDING.bottom);
      ctx.stroke();

      // Strike label
      ctx.fillStyle = "#f59e0b88";
      ctx.font = "10px monospace";
      ctx.textAlign = "center";
      ctx.fillText(strike.toFixed(0), xScale(strike), PADDING.top - 6);
    });
    ctx.setLineDash([]);

    // Breakeven markers
    for (let i = 1; i < combinedPnl.length; i++) {
      if (
        (combinedPnl[i - 1] < 0 && combinedPnl[i] >= 0) ||
        (combinedPnl[i - 1] >= 0 && combinedPnl[i] < 0)
      ) {
        const t = -combinedPnl[i - 1] / (combinedPnl[i] - combinedPnl[i - 1]);
        const beSpot = spots[i - 1] + t * (spots[i] - spots[i - 1]);
        const bx = xScale(beSpot);
        const by = yScale(0);
        ctx.fillStyle = "#22d3ee";
        ctx.beginPath();
        ctx.arc(bx, by, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#22d3ee";
        ctx.font = "10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`BE ${beSpot.toFixed(1)}`, bx, HEIGHT - PADDING.bottom + 32);
      }
    }

    // Axis labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const val = minSpot + ((maxSpot - minSpot) * i) / 5;
      const x = PADDING.left + (plotW * i) / 5;
      ctx.fillText(val.toFixed(0), x, HEIGHT - PADDING.bottom + 18);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(1), PADDING.left - 8, y + 4);
    }

    // Axis titles
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Spot Price", WIDTH / 2, HEIGHT - 4);

    ctx.save();
    ctx.translate(14, HEIGHT / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("P&L at Expiry", 0, 0);
    ctx.restore();

    // Legend
    const legendX = PADDING.left + 12;
    const legendY = PADDING.top + 12;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";

    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 6);
    ctx.lineTo(legendX + 16, legendY + 6);
    ctx.stroke();
    ctx.fillStyle = "#e2e8f0";
    ctx.fillText("Combined P&L", legendX + 20, legendY + 10);

    legs.forEach((leg, idx) => {
      const ly = legendY + 18 + idx * 16;
      ctx.strokeStyle = legColors[idx % legColors.length];
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(legendX, ly + 6);
      ctx.lineTo(legendX + 16, ly + 6);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = "#94a3b8";
      const dir = leg.direction === "Long" ? "+" : "-";
      ctx.fillText(`${dir}${leg.quantity} ${leg.option_type} ${leg.strike.toFixed(0)}`, legendX + 20, ly + 10);
    });
  }, [legs, spots, combinedPnl, legPnls, minSpot, maxSpot, canvasWidth]);

  // Hover handler
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (spots.length === 0) return;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const plotW = canvasWidth - PADDING.left - PADDING.right;
      const plotH = HEIGHT - PADDING.top - PADDING.bottom;

      if (x < PADDING.left || x > canvasWidth - PADDING.right) {
        setHover(null);
        return;
      }

      const spotFrac = (x - PADDING.left) / plotW;
      const idx = Math.round(spotFrac * (spots.length - 1));
      if (idx < 0 || idx >= spots.length) {
        setHover(null);
        return;
      }

      const spot = spots[idx];
      const pnl = combinedPnl[idx];
      const yMin2 = Math.min(...combinedPnl) - Math.max((Math.max(...combinedPnl) - Math.min(...combinedPnl)) * 0.1, 1);
      const yMax2 = Math.max(...combinedPnl) + Math.max((Math.max(...combinedPnl) - Math.min(...combinedPnl)) * 0.1, 1);
      const yPos =
        PADDING.top + plotH - ((pnl - yMin2) / (yMax2 - yMin2)) * plotH;

      setHover({ spot, pnl, x, y: yPos });
    },
    [spots, combinedPnl, canvasWidth],
  );

  if (legs.length === 0) return null;

  return (
    <div className="surface-card-static p-4">
      <span className="data-label">Strategy Payoff at Expiry</span>
      <div ref={containerRef} className="w-full relative mt-3">
        <canvas
          ref={canvasRef}
          style={{ height: HEIGHT }}
          className="rounded w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHover(null)}
        />
        {/* Hover tooltip */}
        {hover && (
          <div
            className="absolute pointer-events-none bg-slate-900/95 border border-slate-600 rounded px-2.5 py-1.5 text-xs shadow-lg"
            style={{
              left: Math.min(hover.x + 12, canvasWidth - 160),
              top: Math.max(hover.y - 40, 60),
            }}
          >
            <div className="text-slate-400">Spot: <span className="text-slate-200 font-mono">{hover.spot.toFixed(1)}</span></div>
            <div className={hover.pnl >= 0 ? "text-green-400" : "text-red-400"}>
              P&L: <span className="font-mono">{hover.pnl >= 0 ? "+" : ""}{hover.pnl.toFixed(2)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
