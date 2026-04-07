/**
 * StrategyGrid — SortableTable display of priced option legs.
 */

import { SortableTable, Column } from "../shared/SortableTable";
import type { PricedLeg } from "../../types";

interface Props {
  legs: PricedLeg[];
}

const COLUMNS: Column<PricedLeg>[] = [
  {
    key: "symbol",
    header: "Symbol",
    align: "center",
  },
  {
    key: "expiry",
    header: "Expiry",
    align: "center",
  },
  {
    key: "strike",
    header: "Strike",
    align: "right",
    render: (v: number) => v.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
  },
  {
    key: "strike_pct",
    header: "Strike %",
    align: "right",
    render: (v: number) => `${v.toFixed(2)}%`,
  },
  {
    key: "option_type",
    header: "Type",
    align: "center",
    render: (v: string) => (
      <span className={v === "Call" ? "text-green-400" : "text-red-400"}>
        {v}
      </span>
    ),
  },
  {
    key: "style",
    header: "Style",
    align: "center",
  },
  {
    key: "quantity",
    header: "Qty",
    align: "right",
  },
  {
    key: "direction",
    header: "Direction",
    align: "center",
    render: (v: string) => (
      <span className={v === "Long" ? "text-green-400" : "text-red-400"}>
        {v}
      </span>
    ),
  },
  {
    key: "price",
    header: "Price",
    align: "right",
    render: (v: number) => v.toFixed(2),
  },
  {
    key: "delta",
    header: "Delta",
    align: "right",
    render: (v: number) => v.toFixed(4),
  },
  {
    key: "gamma",
    header: "Gamma",
    align: "right",
    render: (v: number) => v.toFixed(4),
  },
  {
    key: "vega",
    header: "Vega",
    align: "right",
    render: (v: number) => v.toFixed(4),
  },
  {
    key: "theta",
    header: "Theta",
    align: "right",
    render: (v: number) => v.toFixed(4),
  },
  {
    key: "rho",
    header: "Rho",
    align: "right",
    render: (v: number) => v.toFixed(4),
  },
];

export function StrategyGrid({ legs }: Props) {
  if (legs.length === 0) return null;

  return (
    <div className="bg-slate-800 rounded-lg border border-slate-700">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-300">
          Priced Legs
        </h2>
      </div>
      <SortableTable<PricedLeg>
        columns={COLUMNS}
        data={legs}
        rowKey={(leg) => `${leg.symbol}-${leg.strike}-${leg.option_type}-${leg.direction}`}
      />
    </div>
  );
}
