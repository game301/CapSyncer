import React from "react";

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
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
                className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-slate-400"
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {data.map((item) => (
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
