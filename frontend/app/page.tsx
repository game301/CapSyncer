import Link from "next/link";
import { PageLayout } from "../components/PageLayout";
import type { Metadata } from "next";

export const metadata: Metadata = {
  alternates: {
    canonical: "/",
  },
};

export default function Home() {
  return (
    <PageLayout>
      <div className="flex items-center justify-center py-12">
        <main className="w-full max-w-5xl px-6 py-20">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="mb-6 text-6xl font-bold text-white md:text-7xl">
              CapSyncer
            </h1>
            <p className="mx-auto mb-12 max-w-2xl text-xl text-slate-300">
              Streamline your team&apos;s capacity planning with real-time
              tracking, intelligent project management, and comprehensive
              analytics.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                className="group flex h-14 items-center justify-center gap-2 rounded-full bg-blue-600 px-10 text-lg font-semibold text-white shadow-lg shadow-blue-500/20 transition hover:bg-blue-700 hover:shadow-blue-500/30"
                href="/dashboard"
              >
                <span>Open Dashboard</span>
                <svg
                  className="h-5 w-5 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 7l5 5m0 0l-5 5m5-5H6"
                  />
                </svg>
              </Link>
              <Link
                className="group flex h-14 items-center justify-center gap-2 rounded-full border-2 border-slate-600 bg-slate-800/50 px-10 text-lg font-semibold text-white backdrop-blur-sm transition hover:border-slate-500 hover:bg-slate-700/50"
                href="/capacity"
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
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <span>View Calendar</span>
              </Link>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="group rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-8 backdrop-blur-sm transition hover:border-slate-600">
              <div className="mb-4 inline-flex rounded-xl bg-blue-500/10 p-3">
                <svg
                  className="h-8 w-8 text-blue-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h2 className="mb-3 text-xl font-semibold text-white">
                Capacity Tracking
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">
                Monitor team workload and availability with visual calendar
                views and real-time updates.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-8 backdrop-blur-sm transition hover:border-slate-600">
              <div className="mb-4 inline-flex rounded-xl bg-purple-500/10 p-3">
                <svg
                  className="h-8 w-8 text-purple-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              </div>
              <h2 className="mb-3 text-xl font-semibold text-white">
                Project Management
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">
                Organize tasks, track progress, and manage multiple projects
                with status updates and assignments.
              </p>
            </div>

            <div className="group rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/80 to-slate-900/80 p-8 backdrop-blur-sm transition hover:border-slate-600">
              <div className="mb-4 inline-flex rounded-xl bg-green-500/10 p-3">
                <svg
                  className="h-8 w-8 text-green-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h2 className="mb-3 text-xl font-semibold text-white">
                Real-Time Analytics
              </h2>
              <p className="text-sm leading-relaxed text-slate-400">
                Built-in monitoring with OpenTelemetry and Aspire Dashboard for
                complete observability.
              </p>
            </div>
          </div>
        </main>
      </div>
    </PageLayout>
  );
}
