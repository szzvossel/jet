/**
 * LogEventTable — Sortable event viewer with level filter and pagination.
 */

import React, { useState, useEffect } from "react";
import { SortableTable, type Column } from "../shared/SortableTable";
import { fetchTracerEvents } from "../../hooks/usePricing";
import type { LogEvent, LogLevel } from "../../types";

const LEVEL_OPTIONS: Array<LogLevel | "ALL"> = [
  "ALL",
  "ERROR",
  "WARN",
  "INFO",
  "DEBUG",
  "TRACE",
];

const LEVEL_BADGE_COLORS: Record<string, string> = {
  TRACE: "bg-slate-700 text-slate-300",
  DEBUG: "bg-blue-900 text-blue-300",
  INFO: "bg-green-900 text-green-300",
  WARN: "bg-yellow-900 text-yellow-300",
  ERROR: "bg-red-900 text-red-300",
};

const PAGE_SIZE = 50;

export const LogEventTable: React.FC = () => {
  const [events, setEvents] = useState<LogEvent[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [levelFilter, setLevelFilter] = useState<LogLevel | "ALL">("ALL");
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetchTracerEvents(page, PAGE_SIZE)
      .then((result) => {
        setEvents(result.events);
        setTotalCount(result.total_count);
        setHasMore(result.has_more);
      })
      .catch(console.error);
  }, [page]);

  const filtered =
    levelFilter === "ALL"
      ? events
      : events.filter((e) => e.level === levelFilter);

  const columns: Column<LogEvent>[] = [
    {
      key: "timestamp",
      header: "Timestamp",
      className: "font-mono text-xs",
      render: (val: string) => {
        const timeOnly = val.length >= 19 ? val.slice(11, 19) : val;
        return timeOnly;
      },
    },
    {
      key: "level",
      header: "Level",
      align: "center",
      render: (val: LogLevel) => (
        <span
          className={`px-1.5 py-0.5 rounded text-xs font-semibold ${LEVEL_BADGE_COLORS[val] ?? "bg-slate-700 text-slate-300"}`}
        >
          {val}
        </span>
      ),
    },
    {
      key: "source_name",
      header: "Source",
      className: "text-xs",
    },
    {
      key: "message",
      header: "Message",
      className: "text-xs text-slate-400 max-w-md truncate",
    },
    {
      key: "tracer_id",
      header: "Tracer ID",
      className: "font-mono text-xs",
      align: "right",
      render: (val: number | null) => val?.toString() ?? "-",
    },
    {
      key: "elapsed_ms",
      header: "Latency",
      className: "font-mono text-xs",
      align: "right",
      render: (val: number | null) =>
        val != null ? `${val}ms` : "-",
    },
  ];

  return (
    <div>
      {/* Filter bar */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-slate-500">Filter:</span>
        {LEVEL_OPTIONS.map((level) => (
          <button
            key={level}
            onClick={() => setLevelFilter(level)}
            className={`px-2 py-1 text-xs rounded font-medium transition-colors ${
              levelFilter === level
                ? "bg-brand-600 text-white"
                : "bg-slate-700 text-slate-400 hover:bg-slate-600"
            }`}
          >
            {level}
          </button>
        ))}
        <span className="ml-auto text-xs text-slate-500">
          {filtered.length} of {totalCount} events
        </span>
      </div>

      {/* Table */}
      <SortableTable<LogEvent>
        columns={columns}
        data={filtered}
        rowKey={(row) => `${row.timestamp}-${row.thread_id}-${row.message}`}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <span className="text-xs text-slate-500">
          Page {page + 1} ({totalCount} total)
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
          className="px-3 py-1 text-xs bg-slate-700 text-slate-300 rounded hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  );
};
