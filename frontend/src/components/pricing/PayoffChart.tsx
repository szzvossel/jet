/**
 * Payoff diagram using HTML Canvas.
 *
 * Renders the option price curve and payoff at expiry on a canvas element.
 * Uses ResizeObserver to auto-fit the container width.
 */

import React, { useRef, useEffect, useState } from "react";

interface DataPoint {
  spot: number;
  price: number;
}

interface Props {
  priceCurve: DataPoint[];
  strike: number;
  optionType: "Call" | "Put";
}

const HEIGHT = 360;
const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };

export const PayoffChart: React.FC<Props> = ({
  priceCurve,
  strike,
  optionType,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

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

    // Clear
    ctx.fillStyle = "#0f172a";
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

    // Grid lines
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
    if (minVal < 0) {
      ctx.strokeStyle = "#334155";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(PADDING.left, yScale(0));
      ctx.lineTo(WIDTH - PADDING.right, yScale(0));
      ctx.stroke();
    }

    // Strike vertical line
    ctx.strokeStyle = "#f59e0b44";
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xScale(strike), PADDING.top);
    ctx.lineTo(xScale(strike), HEIGHT - PADDING.bottom);
    ctx.stroke();
    ctx.setLineDash([]);

    // Payoff at expiry (dashed)
    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
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
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < priceCurve.length; i++) {
      const x = xScale(spots[i]);
      const y = yScale(prices[i]);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Axes labels
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
      const val = maxVal - ((maxVal - minVal) * i) / 5;
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
    ctx.fillText("Option Value", 0, 0);
    ctx.restore();

    // Legend
    const legendX = WIDTH - PADDING.right - 150;
    const legendY = PADDING.top + 12;

    ctx.fillStyle = "#0f172aCC";
    ctx.fillRect(legendX - 6, legendY - 6, 156, 50);

    ctx.strokeStyle = "#818cf8";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 8);
    ctx.lineTo(legendX + 20, legendY + 8);
    ctx.stroke();
    ctx.fillStyle = "#e2e8f0";
    ctx.textAlign = "left";
    ctx.font = "11px sans-serif";
    ctx.fillText("BSM Value", legendX + 26, legendY + 12);

    ctx.strokeStyle = "#64748b";
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(legendX, legendY + 28);
    ctx.lineTo(legendX + 20, legendY + 28);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("Payoff at Expiry", legendX + 26, legendY + 32);
  }, [priceCurve, strike, optionType, canvasWidth]);

  return (
    <div className="bg-slate-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-slate-100 mb-4">
        Payoff Diagram
      </h2>
      <div ref={containerRef} className="w-full">
        <canvas
          ref={canvasRef}
          style={{ height: HEIGHT }}
          className="rounded w-full"
        />
      </div>
    </div>
  );
};
