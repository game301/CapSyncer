import Link from "next/link";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700 bg-slate-800/50">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 md:grid-cols-4">
          {/* About Section */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-white">CapSyncer</h2>
            <p className="text-sm text-slate-400">
              Modern capacity management for teams. Track workload, manage
              projects, and optimize resource allocation.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              v1.0.0 &middot; {currentYear}
            </p>
          </div>

          {/* Navigation Links */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-white">
              Navigation
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/dashboard"
                  className="text-slate-400 transition hover:text-white"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <Link
                  href="/capacity"
                  className="text-slate-400 transition hover:text-white"
                >
                  Capacity Calendar
                </Link>
              </li>
              <li>
                <Link
                  href="/api-demo-page"
                  className="text-slate-400 transition hover:text-white"
                >
                  API Demo
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-white">Resources</h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a
                  href="https://github.com/game301/CapSyncer"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 transition hover:text-white"
                >
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="/api/status"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 transition hover:text-white"
                >
                  API Status
                </a>
              </li>
              <li>
                <a
                  href="https://learn.microsoft.com/dotnet/aspire"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-slate-400 transition hover:text-white"
                >
                  .NET Aspire Docs
                </a>
              </li>
            </ul>
          </div>

          {/* Tech Stack */}
          <div>
            <h2 className="mb-3 text-sm font-semibold text-white">
              Technology
            </h2>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>.NET 10 + ASP.NET Core</li>
              <li>Next.js 16 + React 19</li>
              <li>PostgreSQL 17</li>
              <li>.NET Aspire 13</li>
              <li>OpenTelemetry</li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-8 border-t border-slate-700 pt-6">
          <div className="flex flex-col items-center justify-between gap-4 text-xs text-slate-500 md:flex-row">
            <p>
              &copy; {currentYear} CapSyncer. Built with
              <span className="mx-1 text-red-400">&hearts;</span>
              by game301.
            </p>
            <div className="flex gap-4">
              <a
                href="/health"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-slate-300"
              >
                Health Status
              </a>
              <span className="text-slate-700">|</span>
              <a
                href="https://github.com/game301/CapSyncer/blob/main/LICENSE"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-slate-300"
              >
                License
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
