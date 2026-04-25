/**
 * PayoffChart — Canvas payoff diagram with gradient fill and crosshair tooltip.
 *
 * Renders the BSM value curve (solid + gradient fill) and payoff at expiry (dashed).
 * Interactive crosshair shows spot/price on hover.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";

interface DataPoint {
  spot: number;
  price: number;
}

interface Props {
  priceCurve: DataPoint[];
  strike: number;
  optionType: "Call" | "Put";
}

const HEIGHT = 340;
const PADDING = { top: 24, right: 24, bottom: 44, left: 64 };

interface HoverState {
  x: number;
  y: number;
  spot: number;
  price: number;
  payoff: number;
}

export const PayoffChart: React.FC<Props> = ({
  priceCurve,
  strike,
  optionType,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [hover, setHover] = useState<HoverState | null>(null);

  // Scale functions stored for hover calculations
  const scalesRef = useRef<{ xScale: (v: number) => number; yScale: (v: number) => number; minSpot: number; maxSpot: number; minVal: number; maxVal: number } | null>(null);

  // Measure container width reactively
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

  // Draw whenever data or canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || priceCurve.length === 0 || canvasWidth === 0) return;

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

    // Surface-matched background
    ctx.fillStyle = "#0c1322";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    // Compute bounds
    const spots = priceCurve.map((p) => p.spot);
    const prices = priceCurve.map((p) => p.price);
    const payoffs = priceCurve.map((p) =>
      optionType === "Call"
        ? Math.max(p.spot - strike, 0)
        : Math.max(strike - p.spot, 0),
    );

    const minSpot = Math.min(...spots);
    const maxSpot = Math.max(...spots);
    const maxVal =
      Math.max(Math.max(...prices), Math.max(...payoffs)) * 1.1;
    const minVal = Math.min(0, Math.min(...prices)) * 1.1;

    const xScale = (v: number) =>
      PADDING.left + ((v - minSpot) / (maxSpot - minSpot)) * plotW;
    const yScale = (v: number) =>
      PADDING.top + plotH - ((v - minVal) / (maxVal - minVal)) * plotH;

    scalesRef.current = { xScale, yScale, minSpot, maxSpot, minVal, maxVal };

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

    // Zero line
    if (minVal < 0) {
      ctx.strokeStyle = "#2a3a50";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, yScale(0));
      ctx.lineTo(WIDTH - PADDING.right, yScale(0));
      ctx.stroke();
    }

    // Strike vertical line
    ctx.strokeStyle = "#f59e0b30";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xScale(strike), PADDING.top);
    ctx.lineTo(xScale(strike), HEIGHT - PADDING.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Gradient fill under BSM curve
    const gradient = ctx.createLinearGradient(0, PADDING.top, 0, HEIGHT - PADDING.bottom);
    gradient.addColorStop(0, "rgba(129, 140, 248, 0.12)");
    gradient.addColorStop(1, "rgba(129, 140, 248, 0.0)");

    ctx.beginPath();
    for (let i = 0; i < priceCurve.length; i++) {
      const x = xScale(spots[i]);
      const y = yScale(prices[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.lineTo(xScale(spots[spots.length - 1]), yScale(0));
    ctx.lineTo(xScale(spots[0]), yScale(0));
    ctx.closePath();
    ctx.fillStyle = gradient;
    ctx.fill();

    // Payoff at expiry (dashed)
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    for (let i = 0; i < priceCurve.length; i++) {
      const x = xScale(spots[i]);
      const y = yScale(payoffs[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Option value curve (solid)
    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i < priceCurve.length; i++) {
      const x = xScale(spots[i]);
      const y = yScale(prices[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Axis labels — design system mono
    const monoFont = "11px 'JetBrains Mono', monospace";
    const sansFont = "11px 'DM Sans', sans-serif";

    ctx.fillStyle = "#64748b";
    ctx.font = monoFont;
    ctx.textAlign = "center";
    for (let i = 0; i <= 5; i++) {
      const val = minSpot + ((maxSpot - minSpot) * i) / 5;
      const x = PADDING.left + (plotW * i) / 5;
      ctx.fillText(val.toFixed(0), x, HEIGHT - PADDING.bottom + 16);
    }
    ctx.textAlign = "right";
    for (let i = 0; i <= 5; i++) {
      const val = maxVal - ((maxVal - minVal) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(1), PADDING.left - 8, y + 4);
    }

    // Axis title
    ctx.fillStyle = "#475569";
    ctx.font = sansFont;
    ctx.textAlign = "center";
    ctx.fillText("Spot Price", WIDTH / 2, HEIGHT - 4);

    // Legend pill
    const legendX = PADDING.left + 12;
    const legendY = PADDING.top + 10;
    ctx.fillStyle = "rgba(12, 19, 34, 0.85)";
    ctx.beginPath();
    ctx.roundRect(legendX - 6, legendY - 6, 210, 46, 6);
    ctx.fill();

    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 8);
    ctx.lineTo(legendX + 16, legendY + 8);
    ctx.stroke();
    ctx.fillStyle = "#cbd5e1";
    ctx.font = sansFont;
    ctx.textAlign = "left";
    ctx.fillText("BSM Value", legendX + 22, legendY + 12);

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 28);
    ctx.lineTo(legendX + 16, legendY + 28);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Payoff at Expiry", legendX + 22, legendY + 32);
  }, [priceCurve, strike, optionType, canvasWidth]);

  // Crosshair on hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !priceCurve.length || !scalesRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;

      const { xScale, yScale, minSpot, maxSpot } = scalesRef.current;
      const plotW = canvasWidth - PADDING.left - PADDING.right;

      // Find nearest data point
      const spotRange = maxSpot - minSpot;
      const spot = minSpot + ((mx - PADDING.left) / plotW) * spotRange;

      let nearest = priceCurve[0];
      let minDist = Infinity;
      for (const p of priceCurve) {
        const dist = Math.abs(p.spot - spot);
        if (dist < minDist) {
          minDist = dist;
          nearest = p;
        }
      }

      const payoff =
        optionType === "Call"
          ? Math.max(nearest.spot - strike, 0)
          : Math.max(strike - nearest.spot, 0);

      setHover({
        x: xScale(nearest.spot),
        y: yScale(nearest.price),
        spot: nearest.spot,
        price: nearest.price,
        payoff,
      });
    },
    [priceCurve, strike, optionType, canvasWidth]
  );

  const handleMouseLeave = useCallback(() => setHover(null), []);

  return (
    <div className="surface-card-static p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="data-label">Payoff Diagram</span>
        <span className="text-[10px] text-slate-600" style={{ fontFamily: "var(--font-mono)" }}>
          K={strike.toFixed(0)}
        </span>
      </div>
      <div ref={containerRef} className="w-full relative">
        <canvas
          ref={canvasRef}
          style={{ height: HEIGHT }}
          className="rounded w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {/* Crosshair overlay */}
        {hover && (
          <>
            <div
              className="absolute pointer-events-none"
              style={{
                left: hover.x,
                top: 8,
                width: 1,
                height: HEIGHT - PADDING.bottom - 8,
                backgroundColor: "rgba(148, 163, 184, 0.3)",
              }}
            />
            <div
              className="absolute pointer-events-none"
              style={{
                left: PADDING.left,
                top: hover.y,
                width: canvasWidth - PADDING.left - PADDING.right,
                height: 1,
                backgroundColor: "rgba(148, 163, 184, 0.3)",
              }}
            />
            {/* Tooltip */}
            <div
              className="absolute pointer-events-none rounded-md px-2.5 py-1.5 text-[10px] z-10"
              style={{
                left: Math.min(hover.x + 12, canvasWidth - 160),
                top: Math.max(hover.y - 60, 8),
                background: "rgba(12, 19, 34, 0.92)",
                border: "1px solid rgba(71, 85, 105, 0.4)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <div className="text-slate-400">S: {hover.spot.toFixed(1)}</div>
              <div className="text-[#818cf8]">BSM: {hover.price.toFixed(2)}</div>
              <div className="text-slate-500">Pay: {hover.payoff.toFixed(2)}</div>
            </div>
            {/* Dot on curve */}
            <div
              className="absolute pointer-events-none w-2.5 h-2.5 rounded-full"
              style={{
                left: hover.x - 5,
                top: hover.y - 5,
                backgroundColor: "#818cf8",
                boxShadow: "0 0 6px rgba(129, 140, 248, 0.5)",
              }}
            />
          </>
        )}
      </div>
    </div>
  );
};
