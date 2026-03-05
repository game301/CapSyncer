"use client";

import Link from "next/link";
import { useState } from "react";
import { UserSettings } from "./UserSettings";

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b border-slate-700 bg-slate-800/95 backdrop-blur sticky top-0 z-50">
      <div className="mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 transition hover:opacity-80"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 shrink-0">
              <span className="text-xl font-bold text-white">CS</span>
            </div>
            <div className="hidden xs:block">
              <h1 className="text-xl font-bold text-white">CapSyncer</h1>
              <p className="text-xs text-slate-400">Capacity Management</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              href="/dashboard"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <Link
              href="/capacity"
              className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-purple-700"
            >
              Calendar
            </Link>
            <UserSettings />
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden flex items-center justify-center rounded-lg bg-slate-700 p-2 text-white transition hover:bg-slate-600"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden mt-4 pt-4 border-t border-slate-700 space-y-3">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg bg-blue-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-blue-700"
            >
              Dashboard
            </Link>
            <Link
              href="/capacity"
              onClick={() => setMobileMenuOpen(false)}
              className="block rounded-lg bg-purple-600 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-purple-700"
            >
              Calendar
            </Link>
            <div className="pt-2">
              <UserSettings />
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
