/**
 * StrategyGreeksChart — Greeks profile across spot prices for multi-leg strategies.
 *
 * Renders delta, gamma, vega, and theta as combined curves on a canvas.
 * Uses ResizeObserver to auto-fit the container width.
 */

import React, { useRef, useEffect, useState } from "react";
import type { PricedLeg } from "../../types";

interface Props {
  legs: PricedLeg[];
}

const HEIGHT = 360;
const PADDING = { top: 30, right: 30, bottom: 50, left: 70 };
const NUM_POINTS = 200;

// BSM helpers for computing Greeks at arbitrary spot
function normPdf(x: number): number {
  return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

function normCdf(x: number): number {
  const a1 = 0.254829592,
    a2 = -0.284496736,
    a3 = 1.421413741,
    a4 = -1.453152027,
    a5 = 1.061405429,
    p = 0.3275911;
  const sign = x < 0 ? -1 : 1;
  const t = 1.0 / (1.0 + sign * p * Math.abs(x));
  const y =
    1.0 -
    ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x * 0.5);
  return 0.5 * (1.0 + sign * y);
}

function bsGreeks(
  S: number,
  K: number,
  T: number,
  r: number,
  vol: number,
  isCall: boolean,
) {
  if (T <= 0 || vol <= 0 || S <= 0 || K <= 0)
    return { delta: 0, gamma: 0, vega: 0, theta: 0 };

  const d1 =
    (Math.log(S / K) + (r + (vol * vol) / 2) * T) / (vol * Math.sqrt(T));
  const d2 = d1 - vol * Math.sqrt(T);

  const delta = isCall ? normCdf(d1) : normCdf(d1) - 1;
  const gamma = normPdf(d1) / (S * vol * Math.sqrt(T));
  const vega = S * normPdf(d1) * Math.sqrt(T) / 100;
  const theta = isCall
    ? (-(S * normPdf(d1) * vol) / (2 * Math.sqrt(T)) -
        r * K * Math.exp(-r * T) * normCdf(d2)) /
      365
    : (-(S * normPdf(d1) * vol) / (2 * Math.sqrt(T)) +
        r * K * Math.exp(-r * T) * normCdf(-d2)) /
      365;

  return { delta, gamma, vega, theta };
}

interface Series {
  values: number[];
  color: string;
  label: string;
}

export const StrategyGreeksChart: React.FC<Props> = ({ legs }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [canvasWidth, setCanvasWidth] = useState(0);

  // Compute Greeks curves
  const { spots, series } = (() => {
    if (legs.length === 0) return { spots: [], series: [] as Series[] };

    const spot = legs[0].strike;
    const range = spot * 0.4;
    const lo = spot - range;
    const hi = spot + range;
    const pts: number[] = [];

    // Approximate TTE from legs (use first leg's expiry parsing — simplified)
    // Use a reasonable default for the chart
    const T = 0.1; // ~36 days
    const r = 0.08;
    const vol = 0.2;

    const deltas: number[] = [];
    const gammas: number[] = [];
    const vegas: number[] = [];
    const thetas: number[] = [];

    for (let i = 0; i < NUM_POINTS; i++) {
      const s = lo + ((hi - lo) * i) / (NUM_POINTS - 1);
      pts.push(s);
      let netD = 0, netG = 0, netV = 0, netT = 0;
      legs.forEach((leg) => {
        const greeks = bsGreeks(s, leg.strike, T, r, vol, leg.option_type === "Call");
        const sign = leg.direction === "Long" ? 1 : -1;
        netD += sign * leg.quantity * greeks.delta;
        netG += sign * leg.quantity * greeks.gamma;
        netV += sign * leg.quantity * greeks.vega;
        netT += sign * leg.quantity * greeks.theta;
      });
      deltas.push(netD);
      gammas.push(netG);
      vegas.push(netV);
      thetas.push(netT);
    }

    return {
      spots: pts,
      series: [
        { values: deltas, color: "#3b82f6", label: "Net Delta" },
        { values: gammas, color: "#a855f7", label: "Net Gamma" },
        { values: vegas, color: "#eab308", label: "Net Vega" },
        { values: thetas, color: "#f97316", label: "Net Theta" },
      ],
    };
  })();

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

    ctx.fillStyle = "#0c1322";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);

    const minSpot = spots[0];
    const maxSpot = spots[spots.length - 1];

    let allMin = Infinity;
    let allMax = -Infinity;
    for (const s of series) {
      for (const v of s.values) {
        if (v < allMin) allMin = v;
        if (v > allMax) allMax = v;
      }
    }
    const yPad = Math.max((allMax - allMin) * 0.1, 0.001);
    const yMin = allMin - yPad;
    const yMax = allMax + yPad;

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

    // Draw series
    for (const s of series) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2;
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
      ctx.fillText(val.toFixed(4), PADDING.left - 8, y + 4);
    }

    // Axis titles
    ctx.fillStyle = "#64748b";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("Spot Price", WIDTH / 2, HEIGHT - 4);

    // Legend
    let legendX = PADDING.left + 12;
    const legendY = PADDING.top + 12;
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";

    for (const s of series) {
      ctx.strokeStyle = s.color;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(legendX, legendY + 6);
      ctx.lineTo(legendX + 16, legendY + 6);
      ctx.stroke();
      ctx.fillStyle = "#e2e8f0";
      ctx.fillText(s.label, legendX + 20, legendY + 10);
      legendX += 100;
    }
  }, [spots, series, canvasWidth]);

  if (legs.length === 0) return null;

  return (
    <div className="surface-card-static p-4">
      <span className="data-label">Greeks Sensitivity Profile</span>
      <div ref={containerRef} className="w-full mt-3">
        <canvas
          ref={canvasRef}
          style={{ height: HEIGHT }}
          className="rounded w-full"
        />
      </div>
    </div>
  );
};
