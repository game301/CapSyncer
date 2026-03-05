/**
 * Application configuration and constants
 *
 * Centralizes environment-dependent configuration values to follow DRY principle.
 * All pages should import from this module instead of reading process.env directly.
 */

/**
 * Backend API base URL
 * Reads from NEXT_PUBLIC_API_BASEURL environment variable
 * Falls back to localhost:5128 for development
 *
 * Usage:
 *   import { API_BASE_URL } from '@/utils/config';
 *   const response = await fetch(`${API_BASE_URL}/api/coworkers`);
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

/**
 * Frontend base URL for SEO and canonical URLs
 * Reads from NEXT_PUBLIC_BASE_URL environment variable
 * Falls back to localhost:3000 for development
 */
export const BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

/**
 * Application name shown in metadata and UI
 */
export const APP_NAME = "CapSyncer";

/**
 * Application description for SEO
 */
export const APP_DESCRIPTION =
  "CapSyncer is a team capacity management system for tracking projects, tasks, and team member assignments. Optimize your team's workload and delivery timelines.";
