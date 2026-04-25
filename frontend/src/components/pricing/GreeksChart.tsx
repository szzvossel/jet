/**
 * GreeksChart — Canvas Greeks profile with interactive crosshair.
 *
 * Renders delta, gamma, vega, and theta across a range of spot prices.
 * Hover shows crosshair with values for each Greek at the nearest data point.
 */

import React, { useRef, useEffect, useState, useCallback } from "react";
import type { GreeksCurveResult } from "../../types";

interface Props {
  data: GreeksCurveResult | null;
}

const HEIGHT = 340;
const PADDING = { top: 24, right: 24, bottom: 44, left: 64 };

interface Series {
  values: number[];
  color: string;
  label: string;
}

interface HoverState {
  x: number;
  spot: number;
  values: { label: string; value: number; color: string }[];
}

export const GreeksChart: React.FC<Props> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);
  const [hover, setHover] = useState<HoverState | null>(null);

  const scalesRef = useRef<{ xScale: (v: number) => number; minSpot: number; maxSpot: number } | null>(null);

  const hasData = data !== null && data.spots.length > 0;

  // Measure container width reactively
  useEffect(() => {
    if (!hasData) return;
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
  }, [hasData]);

  // Draw whenever data or canvas size changes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data || data.spots.length === 0 || canvasWidth === 0) return;

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

    const series: Series[] = [
      { values: data.deltas, color: "#3b82f6", label: "Delta" },
      { values: data.gammas, color: "#a855f7", label: "Gamma" },
      { values: data.vegas, color: "#eab308", label: "Vega" },
      { values: data.thetas, color: "#f97316", label: "Theta" },
    ];

    const spots = data.spots;
    const minSpot = spots[0];
    const maxSpot = spots[spots.length - 1];

    // Compute global y bounds
    let allMin = Infinity;
    let allMax = -Infinity;
    for (const s of series) {
      for (const v of s.values) {
        if (v < allMin) allMin = v;
        if (v > allMax) allMax = v;
      }
    }
    const yPad = (allMax - allMin) * 0.1;
    const yMin = allMin - yPad;
    const yMax = allMax + yPad;

    const xScale = (v: number) =>
      PADDING.left + ((v - minSpot) / (maxSpot - minSpot)) * plotW;
    const yScale = (v: number) =>
      PADDING.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

    scalesRef.current = { xScale, minSpot, maxSpot };

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
    if (yMin < 0 && yMax > 0) {
      ctx.strokeStyle = "#2a3a50";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, yScale(0));
      ctx.lineTo(WIDTH - PADDING.right, yScale(0));
      ctx.stroke();
    }

    // Draw each series
    for (const s of series) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < spots.length; i++) {
        const x = xScale(spots[i]);
        const y = yScale(s.values[i]);
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    // Axis labels
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
      const val = yMax - ((yMax - yMin) * i) / 5;
      const y = PADDING.top + (plotH * i) / 5;
      ctx.fillText(val.toFixed(3), PADDING.left - 8, y + 4);
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
    ctx.roundRect(legendX - 6, legendY - 6, 310, 28, 6);
    ctx.fill();

    ctx.font = sansFont;
    ctx.textAlign = "left";
    let lx = legendX;
    for (const s of series) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(lx, legendY + 8);
      ctx.lineTo(lx + 12, legendY + 8);
      ctx.stroke();
      ctx.fillStyle = "#cbd5e1";
      ctx.fillText(s.label, lx + 16, legendY + 12);
      lx += 74;
    }
  }, [data, canvasWidth]);

  // Crosshair on hover
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas || !data || data.spots.length === 0 || !scalesRef.current) return;

      const rect = canvas.getBoundingClientRect();
      const mx = e.clientX - rect.left;

      const { xScale, minSpot, maxSpot } = scalesRef.current;
      const plotW = canvasWidth - PADDING.left - PADDING.right;
      const spotRange = maxSpot - minSpot;
      const spot = minSpot + ((mx - PADDING.left) / plotW) * spotRange;

      let nearestIdx = 0;
      let minDist = Infinity;
      for (let i = 0; i < data.spots.length; i++) {
        const dist = Math.abs(data.spots[i] - spot);
        if (dist < minDist) {
          minDist = dist;
          nearestIdx = i;
        }
      }

      const seriesArr = [
        { label: "Delta", values: data.deltas, color: "#3b82f6" },
        { label: "Gamma", values: data.gammas, color: "#a855f7" },
        { label: "Vega", values: data.vegas, color: "#eab308" },
        { label: "Theta", values: data.thetas, color: "#f97316" },
      ];

      setHover({
        x: xScale(data.spots[nearestIdx]),
        spot: data.spots[nearestIdx],
        values: seriesArr.map((s) => ({
          label: s.label,
          value: s.values[nearestIdx],
          color: s.color,
        })),
      });
    },
    [data, canvasWidth]
  );

  const handleMouseLeave = useCallback(() => setHover(null), []);

  if (!hasData) {
    return (
      <div className="surface-card-static p-4">
        <span className="data-label">Greeks Profile</span>
        <div className="flex items-center justify-center py-16">
          <p className="text-slate-600 text-sm">
            Calculate a price to see Greeks across spot prices.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="surface-card-static p-4">
      <span className="data-label">Greeks Profile</span>
      <div ref={containerRef} className="w-full relative mt-3">
        <canvas
          ref={canvasRef}
          style={{ height: HEIGHT }}
          className="rounded w-full cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
        />
        {/* Crosshair */}
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
            {/* Tooltip */}
            <div
              className="absolute pointer-events-none rounded-md px-2.5 py-2 text-[10px] z-10"
              style={{
                left: Math.min(hover.x + 12, canvasWidth - 140),
                top: 16,
                background: "rgba(12, 19, 34, 0.92)",
                border: "1px solid rgba(71, 85, 105, 0.4)",
                fontFamily: "var(--font-mono)",
              }}
            >
              <div className="text-slate-400 mb-1">S: {hover.spot.toFixed(1)}</div>
              {hover.values.map((v) => (
                <div key={v.label} style={{ color: v.color }}>
                  {v.label}: {v.value.toFixed(4)}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
