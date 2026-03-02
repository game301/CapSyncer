import React, { useState, useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortKey?: keyof T | ((item: T) => string | number); // Key to use for sorting
  sortable?: boolean; // Whether this column is sortable (default true)
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
}

export function Table<T extends { id: number }>({
  data,
  columns,
  emptyMessage = "No data available",
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);

  const handleSort = (columnIndex: number) => {
    const column = columns[columnIndex];
    if (column.sortable === false) return;

    if (sortColumn === columnIndex) {
      // Cycle through: null -> asc -> desc -> null
      if (sortDirection === null) {
        setSortDirection("asc");
      } else if (sortDirection === "asc") {
        setSortDirection("desc");
      } else {
        setSortDirection(null);
        setSortColumn(null);
      }
    } else {
      setSortColumn(columnIndex);
      setSortDirection("asc");
    }
  };

  const sortedData = useMemo(() => {
    if (sortColumn === null || sortDirection === null) {
      return data;
    }

    const column = columns[sortColumn];
    const sortKey = column.sortKey || column.accessor;

    return [...data].sort((a, b) => {
      let aVal: any;
      let bVal: any;

      if (typeof sortKey === "function") {
        aVal = sortKey(a);
        bVal = sortKey(b);
      } else {
        aVal = a[sortKey];
        bVal = b[sortKey];
      }

      // Handle null/undefined values
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      // Convert to lowercase for string comparison
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
      if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });
  }, [data, sortColumn, sortDirection, columns]);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
        <p className="text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-lg border border-slate-700 bg-slate-800">
      <table className="w-full">
        <thead>
          <tr className="border-b border-slate-700 bg-slate-900/50">
            {columns.map((col, idx) => (
              <th
                key={idx}
                onClick={() => handleSort(idx)}
                className={`px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                  col.sortable !== false ? "cursor-pointer hover:text-slate-200 select-none" : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{col.header}</span>
                  {col.sortable !== false && sortColumn === idx && (
                    <span className="text-blue-400">
                      {sortDirection === "asc" ? "↑" : sortDirection === "desc" ? "↓" : ""}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {sortedData.map((item) => (
            <tr
              key={item.id}
              className="transition-colors hover:bg-slate-700/30"
            >
              {columns.map((col, idx) => (
                <td
                  key={idx}
                  className={`px-6 py-4 text-sm text-slate-300 ${col.className || ""}`}
                >
                  {typeof col.accessor === "function"
                    ? col.accessor(item)
                    : String(item[col.accessor])}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
