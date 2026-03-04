/**
 * Logger utility for client-side logging and monitoring
 *
 * Provides centralized logging for the frontend application with:
 * - Structured log formatting (timestamp, level, message, context)
 * - Automatic environment detection (dev vs production)
 * - Console output in development
 * - Integration points for external services (Sentry, LogRocket, etc.)
 * - Special helpers for API and network errors
 *
 * Usage Examples:
 *
 * Basic logging:
 *   logger.info('User logged in', { userId: 123 });
 *   logger.warn('API rate limit approaching', { remaining: 5 });
 *   logger.error('Failed to save', error, { taskId: 456 });
 *
 * API error logging:
 *   logger.logApiError('/api/tasks', 'POST', 500, error);
 *   logger.logFetchError('/api/coworkers', networkError);
 *
 * Fetch with automatic logging:
 *   const response = await fetchWithLogging('/api/tasks');
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
  [key: string]: unknown;
}

/**
 * Logger class - handles all client-side logging
 * Singleton pattern: use exported `logger` instance
 */
class Logger {
  /** Tracks if running in development (shows all logs) or production (errors only) */
  private isDevelopment = process.env.NODE_ENV === "development";

  /**
   * Log informational messages
   * Use for: User actions, state changes, successful operations
   * Examples: "Task created", "Filter applied", "Data loaded"
   */
  info(message: string, context?: LogContext) {
    this.log("info", message, context);
  }

  /**
   * Log warning messages
   * Use for: Recoverable errors, deprecated features, approaching limits
   * Examples: "API rate limit approaching", "Deprecated field used", "Slow query"
   */
  warn(message: string, context?: LogContext) {
    this.log("warn", message, context);
  }

  /**
   * Log error messages with full error details
   * Use for: Exceptions, failed operations, validation errors
   * Examples: "Save failed", "API timeout", "Parse error"
   *
   * Automatically extracts error name, message, and stack trace if Error object provided
   */
  error(message: string, error?: Error | unknown, context?: LogContext) {
    const errorContext = {
      ...context,
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
    };

    this.log("error", message, errorContext);
  }

  /**
   * Log debug messages (only in development mode)
   * Use for: Verbose logging, troubleshooting, development-only info
   * Examples: "Render count: 5", "Cache hit", "State before update"
   *
   * These logs are NEVER shown in production
   */
  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      this.log("debug", message, context);
    }
  }

  /**
   * Log API errors with request/response details
   * Use for: HTTP errors (4xx, 5xx), API validation errors, timeout errors
   *
   * @param endpoint The API endpoint path (e.g., '/api/tasks')
   * @param method HTTP method ('GET', 'POST', etc.)
   * @param statusCode HTTP status code (400, 500, etc.)
   * @param error The error object or message
   * @param context Additional context (request body, query params, etc.)
   *
   * Example:
   *   logger.logApiError('/api/tasks', 'POST', 500, error, { taskId: 123 });
   */
  logApiError(
    endpoint: string,
    method: string,
    statusCode: number,
    error: Error | unknown,
    context?: LogContext,
  ) {
    this.error(`API Error: ${method} ${endpoint} - ${statusCode}`, error, {
      endpoint,
      method,
      statusCode,
      ...context,
    });
  }

  /**
   * Log fetch errors (network issues, timeout, abort, etc.)
   * Use for: Network failures, CORS errors, DNS issues, aborted requests
   *
   * @param endpoint The API endpoint that failed
   * @param error The error object (usually TypeError for network issues)
   * @param context Additional context
   *
   * Example:
   *   catch (error) {
   *     logger.logFetchError('/api/coworkers', error);
   *   }
   */
  logFetchError(
    endpoint: string,
    error: Error | unknown,
    context?: LogContext,
  ) {
    this.error(`Network Error: ${endpoint}`, error, {
      endpoint,
      type: "network",
      ...context,
    });
  }

  /**
   * Internal logging implementation
   * Formats log with timestamp, level, and context
   * Routes to console and optionally external service
   */
  private log(level: LogLevel, message: string, context?: LogContext) {
    const timestamp = new Date().toISOString();
    const logData = {
      timestamp,
      level,
      message,
      ...context,
      url: typeof window !== "undefined" ? window.location.href : undefined,
      userAgent:
        typeof window !== "undefined" ? navigator.userAgent : undefined,
    };

    // Console logging (always in development, errors only in production)
    if (this.isDevelopment || level === "error") {
      const consoleMethod =
        level === "error"
          ? console.error
          : level === "warn"
            ? console.warn
            : level === "debug"
              ? console.debug
              : console.log;

      consoleMethod(`[${level.toUpperCase()}] ${message}`, context || "");
    }

    // Send to external logging service in production
    if (!this.isDevelopment && level === "error") {
      this.sendToLoggingService(logData);
    }
  }

  /**
   * Send logs to external logging service
   * TODO: Implement integration with your logging service (Sentry, LogRocket, etc.)
   *
   * This method is called for all errors in production to persist them.
   * Intentionally swallows errors to prevent logging from breaking the app.
   *
   * Example implementations:
   * 1. Backend endpoint: POST to /api/log
   * 2. Sentry: Sentry.captureException()
   * 3. LogRocket: LogRocket.captureException()
   * 4. Application Insights: appInsights.trackException()
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  private sendToLoggingService(_logData: Record<string, unknown>) {
    // Example: Send to your backend logging endpoint
    // fetch('/api/log', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(_logData),
    // }).catch(() => {
    //   // Silently fail - don't want logging to break the app
    // });
    // Or integrate with Sentry, LogRocket, etc.
    // Sentry.captureException(_logData);
  }
}

// Export singleton instance
export const logger = new Logger();

/**
 * Helper function to handle API fetch with automatic error logging
 *
 * Wraps native fetch() with automatic logging for success and failures:
 * - Logs request details in debug mode
 * - Logs non-2xx responses as API errors
 * - Logs network failures (timeouts, DNS issues) as fetch errors
 *
 * Usage:
 *   const response = await fetchWithLogging('/api/tasks', { method: 'GET' });
 *   const data = await response.json();
 */
export async function fetchWithLogging(
  url: string,
  options?: RequestInit,
): Promise<Response> {
  const method = options?.method || "GET";

  try {
    logger.debug(`API Request: ${method} ${url}`);

    const response = await fetch(url, options);

    if (!response.ok) {
      logger.logApiError(
        url,
        method,
        response.status,
        new Error(`HTTP ${response.status}`),
      );
    }

    return response;
  } catch (error) {
    logger.logFetchError(url, error);
    throw error;
  }
}
