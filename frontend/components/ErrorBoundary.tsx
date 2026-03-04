"use client";

import React, { Component, ReactNode } from "react";

/**
 * ErrorBoundary Component
 *
 * Catches JavaScript errors anywhere in the React component tree,
 * logs those errors, and displays a fallback UI instead of crashing the app.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourApp />
 *   </ErrorBoundary>
 *
 * Features:
 * - Catches all React component errors
 * - Shows user-friendly error UI
 * - Logs errors with full context
 * - Allows page refresh to recover
 * - Shows detailed errors in development only
 */

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode; // Optional custom error UI
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  /**
   * Update state so the next render will show the fallback UI
   * Called during the render phase when an error is thrown
   */
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  /**
   * Log error details and send to monitoring service
   * Called during the commit phase after an error has been thrown
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    console.error("Error caught by boundary:", error, errorInfo);

    // Send to logging service (could integrate with Sentry, LogRocket, etc.)
    this.logError(error, errorInfo);

    this.setState({
      error,
      errorInfo,
    });
  }

  /**
   * Log error with context to monitoring service
   * TODO: Integrate with Sentry or other logging service in production
   *
   * Example Sentry integration:
   * import * as Sentry from '@sentry/nextjs';
   * Sentry.captureException(error, {
   *   contexts: { react: { componentStack: errorInfo.componentStack } }
   * });
   */
  logError(error: Error, errorInfo: React.ErrorInfo) {
    // In production, send to your logging service
    if (typeof window !== "undefined") {
      const errorData = {
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        timestamp: new Date().toISOString(),
        url: window.location.href,
        userAgent: navigator.userAgent,
      };

      // Log to console in development
      if (process.env.NODE_ENV === "development") {
        console.error("ErrorBoundary caught:", errorData);
      }

      // TODO: Send to logging service in production
      // Example: fetch('/api/log-error', { method: 'POST', body: JSON.stringify(errorData) });
    }
  }

  /**
   * Render either error UI or normal children
   * Shows detailed error info in development, friendly message in production
   */
  render() {
    if (this.state.hasError) {
      // Use custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-900 p-6">
          <div className="w-full max-w-md rounded-lg border border-red-500/20 bg-slate-800 p-6 shadow-xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/10">
                <svg
                  className="h-6 w-6 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-white">
                Something went wrong
              </h2>
            </div>

            {process.env.NODE_ENV === "development" && this.state.error && (
              <div className="mb-4 rounded bg-slate-900 p-3">
                <p className="mb-2 text-sm font-medium text-red-400">
                  {this.state.error.message}
                </p>
                <pre className="overflow-x-auto text-xs text-slate-400">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            <p className="mb-4 text-sm text-slate-300">
              We&apos;re sorry, but something unexpected happened. Please try
              refreshing the page.
            </p>

            <button
              onClick={() => window.location.reload()}
              className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
