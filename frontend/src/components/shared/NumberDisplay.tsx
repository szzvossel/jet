/**
 * Formatted monospace number display component.
 */

import React from "react";

interface Props {
  value: number | null | undefined;
  format?: "number" | "percent" | "bps" | "currency";
  decimals?: number;
  colorize?: boolean;
  className?: string;
}

export const NumberDisplay: React.FC<Props> = ({
  value,
  format = "number",
  decimals = 4,
  colorize = false,
  className = "",
}) => {
  if (value === null || value === undefined || isNaN(value)) {
    return <span className={`font-mono text-slate-500 ${className}`}>—</span>;
  }

  let formatted: string;
  let color = "";

  switch (format) {
    case "percent":
      formatted = `${(value * 100).toFixed(decimals)}%`;
      break;
    case "bps":
      formatted = `${(value * 10000).toFixed(decimals)} bps`;
      break;
    case "currency":
      formatted = `$${value.toFixed(decimals)}`;
      break;
    default:
      formatted = value.toFixed(decimals);
  }

  if (colorize) {
    if (value > 0) color = "text-green-400";
    else if (value < 0) color = "text-red-400";
    else color = "text-slate-400";
  }

  return (
    <span className={`font-mono ${color} ${className}`}>
      {formatted}
    </span>
  );
};
