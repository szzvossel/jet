/**
 * PnLAttributionTable — P&L explain table with color-coded values.
 */

import React from "react";
import { SortableTable, Column } from "../shared/SortableTable";
import { NumberDisplay } from "../shared/NumberDisplay";
import type { PnlAttribution } from "../../types";

interface Props {
  positions: PnlAttribution[];
}

export const PnLAttributionTable: React.FC<Props> = ({ positions }) => {
  const columns: Column<PnlAttribution>[] = [
    {
      key: "position",
      header: "Position",
      align: "left",
      render: (val: string) => (
        <span className="font-mono text-slate-200">{val}</span>
      ),
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
      key: "total_pnl",
      header: "Total P&L",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="currency" decimals={0} colorize />
      ),
    },
    {
      key: "delta_pnl",
      header: "Delta",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="currency" decimals={0} colorize />
      ),
    },
    {
      key: "gamma_pnl",
      header: "Gamma",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="currency" decimals={0} colorize />
      ),
    },
    {
      key: "vega_pnl",
      header: "Vega",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="currency" decimals={0} colorize />
      ),
    },
    {
      key: "theta_pnl",
      header: "Theta",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="currency" decimals={0} colorize />
      ),
    },
    {
      key: "rho_pnl",
      header: "Rho",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="currency" decimals={0} colorize />
      ),
    },
    {
      key: "residual",
      header: "Residual",
      align: "right",
      render: (val: number) => (
        <NumberDisplay value={val} format="currency" decimals={0} colorize />
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
