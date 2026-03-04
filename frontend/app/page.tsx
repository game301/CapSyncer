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
          <div className="mb-12 text-center">
            <h1 className="text-5xl font-bold text-white">CapSyncer</h1>
            <p className="mt-4 text-xl text-slate-400">
              Team Capacity Management Dashboard
            </p>
          </div>
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
        </main>
      </div>
    </PageLayout>
  );
}
