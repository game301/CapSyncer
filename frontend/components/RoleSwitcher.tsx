"use client";
import { usePermissions } from "../contexts/PermissionContext";

export function RoleSwitcher() {
  const { role, setRole } = usePermissions();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">Role:</span>
      <div className="flex rounded-lg border border-slate-600 bg-slate-800 p-1">
        <button
          onClick={() => setRole("user")}
          className={`rounded px-3 py-1 text-sm font-medium transition ${
            role === "user"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          User
        </button>
        <button
          onClick={() => setRole("admin")}
          className={`rounded px-3 py-1 text-sm font-medium transition ${
            role === "admin"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Admin
        </button>
      </div>
    </div>
  );
}
