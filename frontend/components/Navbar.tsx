import Link from "next/link";
import { UserSettings } from "./UserSettings";

export function Navbar() {
  return (
    <nav className="border-b border-slate-700 bg-slate-800/95 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto max-w-7xl px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 transition hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600">
              <span className="text-xl font-bold text-white">CS</span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CapSyncer</h1>
              <p className="text-xs text-slate-400">Capacity Management</p>
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <UserSettings />
          </div>
        </div>
      </div>
    </nav>
  );
}
