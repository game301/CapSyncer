"use client";
import { usePermissions } from "../contexts/PermissionContext";
import { Button } from "./Button";

export function RoleSwitcher() {
  const { role, setRole } = usePermissions();

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-400">Role:</span>
      <div className="flex rounded-lg border border-slate-600 bg-slate-800 p-1">
        <Button
          onClick={() => setRole("user")}
          variant={role === "user" ? "primary" : "secondary"}
          size="sm"
          className={role === "user" ? "" : "bg-transparent hover:bg-slate-700"}
        >
          User
        </Button>
        <Button
          onClick={() => setRole("admin")}
          variant={role === "admin" ? "primary" : "secondary"}
          size="sm"
          className={
            role === "admin" ? "" : "bg-transparent hover:bg-slate-700"
          }
        >
          Admin
        </Button>
      </div>
    </div>
  );
}
