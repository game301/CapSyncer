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
      <div className="flex items-center justify-center py-20">
        <main className="w-full max-w-3xl px-16 py-32">
          {/* Hero Section */}
          <div className="mb-16 text-center">
            <h1 className="text-5xl font-bold text-white">CapSyncer</h1>
            <p className="mt-4 text-xl text-slate-400">
              Team Capacity Management Dashboard
            </p>
          </div>

          {/* Quick Actions */}
          <section className="mb-16">
            <h2 className="sr-only">Quick Navigation</h2>
            <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Link
                className="flex h-12 items-center justify-center rounded-full bg-blue-600 px-8 font-medium text-white transition hover:bg-blue-700"
                href="/dashboard"
              >
                Go to Dashboard
              </Link>
              <Link
                className="flex h-12 items-center justify-center rounded-full bg-purple-600 px-8 font-medium text-white transition hover:bg-purple-700"
                href="/capacity"
              >
                Go to Calendar
              </Link>
            </div>
          </section>

          {/* Features Overview */}
          <section className="text-center">
            <h2 className="mb-8 text-2xl font-semibold text-white">
              Key Features
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="mb-2 text-lg font-medium text-white">
                  Capacity Tracking
                </h3>
                <p className="text-sm text-slate-400">
                  Monitor team workload and availability in real-time with
                  visual calendar views.
                </p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="mb-2 text-lg font-medium text-white">
                  Project Management
                </h3>
                <p className="text-sm text-slate-400">
                  Track multiple projects with status updates and task
                  organization.
                </p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="mb-2 text-lg font-medium text-white">
                  Team Collaboration
                </h3>
                <p className="text-sm text-slate-400">
                  Assign tasks to team members and track progress across all
                  projects.
                </p>
              </div>
              <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-6">
                <h3 className="mb-2 text-lg font-medium text-white">
                  Real-Time Monitoring
                </h3>
                <p className="text-sm text-slate-400">
                  Built-in observability with OpenTelemetry and Aspire Dashboard
                  integration.
                </p>
              </div>
            </div>
          </section>
        </main>
      </div>
    </PageLayout>
  );
}
