/**
 * Shared TypeScript type definitions for CapSyncer
 *
 * This module provides centralized type definitions to follow DRY principle.
 * All components and pages should import types from this module instead of
 * defining them locally.
 *
 * @example
 * import { Coworker, TaskItem, Project, Assignment } from '@/utils/types';
 */

/**
 * Coworker (team member) entity
 * Represents a person who can be assigned to tasks
 */
export interface Coworker {
  /** Unique identifier */
  id: number;
  /** Full name of the coworker */
  name: string;
  /** Weekly capacity in hours (default: 40) */
  capacity: number;
  /** Whether the coworker is currently active (soft delete flag) */
  isActive: boolean;
}

/**
 * Project entity
 * Represents a collection of related tasks
 */
export interface Project {
  /** Unique identifier */
  id: number;
  /** Project name */
  name: string;
  /** Current project status: "Active" | "Completed" | "On Hold" */
  status: string;
  /** ISO 8601 timestamp when project was created */
  createdAt: string;
}

/**
 * Task (TaskItem) entity
 * Represents a unit of work within a project
 */
export interface TaskItem {
  /** Unique identifier */
  id: number;
  /** Task name/description */
  name: string;
  /** Associated project ID */
  projectId: number;
  /** Priority level: "Low" | "Medium" | "High" | "Critical" */
  priority: string;
  /** Current status: "To Do" | "In Progress" | "Done" | "Blocked" */
  status: string;
  /** Total estimated hours needed to complete task */
  estimatedHours: number;
  /** Hours allocated per week for this task */
  weeklyEffort: number;
  /** Optional notes about the task */
  note: string;
}

/**
 * Assignment entity
 * Represents a coworker assigned to a task for a specific week
 */
export interface Assignment {
  /** Unique identifier */
  id: number;
  /** ID of the assigned coworker */
  coworkerId: number;
  /** ID of the task being assigned */
  taskItemId: number;
  /** Number of hours assigned for this week */
  hoursAssigned: number;
  /** Optional assignment notes */
  note: string;
  /** ISO 8601 date when assignment was created */
  assignedDate: string;
  /** Name/email of person who created the assignment */
  assignedBy: string;
  /** Year of the assignment (e.g., 2026) */
  year: number;
  /** ISO week number (1-53) */
  weekNumber: number;
}

/**
 * API error response structure
 */
export interface ApiError {
  /** Error message from the server */
  error?: string;
  /** Detailed error information */
  message?: string;
  /** HTTP status code */
  status?: number;
}

/**
 * Generic API response wrapper for fetch operations
 */
export interface ApiResponse<T> {
  /** Response data (null if error occurred) */
  data: T | null;
  /** Error object (null if request succeeded) */
  error: ApiError | null;
  /** HTTP status code */
  status: number;
}
