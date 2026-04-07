/**
 * Correlation heatmap grid component.
 */

import React from "react";
import type { CorrelationMatrix } from "../../types";

interface Props {
  matrix: CorrelationMatrix;
}

function getHeatColor(value: number): string {
  // Red (-1) -> Slate (0) -> Blue (+1)
  if (value >= 0) {
    const intensity = Math.min(value, 1);
    const r = Math.round(30 + (1 - intensity) * 40);
    const g = Math.round(41 + (1 - intensity) * 40);
    const b = Math.round(59 + intensity * 130);
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    const intensity = Math.min(Math.abs(value), 1);
    const r = Math.round(59 + intensity * 140);
    const g = Math.round(41 + (1 - intensity) * 20);
    const b = Math.round(59 + (1 - intensity) * 20);
    return `rgb(${r}, ${g}, ${b})`;
  }
}

export const CorrelationMatrixGrid: React.FC<Props> = ({ matrix }) => {
  const { assets, correlations } = matrix;

  return (
    <div className="overflow-x-auto">
      <table className="border-collapse">
        <thead>
          <tr>
            <th className="px-2 py-1 text-xs text-slate-500"></th>
            {assets.map((asset) => (
              <th
                key={asset}
                className="px-2 py-1 text-xs font-medium text-slate-400 text-center"
              >
                {asset}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {assets.map((rowAsset, i) => (
            <tr key={rowAsset}>
              <td className="px-2 py-1 text-xs font-medium text-slate-400 text-right">
                {rowAsset}
              </td>
              {assets.map((colAsset, j) => {
                const val = correlations[i][j];
                return (
                  <td
                    key={`${rowAsset}-${colAsset}`}
                    className="px-2 py-1 text-center"
                    style={{
                      backgroundColor: getHeatColor(val),
                      minWidth: 60,
                    }}
                  >
                    <span
                      className={`text-xs font-mono font-semibold ${
                        Math.abs(val) > 0.5 ? "text-white" : "text-slate-200"
                      }`}
                    >
                      {val.toFixed(2)}
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
