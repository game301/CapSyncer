export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-700/50 bg-linear-to-b from-slate-800/30 to-slate-900/50">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-12">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand Section */}
          <div>
            <h2 className="mb-4 text-lg font-bold text-white">CapSyncer</h2>
            <p className="mb-4 text-sm leading-relaxed text-slate-400">
              Modern capacity management for teams. Track workload, manage
              projects, and optimize resource allocation with real-time
              analytics.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Version 1.0.0</span>
            </div>
          </div>

          {/* Features Section */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Key Features
            </h2>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Team capacity tracking</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Project & task management</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Real-time analytics</span>
              </li>
              <li className="flex items-start gap-2">
                <svg
                  className="mt-0.5 h-4 w-4 shrink-0 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span>Built-in observability</span>
              </li>
            </ul>
          </div>

          {/* Technology Section */}
          <div>
            <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-300">
              Built With
            </h2>
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
                  <span className="text-xs font-bold text-blue-400">.NET</span>
                </div>
                <div className="text-slate-400">
                  <div className="font-medium">.NET 10</div>
                  <div className="text-xs text-slate-500">ASP.NET Core</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-500/10">
                  <span className="text-xs font-bold text-purple-400">▲</span>
                </div>
                <div className="text-slate-400">
                  <div className="font-medium">Next.js 16</div>
                  <div className="text-xs text-slate-500">React 19</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/10">
                  <span className="text-xs font-bold text-cyan-400">🐘</span>
                </div>
                <div className="text-slate-400">
                  <div className="font-medium">PostgreSQL 17.6</div>
                  <div className="text-xs text-slate-500">
                    Aspire Orchestration
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 border-t border-slate-700/50 pt-8 text-center">
          <p className="text-sm text-slate-500">
            &copy; {currentYear} CapSyncer. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
