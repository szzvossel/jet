/**
 * RiskPivotGrid — Multi-dimensional risk analysis using AG Grid Enterprise.
 *
 * Pivot mode with row grouping by Underlying/Portfolio, drag-and-drop
 * column configuration via sidebar. Colors match the GreeksGrid above.
 */

import { useMemo } from "react";
import { AgGridReact } from "ag-grid-react";
import type { ColDef, ValueFormatterParams } from "ag-grid-community";
import { AllEnterpriseModule, ModuleRegistry } from "ag-grid-enterprise";
import type { PositionRisk } from "../../types";

ModuleRegistry.registerModules([AllEnterpriseModule]);

interface Props {
  positions: PositionRisk[];
}

function greekFormatter(params: ValueFormatterParams): string {
  if (params.value == null) return "";
  return params.value.toFixed(1);
}

function currencyFormatter(params: ValueFormatterParams): string {
  if (params.value == null) return "";
  if (Math.abs(params.value) >= 1_000_000) return `$${(params.value / 1_000_000).toFixed(1)}M`;
  if (Math.abs(params.value) >= 1_000) return `$${(params.value / 1_000).toFixed(0)}K`;
  return `$${params.value.toFixed(0)}`;
}

// Match GreeksGrid NumberDisplay colorize: green-400 positive, red-400 negative
function greekCellStyle(params: { value: number | null }): Record<string, string> {
  const val = params.value;
  if (val == null) return {};
  return {
    color: val > 0 ? "#4ade80" : val < 0 ? "#f87171" : "#94a3b8",
    fontWeight: val !== 0 ? "600" : "400",
  };
}

// Match GreeksGrid expiry colors: red-400 / amber-400 / emerald-400
function expiryCellStyle(params: { value: string | null }): Record<string, string> {
  const val = params.value;
  if (!val) return {};
  const colors: Record<string, string> = {
    "< 1M": "#f87171",
    "1M\u20133M": "#fbbf24",
    "3M+": "#34d399",
  };
  return {
    color: colors[val] ?? "#94a3b8",
    fontWeight: "600",
  };
}

export function RiskPivotGrid({ positions }: Props) {
  const columnDefs = useMemo<ColDef<PositionRisk>[]>(
    () => [
      {
        headerName: "Position",
        field: "position",
        cellStyle: { fontFamily: "var(--font-mono)", color: "#e2e8f0" } as Record<string, string>,
        filter: true,
        width: 180,
      },
      {
        headerName: "Underlying",
        field: "underlying",
        rowGroup: true,
        hide: true,
        filter: true,
      },
      {
        headerName: "Portfolio",
        field: "portfolio",
        rowGroup: true,
        hide: true,
        filter: true,
      },
      {
        headerName: "Expiry",
        field: "expiry_bucket",
        enablePivot: true,
        filter: true,
        cellStyle: expiryCellStyle,
        comparator: (a: string, b: string) => {
          const order = ["< 1M", "1M\u20133M", "3M+"];
          return order.indexOf(a) - order.indexOf(b);
        },
      },
      {
        headerName: "Qty",
        field: "quantity",
        enableValue: true,
        aggFunc: "sum",
        valueFormatter: (p: ValueFormatterParams) =>
          p.value != null ? p.value.toFixed(0) : "",
        cellStyle: { fontFamily: "var(--font-mono)", color: "#e2e8f0" } as Record<string, string>,
        width: 80,
      },
      {
        headerName: "Delta",
        field: "delta",
        enableValue: true,
        aggFunc: "sum",
        valueFormatter: greekFormatter,
        cellStyle: greekCellStyle,
        width: 100,
      },
      {
        headerName: "Gamma",
        field: "gamma",
        enableValue: true,
        aggFunc: "sum",
        valueFormatter: greekFormatter,
        cellStyle: greekCellStyle,
        width: 100,
      },
      {
        headerName: "Vega",
        field: "vega",
        enableValue: true,
        aggFunc: "sum",
        valueFormatter: greekFormatter,
        cellStyle: greekCellStyle,
        width: 100,
      },
      {
        headerName: "Theta",
        field: "theta",
        enableValue: true,
        aggFunc: "sum",
        valueFormatter: greekFormatter,
        cellStyle: greekCellStyle,
        width: 100,
      },
      {
        headerName: "Epsilon",
        field: "epsilon",
        enableValue: true,
        aggFunc: "sum",
        valueFormatter: greekFormatter,
        cellStyle: greekCellStyle,
        width: 100,
      },
      {
        headerName: "Rho",
        field: "rho",
        enableValue: true,
        aggFunc: "sum",
        valueFormatter: greekFormatter,
        cellStyle: greekCellStyle,
        width: 100,
      },
      {
        headerName: "Notional",
        field: "notional",
        enableValue: true,
        aggFunc: "sum",
        valueFormatter: currencyFormatter,
        cellStyle: { fontFamily: "var(--font-mono)", color: "#e2e8f0" } as Record<string, string>,
        width: 110,
      },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef>(
    () => ({
      sortable: true,
      resizable: true,
      filter: true,
      floatingFilter: true,
    }),
    []
  );

  return (
    <div
      className="ag-theme-alpine-dark"
      style={{ height: 720, width: "100%", overflow: "hidden" }}
    >
      <AgGridReact<PositionRisk>
        rowData={positions}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        autoGroupColumnDef={{ headerName: "Group", minWidth: 200 }}
        pivotMode={true}
        groupDefaultExpanded={2}
        animateRows={true}
        sideBar={{
          toolPanels: [
            {
              id: "columns",
              labelDefault: "Columns",
              labelKey: "columns",
              iconKey: "columns",
              toolPanel: "agColumnsToolPanel",
              toolPanelParams: {
                suppressRowGroups: false,
                suppressValues: false,
                suppressPivots: false,
                suppressPivotMode: false,
                suppressSideButtons: false,
                suppressColumnFilter: false,
                suppressColumnSelectAll: false,
                suppressColumnExpandAll: false,
              },
            },
            {
              id: "filters",
              labelDefault: "Filters",
              labelKey: "filters",
              iconKey: "filter",
              toolPanel: "agFiltersToolPanel",
            },
          ],
          defaultToolPanel: "",
          hiddenByDefault: false,
        }}
        suppressDragLeaveHidesColumns={true}
      />
    </div>
  );
}
