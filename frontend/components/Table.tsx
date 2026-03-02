import React, { useState, useMemo } from "react";

type SortDirection = "asc" | "desc" | null;

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  sortKey?: keyof T | ((item: T) => string | number); // Key to use for sorting
  sortable?: boolean; // Whether this column is sortable (default true)
  searchable?: boolean; // Whether this column is searchable (default true)
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
        <button
          onClick={() => onChange("")}
          className="absolute right-3 top-2.5 text-slate-500 hover:text-slate-300"
        >
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
        </button>
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
  onSearchChange,
}: TableProps<T>) {
  const [sortColumn, setSortColumn] = useState<number | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>(null);
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  
  // Use external search state if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = onSearchChange || setInternalSearchQuery;

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
        return columns.some((col, idx) => {
          if (col.searchable === false) return false;
          
          const sortKey = col.sortKey || col.accessor;
          let value: any;
          
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
              {filteredAndSortedData.map((item) => (
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
      )}
    </div>
  );
}

// Hook to manage search state for tables
export function useTableSearch(initialValue = "") {
  const [searchQuery, setSearchQuery] = useState(initialValue);
  return { searchQuery, setSearchQuery };
}
