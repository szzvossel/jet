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

const LEVEL_BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  TRACE: { bg: "rgba(71, 85, 105, 0.3)", text: "#94a3b8" },
  DEBUG: { bg: "rgba(59, 130, 246, 0.15)", text: "#60a5fa" },
  INFO: { bg: "rgba(34, 197, 94, 0.15)", text: "#4ade80" },
  WARN: { bg: "rgba(234, 179, 8, 0.15)", text: "#facc15" },
  ERROR: { bg: "rgba(239, 68, 68, 0.15)", text: "#f87171" },
};

const LEVEL_FILTER_COLORS: Record<string, string> = {
  ALL: "#6366f1",
  TRACE: "#64748b",
  DEBUG: "#3b82f6",
  INFO: "#22c55e",
  WARN: "#eab308",
  ERROR: "#ef4444",
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
      render: (val: LogLevel) => {
        const style = LEVEL_BADGE_STYLES[val] ?? LEVEL_BADGE_STYLES.TRACE;
        return (
          <span
            className="px-1.5 py-0.5 rounded text-xs font-semibold"
            style={{ backgroundColor: style.bg, color: style.text }}
          >
            {val}
          </span>
        );
      },
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
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-slate-500">Filter:</span>
        {LEVEL_OPTIONS.map((level) => (
          <button
            key={level}
            onClick={() => setLevelFilter(level)}
            className="px-2 py-1 text-xs rounded font-medium transition-all duration-150"
            style={{
              backgroundColor:
                levelFilter === level
                  ? (LEVEL_FILTER_COLORS[level] ?? "#6366f1") + "20"
                  : "transparent",
              color:
                levelFilter === level
                  ? LEVEL_FILTER_COLORS[level] ?? "#6366f1"
                  : "#64748b",
              border:
                levelFilter === level
                  ? `1px solid ${(LEVEL_FILTER_COLORS[level] ?? "#6366f1")}40`
                  : "1px solid transparent",
            }}
          >
            {level}
          </button>
        ))}
        <span className="ml-auto text-xs font-mono" style={{ color: "#64748b" }}>
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
      <div className="flex items-center justify-between mt-3">
        <button
          onClick={() => setPage(Math.max(0, page - 1))}
          disabled={page === 0}
          className="px-3 py-1 text-xs rounded font-medium transition-all duration-150"
          style={{
            backgroundColor: page === 0 ? "rgba(30, 41, 59, 0.5)" : "rgba(51, 65, 85, 0.5)",
            color: page === 0 ? "#475569" : "#cbd5e1",
            cursor: page === 0 ? "not-allowed" : "pointer",
          }}
        >
          Previous
        </button>
        <span className="text-xs font-mono" style={{ color: "#64748b" }}>
          Page {page + 1} ({totalCount} total)
        </span>
        <button
          onClick={() => setPage(page + 1)}
          disabled={!hasMore}
          className="px-3 py-1 text-xs rounded font-medium transition-all duration-150"
          style={{
            backgroundColor: !hasMore ? "rgba(30, 41, 59, 0.5)" : "rgba(51, 65, 85, 0.5)",
            color: !hasMore ? "#475569" : "#cbd5e1",
            cursor: !hasMore ? "not-allowed" : "pointer",
          }}
        >
          Next
        </button>
      </div>
    </div>
  );
};
