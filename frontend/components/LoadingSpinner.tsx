/**
 * LoadingSpinner - Reusable loading indicator component
 *
 * Provides consistent loading UI across the application.
 * Follows SOLID principles with single responsibility (showing loading state).
 *
 * Usage:
 *   <LoadingSpinner message="Loading data..." />
 *   <LoadingSpinner size="lg" />
 *   <LoadingSpinner fullScreen />
 */

interface LoadingSpinnerProps {
  /**
   * Optional message to display below spinner
   * @default "Loading..."
   */
  message?: string;

  /**
   * Size of the spinner
   * @default "md"
   */
  size?: "sm" | "md" | "lg";

  /**
   * Whether to center in full viewport (for page-level loading)
   * @default false
   */
  fullScreen?: boolean;

  /**
   * Additional CSS classes
   */
  className?: string;
}

export function LoadingSpinner({
  message = "Loading...",
  size = "md",
  fullScreen = false,
  className = "",
}: LoadingSpinnerProps) {
  // Size mapping
  const sizeClasses = {
    sm: "h-8 w-8 border-2",
    md: "h-12 w-12 border-4",
    lg: "h-16 w-16 border-4",
  };

  const spinner = (
    <div
      className={`${sizeClasses[size]} animate-spin rounded-full border-slate-700 border-t-blue-500 mx-auto`}
    ></div>
  );

  const content = (
    <div className={`text-center ${className}`}>
      {spinner}
      {message && <p className="text-slate-400 mt-4">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        {content}
      </div>
    );
  }

  return content;
}

/**
 * LoadingPage - Full page loading state with PageLayout
 *
 * Use this for pages that need loading state with proper layout.
 *
 * @example
 * if (loading) return <LoadingPage message="Loading project details..." />;
 */
import { PageLayout } from "./PageLayout";

interface LoadingPageProps {
  message?: string;
}

export function LoadingPage({ message }: LoadingPageProps) {
  return (
    <PageLayout>
      <LoadingSpinner fullScreen message={message} />
    </PageLayout>
  );
}
