export function Footer() {
  return (
    <footer className="border-t border-slate-700 bg-slate-800/50">
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">CapSyncer</h3>
            <p className="text-sm text-slate-400">
              Modern capacity management for teams. Track workload, manage
              projects, and optimize resource allocation.
            </p>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">Features</h3>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>Team capacity tracking</li>
              <li>Project management</li>
              <li>Task assignment</li>
              <li>Real-time analytics</li>
            </ul>
          </div>
          <div>
            <h3 className="mb-3 text-sm font-semibold text-white">About</h3>
            <p className="text-sm text-slate-400">
              Built with ASP.NET Core, Next.js, and PostgreSQL. Orchestrated
              with .NET Aspire.
            </p>
            <p className="mt-4 text-xs text-slate-500">
              &copy; {new Date().getFullYear()} CapSyncer. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
