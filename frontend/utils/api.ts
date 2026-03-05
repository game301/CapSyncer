/**
 * API client utilities for CapSyncer
 *
 * Provides reusable fetch wrappers with standardized error handling,
 * logging, and response parsing following DRY principle.
 *
 * @example
 * import { apiGet, apiPost, apiPut, apiDelete } from '@/utils/api';
 *
 * const { data, error } = await apiGet<Coworker[]>('/api/coworkers');
 * if (error) {
 *   showToast({ message: error.message, type: 'error' });
 * }
 */

import { API_BASE_URL } from "./config";
import { logger } from "./logger";
import type { ApiResponse, ApiError } from "./types";

/**
 * Default headers for all API requests
 */
const DEFAULT_HEADERS = {
  "Content-Type": "application/json",
};

/**
 * Parse error response from fetch
 */
async function parseError(response: Response): Promise<ApiError> {
  try {
    const errorData = await response.json();
    return {
      error: errorData.error || errorData.message || response.statusText,
      message: errorData.message || response.statusText,
      status: response.status,
    };
  } catch {
    return {
      error: response.statusText || "Unknown error",
      message: response.statusText || "Unknown error occurred",
      status: response.status,
    };
  }
}

/**
 * Generic fetch wrapper with error handling and logging
 */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse<T>> {
  const url = `${API_BASE_URL}${endpoint}`;
  const startTime = performance.now();

  try {
    logger.debug("API request", {
      method: options.method || "GET",
      endpoint,
      url,
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        ...DEFAULT_HEADERS,
        ...options.headers,
      },
    });

    const duration = performance.now() - startTime;

    if (!response.ok) {
      const error = await parseError(response);
      logger.warn("API request failed", {
        endpoint,
        status: response.status,
        error: error.message,
        duration,
      });

      return {
        data: null,
        error,
        status: response.status,
      };
    }

    // Handle 204 No Content responses
    if (response.status === 204) {
      logger.info("API request succeeded", {
        endpoint,
        status: 204,
        duration,
      });

      return {
        data: null as T,
        error: null,
        status: 204,
      };
    }

    const data = await response.json();
    logger.info("API request succeeded", {
      endpoint,
      status: response.status,
      duration,
    });

    return {
      data,
      error: null,
      status: response.status,
    };
  } catch (err) {
    const duration = performance.now() - startTime;
    const error: ApiError = {
      error: "Network error",
      message: err instanceof Error ? err.message : "Network request failed",
      status: 0,
    };

    logger.error("API request failed", {
      endpoint,
      error: error.message,
      duration,
    });

    return {
      data: null,
      error,
      status: 0,
    };
  }
}

/**
 * GET request
 *
 * @example
 * const { data, error } = await apiGet<Coworker[]>('/api/coworkers');
 * if (data) {
 *   setCoworkers(data);
 * }
 */
export async function apiGet<T>(endpoint: string): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, { method: "GET" });
}

/**
 * POST request
 *
 * @example
 * const { data, error } = await apiPost<Coworker>('/api/coworkers', {
 *   name: 'John Doe',
 *   capacity: 40,
 *   isActive: true
 * });
 */
export async function apiPost<T>(
  endpoint: string,
  body: unknown,
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/**
 * PUT request
 *
 * @example
 * const { data, error } = await apiPut<Coworker>('/api/coworkers/1', {
 *   id: 1,
 *   name: 'John Smith',
 *   capacity: 40,
 *   isActive: true
 * });
 */
export async function apiPut<T>(
  endpoint: string,
  body: unknown,
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 *
 * @example
 * const { error } = await apiDelete('/api/coworkers/1');
 * if (!error) {
 *   showToast({ message: 'Deleted successfully', type: 'success' });
 * }
 */
export async function apiDelete(endpoint: string): Promise<ApiResponse<null>> {
  return apiFetch<null>(endpoint, { method: "DELETE" });
}

/**
 * Helper to check if an API response has an error
 *
 * @example
 * const response = await apiGet<Coworker[]>('/api/coworkers');
 * if (hasError(response)) {
 *   showToast({ message: response.error.message, type: 'error' });
 *   return;
 * }
 * // TypeScript knows response.data is not null here
 */
export function hasError<T>(
  response: ApiResponse<T>,
): response is ApiResponse<T> & { error: ApiError } {
  return response.error !== null;
}
