/**
 * Reusable sortable table component with zebra striping.
 */

import React, { useState, useMemo } from "react";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  render?: (value: any, row: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
  align?: "left" | "right" | "center";
}

interface Props<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: (row: T) => string | number;
  className?: string;
}

export function SortableTable<T extends Record<string, any>>({
  columns,
  data,
  rowKey,
  className = "",
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortAsc, setSortAsc] = useState(true);

  const sortedData = useMemo(() => {
    if (!sortKey) return data;

    return [...data].sort((a, b) => {
      const aVal = a[sortKey as keyof T];
      const bVal = b[sortKey as keyof T];

      if (aVal === bVal) return 0;
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      const cmp = aVal < bVal ? -1 : 1;
      return sortAsc ? cmp : -cmp;
    });
  }, [data, sortKey, sortAsc]);

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortAsc(!sortAsc);
    } else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const getAlignClass = (align?: "left" | "right" | "center") => {
    switch (align) {
      case "right":
        return "text-right";
      case "center":
        return "text-center";
      default:
        return "text-left";
    }
  };

  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700">
            {columns.map((col) => (
              <th
                key={String(col.key)}
                className={`px-4 py-2 text-xs font-medium text-slate-400 uppercase tracking-wider ${getAlignClass(col.align)} ${
                  col.sortable !== false ? "cursor-pointer hover:text-slate-200" : ""
                }`}
                onClick={() => col.sortable !== false && handleSort(String(col.key))}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable !== false && sortKey === col.key && (
                    <span className="text-brand-400">{sortAsc ? "▲" : "▼"}</span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((row, idx) => (
            <tr
              key={rowKey(row)}
              className={`border-b border-slate-800 ${
                idx % 2 === 0 ? "bg-slate-800/30" : "bg-slate-800/10"
              } hover:bg-slate-700/30 transition-colors`}
            >
              {columns.map((col) => {
                const value = row[col.key as keyof T];
                return (
                  <td
                    key={String(col.key)}
                    className={`px-4 py-2 text-sm ${getAlignClass(col.align)} ${col.className || ""}`}
                  >
                    {col.render ? col.render(value, row) : String(value ?? "")}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
