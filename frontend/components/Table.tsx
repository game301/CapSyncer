import React, { useState, useMemo } from "react";
import { Button } from "./Button";

type SortDirection = "asc" | "desc" | null;

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortKey?: keyof T | ((item: T) => string | number); // Key to use for sorting
  sortable?: boolean; // Whether this column is sortable (default true)
  searchable?: boolean; // Whether this column is searchable (default true)
  customSortOrder?: string[]; // Custom sort order for specific values (e.g., status progression)
}

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}: SearchInputProps) {
  return (
    <div className={`relative ${className}`}>
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 pl-10 text-sm text-slate-300 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <svg
        className="absolute left-3 top-2.5 h-5 w-5 text-slate-500"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
      </svg>
      {value && (
        <Button
          onClick={() => onChange("")}
          variant="secondary"
          size="icon"
          className="absolute right-3 top-2.5 bg-transparent hover:bg-slate-700"
          icon={
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          }
        />
      )}
    </div>
  );
}

interface TableProps<T> {
  data: T[];
  columns: Column<T>[];
  emptyMessage?: string;
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
}

export function Table<T extends { id: number }>({
  data,
  columns,
  emptyMessage = "No data available",
  searchQuery: externalSearchQuery,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [internalSearchQuery] = useState("");

  // Use external search state if provided, otherwise use internal state
  const searchQuery =
    externalSearchQuery !== undefined
      ? externalSearchQuery
      : internalSearchQuery;

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

  const filteredAndSortedData = useMemo(() => {
    // First, filter the data based on search query
    let filtered = data;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = data.filter((item) => {
        return columns.some((col) => {
          if (col.searchable === false) return false;

          const sortKey = col.sortKey || col.accessor;
          let value: unknown;

          if (typeof sortKey === "function") {
            value = sortKey(item);
          } else {
            value = item[sortKey];
          }

          if (value == null) return false;

          return String(value).toLowerCase().includes(query);
        });
      });
    }

    // Then, sort the filtered data
    if (sortColumn === null || sortDirection === null) {
      return filtered;
    }

    const column = columns[sortColumn];
    const sortKey = column.sortKey || column.accessor;

    return [...filtered].sort((a, b) => {
      let aVal: unknown;
      let bVal: unknown;

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

      // Use custom sort order if provided
      if (
        column.customSortOrder &&
        typeof aVal === "string" &&
        typeof bVal === "string"
      ) {
        const aValLower = aVal.toLowerCase();
        const bValLower = bVal.toLowerCase();
        const orderLower = column.customSortOrder.map((s) => s.toLowerCase());

        const aIndex = orderLower.indexOf(aValLower);
        const bIndex = orderLower.indexOf(bValLower);

        // If both values are in the custom order
        if (aIndex !== -1 && bIndex !== -1) {
          return sortDirection === "asc" ? aIndex - bIndex : bIndex - aIndex;
        }
        // If only aVal is in the custom order, it comes first
        if (aIndex !== -1) return -1;
        // If only bVal is in the custom order, it comes first
        if (bIndex !== -1) return 1;
        // If neither is in the custom order, fall through to regular sorting
      }

      // Convert to lowercase for string comparison
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();

      // Compare values with proper type checking
      if (typeof aVal === "number" && typeof bVal === "number") {
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      } else if (typeof aVal === "string" && typeof bVal === "string") {
        if (aVal < bVal) return sortDirection === "asc" ? -1 : 1;
        if (aVal > bVal) return sortDirection === "asc" ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortColumn, sortDirection, columns, searchQuery]);

  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
        <p className="text-slate-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div>
      {filteredAndSortedData.length === 0 ? (
        <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
          <p className="text-slate-400">
            {searchQuery ? "No results found" : emptyMessage}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-700 bg-slate-800 scrollbar-thin -mx-6 sm:mx-0">
          <div className="inline-block min-w-full align-middle">
            <table className="min-w-full divide-y divide-slate-700">
              <thead>
                <tr className="border-b border-slate-700 bg-slate-900/50">
                  {columns.map((col, idx) => (
                    <th
                      key={idx}
                      onClick={() => handleSort(idx)}
                      className={`px-3 py-3 sm:px-6 sm:py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400 ${
                        col.sortable !== false
                          ? "cursor-pointer hover:text-slate-200 select-none"
                          : ""
                      }`}
                    >
                      <div className="flex items-center gap-1 sm:gap-2">
                        <span>{col.header}</span>
                        {col.sortable !== false && (
                          <span
                            className={`text-blue-400 transition-opacity ${
                              sortColumn === idx ? "opacity-100" : "opacity-0"
                            }`}
                          >
                            {sortColumn === idx
                              ? sortDirection === "asc"
                                ? "↑"
                                : sortDirection === "desc"
                                  ? "↓"
                                  : "↑"
                              : "↑"}
                          </span>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredAndSortedData.map((item) => (
                  <tr
                    key={item.id}
                    className="transition-colors hover:bg-slate-700/30"
                  >
                    {columns.map((col, idx) => (
                      <td
                        key={idx}
                        className={`px-3 py-3 sm:px-6 sm:py-4 text-xs sm:text-sm text-slate-300 ${col.className || ""}`}
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
        </div>
      )}
    </div>
  );
}

// Hook to manage search state for tables
export function useTableSearch(initialValue = "") {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  return { searchQuery, setSearchQuery };
}
