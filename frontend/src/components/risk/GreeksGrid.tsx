/**
 * GreeksGrid — Aggregated Greeks table for Risk View.
 */

import React from "react";
import { SortableTable, Column } from "../shared/SortableTable";
import { NumberDisplay } from "../shared/NumberDisplay";
import type { PositionRisk } from "../../types";

interface Props {
  positions: PositionRisk[];
}

export const GreeksGrid: React.FC<Props> = ({ positions }) => {
  const columns: Column<PositionRisk>[] = [
    {
      key: "position",
      header: "Position",
      align: "left",
      render: (val: string) => (
        <span className="font-mono text-slate-200">{val}</span>
      ),
    },
    {
      key: "portfolio",
      header: "Portfolio",
      align: "center",
      render: (val: string) => {
        const colors: Record<string, string> = {
          Alpha: "text-blue-400",
          Hedge: "text-amber-400",
          Yield: "text-emerald-400",
        };
        return (
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded bg-slate-800/60 ${colors[val] ?? "text-slate-400"}`}>
            {val}
          </span>
        );
      },
    },
    {
      key: "underlying",
      header: "Underlying",
      align: "center",
      render: (val: string) => (
        <span className="text-slate-400">{val}</span>
      ),
    },
    {
      key: "delta",
      header: "Delta",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="number" decimals={1} colorize />
      ),
    },
    {
      key: "gamma",
      header: "Gamma",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="number" decimals={1} colorize />
      ),
    },
    {
      key: "vega",
      header: "Vega",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="number" decimals={1} colorize />
      ),
    },
    {
      key: "epsilon",
      header: "Epsilon",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="number" decimals={1} colorize />
      ),
    },
    {
      key: "rho",
      header: "Rho",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="number" decimals={1} colorize />
      ),
    },
    {
      key: "notional",
      header: "Notional",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="currency" decimals={0} />
      ),
    },
  ];

  return (
    <SortableTable
      columns={columns}
      data={positions}
      rowKey={(row) => row.position}
    />
  );
};
