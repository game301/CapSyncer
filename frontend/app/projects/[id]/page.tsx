"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { PageLayout } from "../../../components/PageLayout";
import { Button } from "../../../components/Button";
import { Table } from "../../../components/Table";
import { Modal } from "../../../components/Modal";
import { Input, Select, Textarea } from "../../../components/FormInputs";
import { usePermissions } from "../../../contexts/PermissionContext";
import { Toast, useToast } from "../../../components/Toast";
import { ProgressBar } from "../../../components/ProgressBar";

const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const STATUSES = ["Not started", "In progress", "Completed", "Continuous"];
const PROJECT_STATUSES = [
  "Planning",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

interface Project {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

interface TaskItem {
  id: number;
  name: string;
  projectId: number;
  priority: string;
  status: string;
  estimatedHours: number;
  weeklyEffort: number;
  note: string;
}

interface Assignment {
  id: number;
  coworkerId: number;
  taskItemId: number;
  hoursAssigned: number;
  assignedDate: string;
  note?: string;
  assignedBy: string;
  year: number;
  weekNumber: number;
}

interface Coworker {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
}

type ModalType = "task" | "assignment" | null;

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const permissions = usePermissions();
  const projectId = Number(params.id);
  const isNewProject = searchParams.get("new") === "true";

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEntity, setEditingEntity] = useState<
    TaskItem | Assignment | null
  >(null);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [selectedCoworkerId, setSelectedCoworkerId] = useState<number | null>(
    null,
  );
  const { toasts, showToast, removeToast } = useToast();

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

  // Helper function to calculate ISO week number
  const getIsoWeekNumber = (
    date: Date,
  ): { year: number; weekNumber: number } => {
    const target = new Date(date.valueOf());
    const dayNr = (date.getDay() + 6) % 7;
    target.setDate(target.getDate() - dayNr + 3);
    const firstThursday = target.valueOf();
    target.setMonth(0, 1);
    if (target.getDay() !== 4) {
      target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
    }
    const weekNumber =
      1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
    return { year: target.getFullYear(), weekNumber };
  };

  const fetchData = async () => {
    try {
      const [projectRes, tasksRes, assignmentsRes, coworkersRes] =
        await Promise.all([
          fetch(`${apiBaseUrl}/api/projects/${projectId}`),
          fetch(`${apiBaseUrl}/api/tasks`),
          fetch(`${apiBaseUrl}/api/assignments`),
          fetch(`${apiBaseUrl}/api/coworkers`),
        ]);

      if (!projectRes.ok) {
        throw new Error("Failed to fetch project");
      }

      const projectData = await projectRes.json();
      const tasksData = await tasksRes.json();
      const assignmentsData = await assignmentsRes.json();
      const coworkersData = await coworkersRes.json();

      setProject(projectData);
      const projectTasks = tasksData.filter(
        (t: TaskItem) => t.projectId === projectId,
      );
      setTasks(projectTasks);
      setAssignments(assignmentsData);
      setCoworkers(coworkersData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, apiBaseUrl]);

  const handleCreateTask = () => {
    setModalType("task");
    setModalMode("create");
    setEditingEntity(null);
    setModalOpen(true);
  };

  const handleCreateAssignment = () => {
    if (tasks.length === 0) {
      alert("Please create at least one task before adding assignments.");
      return;
    }
    setModalType("assignment");
    setModalMode("create");
    setEditingEntity(null);
    setSelectedTaskId(null);
    setSelectedCoworkerId(null);
    setModalOpen(true);
  };

  const handleEditTask = (task: TaskItem) => {
    setModalType("task");
    setModalMode("edit");
    setEditingEntity(task);
    setModalOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setModalType("assignment");
    setModalMode("edit");
    setEditingEntity(assignment);
    setSelectedTaskId(assignment.taskItemId);
    setSelectedCoworkerId(assignment.coworkerId);
    setModalOpen(true);
  };

  const handleDeleteTask = async (id: number) => {
    if (!permissions.canManageTasks) {
      alert("You don't have permission to delete tasks");
      return;
    }
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/tasks/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast({
          message: "Task deleted successfully!",
          type: "success",
        });
        await fetchData();
      } else {
        showToast({
          message: "Failed to delete task",
          type: "error",
        });
      }
    } catch {
      showToast({
        message: "Error deleting task",
        type: "error",
      });
    }
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!permissions.canManageTasks) {
      alert("You don't have permission to delete assignments");
      return;
    }
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/assignments/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        showToast({
          message: "Assignment deleted successfully!",
          type: "success",
        });
        await fetchData();
      } else {
        showToast({
          message: "Failed to delete assignment",
          type: "error",
        });
      }
    } catch {
      showToast({
        message: "Error deleting assignment",
        type: "error",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string | number> = {};

    formData.forEach((value, key) => {
      if (
        key.includes("Id") ||
        key === "estimatedHours" ||
        key === "weeklyEffort" ||
        key === "hoursAssigned"
      ) {
        data[key] = Number(value);
      } else if (key === "assignedDate") {
        // Convert datetime-local to UTC ISO string
        const localDate = new Date(String(value));
        data[key] = localDate.toISOString();
      } else {
        data[key] = String(value);
      }
    });

    // Add projectId for tasks (both create and edit)
    if (modalType === "task") {
      data.projectId = projectId;
    }

    // Add assignedBy for assignments (use context userName, will be replaced with Azure AD later)
    if (modalType === "assignment") {
      data.assignedBy = permissions.userName || "Unknown User";

      // Calculate year and weekNumber from assignedDate
      if (data.assignedDate) {
        const assignedDate = new Date(String(data.assignedDate));
        const weekInfo = getIsoWeekNumber(assignedDate);
        data.year = weekInfo.year;
        data.weekNumber = weekInfo.weekNumber;
      }

      // Validate required fields for assignments
      if (!data.coworkerId || data.coworkerId === 0) {
        alert("Please select a coworker");
        return;
      }
      if (!data.taskItemId || data.taskItemId === 0) {
        alert("Please select a task");
        return;
      }
      if (!data.hoursAssigned || data.hoursAssigned === 0) {
        alert("Please enter hours assigned (must be greater than 0)");
        return;
      }
    }

    // Validate required fields for tasks
    if (modalType === "task") {
      if (!data.estimatedHours || data.estimatedHours === 0) {
        alert("Please enter estimated hours (must be greater than 0)");
        return;
      }
    }

    console.log("Submitting data:", data);

    try {
      const entityType = modalType === "task" ? "tasks" : "assignments";
      const url =
        modalMode === "create"
          ? `${apiBaseUrl}/api/${entityType}`
          : `${apiBaseUrl}/api/${entityType}/${editingEntity?.id}`;

      const response = await fetch(url, {
        method: modalMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const entityName = modalType === "task" ? "Task" : "Assignment";
        showToast({
          message: `${entityName} ${modalMode === "create" ? "created" : "updated"} successfully!`,
          type: "success",
        });
        setModalOpen(false);
        await fetchData();
      } else {
        const errorText = await response.text();
        console.error("Save failed:", errorText);
        console.error("Data sent:", data);
        showToast({
          message: `Failed to save: ${errorText || "Unknown error"}`,
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error saving item:", err);
      console.error("Data attempted:", data);
      showToast({
        message: `Error saving item: ${err instanceof Error ? err.message : "Unknown error"}`,
        type: "error",
      });
    }
  };

  const handleProjectSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string | number> = {};

    formData.forEach((value, key) => {
      data[key] = String(value);
    });

    console.log("Updating project:", data);

    try {
      const response = await fetch(`${apiBaseUrl}/api/projects/${projectId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showToast({
          message: "Project updated successfully!",
          type: "success",
        });
        setProjectModalOpen(false);
        await fetchData();
      } else {
        const errorText = await response.text();
        console.error("Update failed:", errorText);
        showToast({
          message: `Failed to update project: ${errorText || "Unknown error"}`,
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error updating project:", err);
      showToast({
        message: `Error updating project: ${err instanceof Error ? err.message : "Unknown error"}`,
        type: "error",
      });
    }
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
            <p className="text-slate-400">Loading project details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !project) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-6 max-w-2xl">
            <p className="font-semibold text-red-300">
              {error || "Project not found"}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => router.back()}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const totalEstimatedHours = tasks.reduce(
    (sum, t) => sum + t.estimatedHours,
    0,
  );
  const totalWeeklyEffort = tasks.reduce((sum, t) => sum + t.weeklyEffort, 0);
  const totalAssignedHours = assignments
    .filter((a) => tasks.some((t) => t.id === a.taskItemId))
    .reduce((sum, a) => sum + a.hoursAssigned, 0);

  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "In progress",
  ).length;
  const notStartedTasks = tasks.filter(
    (t) => t.status === "Not started",
  ).length;
  const continuousTasks = tasks.filter((t) => t.status === "Continuous").length;

  // Calculate completion percentage based on hours, not task count
  const completedTasksHours = tasks
    .filter((t) => t.status === "Completed")
    .reduce((sum, t) => sum + t.estimatedHours, 0);
  const progressPercentage =
    totalEstimatedHours > 0
      ? (completedTasksHours / totalEstimatedHours) * 100
      : 0;

  // Calculate estimated project duration in weeks
  const estimatedDurationWeeks =
    totalWeeklyEffort > 0
      ? Math.ceil(totalEstimatedHours / totalWeeklyEffort)
      : 0;

  // Calculate project velocity (actual vs expected completion)
  // Get project creation date to calculate weeks elapsed
  const projectCreatedDate = project.createdAt
    ? new Date(project.createdAt)
    : new Date();
  const now = new Date();
  const weeksElapsed = Math.max(
    1,
    Math.floor(
      (now.getTime() - projectCreatedDate.getTime()) /
        (7 * 24 * 60 * 60 * 1000),
    ),
  );
  const expectedCompletionHours = Math.min(
    totalWeeklyEffort * weeksElapsed,
    totalEstimatedHours,
  );
  const velocityPercentage =
    expectedCompletionHours > 0
      ? (completedTasksHours / expectedCompletionHours) * 100
      : 0;

  const tasksWithAssignments = tasks.map((task) => {
    const taskAssignments = assignments.filter((a) => a.taskItemId === task.id);
    const taskAssignedHours = taskAssignments.reduce(
      (sum, a) => sum + a.hoursAssigned,
      0,
    );
    return {
      ...task,
      assignmentCount: taskAssignments.length,
      assignedHours: taskAssignedHours,
    };
  });

  const projectAssignments = assignments.filter((a) =>
    tasks.some((t) => t.id === a.taskItemId),
  );

  return (
    <PageLayout>
      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <Button onClick={() => router.back()} variant="secondary">
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back
          </Button>
        </div>

        {/* Project Info Card */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-white">
                  {project.name}
                </h1>
                <Button
                  onClick={() => setProjectModalOpen(true)}
                  variant="secondary"
                  size="sm"
                >
                  <svg
                    className="mr-1.5 h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  Edit
                </Button>
              </div>
              <div className="mt-2 flex items-center gap-3">
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${
                    project.status === "Completed"
                      ? "bg-green-900/50 text-green-300"
                      : project.status === "In Progress"
                        ? "bg-blue-900/50 text-blue-300"
                        : project.status === "On Hold"
                          ? "bg-yellow-900/50 text-yellow-300"
                          : project.status === "Cancelled"
                            ? "bg-red-900/50 text-red-300"
                            : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {project.status}
                </span>
                <span className="text-sm text-slate-400">Project Overview</span>
              </div>
              {isNewProject && (
                <div className="mt-4 rounded-lg border border-green-700 bg-green-900/20 p-4">
                  <p className="text-sm font-semibold text-green-300 mb-2">
                    ✓ Project created successfully!
                  </p>
                  <p className="text-xs text-green-400">
                    <strong>Next steps:</strong>
                  </p>
                  <ol className="text-xs text-green-400 ml-4 mt-1 space-y-1">
                    <li>
                      1. Add tasks to your project using the &quot;Add
                      Task&quot; button below
                    </li>
                    <li>
                      2. Once tasks are created, assign team members to them
                    </li>
                  </ol>
                </div>
              )}
            </div>
            <div className="rounded-full bg-purple-600 p-4">
              <svg
                className="h-8 w-8 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Total Tasks</p>
            <p className="mt-2 text-3xl font-bold text-white">{tasks.length}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Completed Tasks</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {completedTasks}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">In Progress Tasks</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {inProgressTasks}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Task Completion</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {Math.round(progressPercentage)}%
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Est. Duration</p>
            <p className="mt-2 text-3xl font-bold text-purple-400">
              {estimatedDurationWeeks}w
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {totalWeeklyEffort > 0
                ? `${totalWeeklyEffort}h/week`
                : "No target"}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Velocity</p>
            <p
              className={`mt-2 text-3xl font-bold ${
                velocityPercentage >= 100
                  ? "text-green-400"
                  : velocityPercentage >= 75
                    ? "text-yellow-400"
                    : "text-red-400"
              }`}
            >
              {Math.round(velocityPercentage)}%
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {velocityPercentage >= 100
                ? "On track"
                : velocityPercentage >= 75
                  ? "Attention"
                  : "Behind"}
            </p>
          </div>
        </div>

        {/* Progress visualizations */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Hours Stats */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Hours Allocation
            </h3>
            <div className="space-y-4">
              <div>
                <div className="text-sm mb-1 text-slate-400">Estimated</div>
                <div className="text-2xl font-bold text-white">
                  {totalEstimatedHours}h
                </div>
              </div>
              <div>
                <div className="text-sm mb-1 text-slate-400">Allocated</div>
                <ProgressBar
                  percentage={
                    totalEstimatedHours > 0
                      ? (totalAssignedHours / totalEstimatedHours) * 100
                      : 0
                  }
                  variant={
                    totalAssignedHours > totalEstimatedHours ? "red" : "green"
                  }
                  showDetails={true}
                  current={totalAssignedHours}
                  total={totalEstimatedHours}
                  currentLabel="allocated"
                  unit="h"
                />
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Task Status Breakdown
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Not started</span>
                <span className="font-semibold text-slate-300">
                  {notStartedTasks}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">In progress</span>
                <span className="font-semibold text-yellow-400">
                  {inProgressTasks}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Completed</span>
                <span className="font-semibold text-green-400">
                  {completedTasks}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-400">Continuous</span>
                <span className="font-semibold text-blue-400">
                  {continuousTasks}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Tasks Table */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Project Tasks ({tasks.length})
            </h2>
            {permissions.canManageTasks && (
              <Button onClick={handleCreateTask} variant="primary">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Task
              </Button>
            )}
          </div>
          {tasksWithAssignments.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-slate-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
              <p className="text-slate-400 text-lg font-medium mb-2">
                No tasks yet
              </p>
              <p className="text-slate-500 text-sm">
                {permissions.canManageTasks &&
                  'Click "Add Task" above to create your first task for this project'}
              </p>
            </div>
          ) : (
            <Table
              data={tasksWithAssignments}
              columns={[
                {
                  header: "Task Name",
                  accessor: (t) => (
                    <Link
                      href={`/tasks/${t.id}`}
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {t.name}
                    </Link>
                  ),
                },
                {
                  header: "Priority",
                  accessor: (t) => (
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        t.priority === "Critical"
                          ? "bg-red-950 text-red-200 border border-red-800"
                          : t.priority === "High"
                            ? "bg-orange-900 text-orange-200"
                            : t.priority === "Normal"
                              ? "bg-yellow-900 text-yellow-200"
                              : "bg-green-900 text-green-200"
                      }`}
                    >
                      {t.priority}
                    </span>
                  ),
                  sortKey: "priority",
                  customSortOrder: ["Critical", "High", "Normal", "Low"],
                },
                {
                  header: "Status",
                  accessor: (t) => (
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                        t.status === "Completed"
                          ? "bg-green-950 text-green-200 border border-green-800"
                          : t.status === "In progress"
                            ? "bg-blue-900 text-blue-200 border border-blue-800"
                            : t.status === "Continuous"
                              ? "bg-purple-900 text-purple-200 border border-purple-800"
                              : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {t.status}
                    </span>
                  ),
                },
                {
                  header: "Estimated",
                  accessor: (t) => `${t.estimatedHours}h`,
                },
                {
                  header: "Assigned Total",
                  accessor: (t) => (
                    <span
                      className={
                        t.assignedHours > t.estimatedHours
                          ? "text-red-400 font-semibold"
                          : "text-slate-300"
                      }
                    >
                      {t.assignedHours}h
                    </span>
                  ),
                },
                {
                  header: "Note",
                  accessor: (t) => (
                    <span
                      className="text-slate-300 text-sm max-w-xs truncate block"
                      title={t.note || ""}
                    >
                      {t.note || "-"}
                    </span>
                  ),
                },
                {
                  header: "Actions",
                  accessor: (t) => (
                    <div className="flex gap-2">
                      {permissions.canManageTasks && (
                        <>
                          <Button
                            onClick={() => handleEditTask(t)}
                            variant="outline-primary"
                            size="icon"
                            icon={
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            }
                          />
                          <Button
                            onClick={() => handleDeleteTask(t.id)}
                            variant="outline-danger"
                            size="icon"
                            icon={
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            }
                          />
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>

        {/* Assignments Table */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Project Assignments ({projectAssignments.length})
            </h2>
            {permissions.canManageTasks && (
              <Button onClick={handleCreateAssignment} variant="primary">
                <svg
                  className="mr-2 h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Assignment
              </Button>
            )}
          </div>
          {projectAssignments.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
              <svg
                className="mx-auto h-16 w-16 text-slate-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                />
              </svg>
              <p className="text-slate-400 text-lg font-medium mb-2">
                No assignments yet
              </p>
              <p className="text-slate-500 text-sm">
                {tasks.length === 0
                  ? "Create tasks first, then assign team members to them"
                  : permissions.canManageTasks &&
                    'Click "Add Assignment" above to assign team members to tasks'}
              </p>
            </div>
          ) : (
            <Table
              data={projectAssignments}
              columns={[
                {
                  header: "Task",
                  accessor: (a) => {
                    const task = tasks.find((t) => t.id === a.taskItemId);
                    return task ? (
                      <Link
                        href={`/tasks/${task.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {task.name}
                      </Link>
                    ) : (
                      "N/A"
                    );
                  },
                },
                {
                  header: "Coworker",
                  accessor: (a) => {
                    const coworker = coworkers.find(
                      (c) => c.id === a.coworkerId,
                    );
                    return coworker ? (
                      <Link
                        href={`/coworkers/${coworker.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {coworker.name}
                      </Link>
                    ) : (
                      "N/A"
                    );
                  },
                },
                {
                  header: "Assigned This Week",
                  accessor: (a) => `${Math.max(0, a.hoursAssigned)}h`,
                },
                {
                  header: "Week",
                  accessor: (a) =>
                    a.year && a.weekNumber ? `${a.year} W${a.weekNumber}` : "-",
                },
                {
                  header: "Date",
                  accessor: (a) =>
                    new Date(a.assignedDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                    }),
                },
                {
                  header: "Note",
                  accessor: (a) => a.note || "-",
                },
                {
                  header: "Assigned By",
                  accessor: (a) => a.assignedBy || "Unknown User",
                },
                {
                  header: "Actions",
                  accessor: (a) => (
                    <div className="flex gap-2">
                      {permissions.canManageTasks && (
                        <>
                          <Button
                            onClick={() => handleEditAssignment(a)}
                            variant="outline-primary"
                            size="icon"
                            icon={
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                                />
                              </svg>
                            }
                          />
                          <Button
                            onClick={() => handleDeleteAssignment(a.id)}
                            variant="outline-danger"
                            size="icon"
                            icon={
                              <svg
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                            }
                          />
                        </>
                      )}
                    </div>
                  ),
                },
              ]}
            />
          )}
        </div>
      </div>

      {/* CRUD Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalMode === "create" ? "Create" : "Edit"} ${modalType === "task" ? "Task" : "Assignment"}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {modalType === "task" && (
            <>
              <Input
                label="Task Name"
                name="name"
                required
                defaultValue={(editingEntity as TaskItem)?.name || ""}
              />
              <Select
                label="Priority"
                name="priority"
                required
                options={PRIORITIES.map((p) => ({ value: p, label: p }))}
                defaultValue={(editingEntity as TaskItem)?.priority || "Normal"}
              />
              <Select
                label="Status"
                name="status"
                required
                options={STATUSES.map((s) => ({ value: s, label: s }))}
                defaultValue={
                  (editingEntity as TaskItem)?.status || "Not started"
                }
              />
              <Input
                label="Estimated Hours"
                name="estimatedHours"
                type="number"
                required
                defaultValue={(editingEntity as TaskItem)?.estimatedHours || 0}
              />
              <Input
                label="Weekly Effort"
                name="weeklyEffort"
                type="number"
                required
                defaultValue={(editingEntity as TaskItem)?.weeklyEffort || 0}
              />
              <Textarea
                label="Note"
                name="note"
                defaultValue={(editingEntity as TaskItem)?.note || ""}
              />
            </>
          )}

          {modalType === "assignment" && (
            <>
              <Select
                label="Coworker"
                name="coworkerId"
                required
                options={[
                  { value: "", label: "Select a coworker" },
                  ...coworkers
                    .filter((c) => c.isActive)
                    .map((c) => ({ value: c.id, label: c.name })),
                  ...coworkers
                    .filter((c) => !c.isActive)
                    .map((c) => ({
                      value: c.id,
                      label: `${c.name} (Inactive - No longer available)`,
                    })),
                ]}
                defaultValue={(editingEntity as Assignment)?.coworkerId || ""}
                onChange={(e) => setSelectedCoworkerId(Number(e.target.value))}
              />
              {selectedCoworkerId &&
                (() => {
                  const selectedCoworker = coworkers.find(
                    (c) => c.id === selectedCoworkerId,
                  );
                  const coworkerAssignments = assignments.filter(
                    (a) => a.coworkerId === selectedCoworkerId,
                  );
                  const totalAssignedToCoworker = coworkerAssignments.reduce(
                    (sum, a) => sum + a.hoursAssigned,
                    0,
                  );
                  const remainingCapacity =
                    (selectedCoworker?.capacity || 0) - totalAssignedToCoworker;

                  return (
                    <div
                      className={`rounded-lg border p-3 space-y-2 ${
                        selectedCoworker?.isActive
                          ? "border-purple-700 bg-purple-900/20"
                          : "border-red-700 bg-red-900/20"
                      }`}
                    >
                      {!selectedCoworker?.isActive && (
                        <div className="flex items-center gap-2 text-red-300 mb-2 pb-2 border-b border-red-800">
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
                              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                            />
                          </svg>
                          <p className="text-sm font-semibold">
                            This coworker is inactive and no longer available
                            for new assignments.
                          </p>
                        </div>
                      )}
                      <div>
                        <p
                          className={`text-sm ${selectedCoworker?.isActive ? "text-purple-300" : "text-red-300"}`}
                        >
                          <strong>Coworker Capacity:</strong>{" "}
                          <span
                            className={
                              !selectedCoworker?.isActive ? "line-through" : ""
                            }
                          >
                            {selectedCoworker?.capacity || 0}h/week
                          </span>
                        </p>
                      </div>
                      {coworkerAssignments.length > 0 && (
                        <div className="border-t border-purple-800 pt-2">
                          <p className="text-xs font-semibold text-purple-300 mb-1">
                            Current Assignments:
                          </p>
                          <ul className="text-xs text-purple-400 space-y-1 ml-2">
                            {coworkerAssignments.map((a) => {
                              const task = tasks.find(
                                (t) => t.id === a.taskItemId,
                              );
                              return (
                                <li key={a.id}>
                                  • {task?.name || "Unknown"}: {a.hoursAssigned}
                                  h
                                </li>
                              );
                            })}
                          </ul>
                          <p className="text-xs text-purple-300 mt-2">
                            <strong>Total Assigned:</strong>{" "}
                            {totalAssignedToCoworker}h
                          </p>
                          <p
                            className={`text-xs font-semibold mt-1 ${remainingCapacity >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            <strong>Remaining Capacity:</strong>{" "}
                            {remainingCapacity}h
                            {remainingCapacity < 0 && " (Over-capacity!)"}
                          </p>
                        </div>
                      )}
                      {coworkerAssignments.length === 0 && (
                        <p className="text-xs text-purple-400">
                          No assignments yet. Full capacity available.
                        </p>
                      )}
                    </div>
                  );
                })()}
              <Select
                label="Task"
                name="taskItemId"
                required
                options={[
                  { value: "", label: "Select a task" },
                  ...tasks.map((t) => ({ value: t.id, label: t.name })),
                ]}
                defaultValue={(editingEntity as Assignment)?.taskItemId || ""}
                onChange={(e) => setSelectedTaskId(Number(e.target.value))}
              />
              {selectedTaskId &&
                (() => {
                  const selectedTask = tasks.find(
                    (t) => t.id === selectedTaskId,
                  );
                  const taskAssignments = assignments.filter(
                    (a) => a.taskItemId === selectedTaskId,
                  );
                  const totalAssigned = taskAssignments.reduce(
                    (sum, a) => sum + a.hoursAssigned,
                    0,
                  );
                  const remainingHours =
                    (selectedTask?.estimatedHours || 0) - totalAssigned;

                  return (
                    <div className="rounded-lg border border-blue-700 bg-blue-900/20 p-3 space-y-2">
                      <div>
                        <p className="text-sm text-blue-300">
                          <strong>Task Estimated Hours:</strong>{" "}
                          {selectedTask?.estimatedHours || 0}h
                        </p>
                      </div>
                      {taskAssignments.length > 0 && (
                        <div className="border-t border-blue-800 pt-2">
                          <p className="text-xs font-semibold text-blue-300 mb-1">
                            Already Assigned:
                          </p>
                          <ul className="text-xs text-blue-400 space-y-1 ml-2">
                            {taskAssignments.map((a) => {
                              const coworker = coworkers.find(
                                (c) => c.id === a.coworkerId,
                              );
                              return (
                                <li key={a.id}>
                                  • {coworker?.name || "Unknown"}:{" "}
                                  {a.hoursAssigned}h
                                </li>
                              );
                            })}
                          </ul>
                          <p className="text-xs text-blue-300 mt-2">
                            <strong>Total Assigned:</strong> {totalAssigned}h
                          </p>
                          <p
                            className={`text-xs font-semibold mt-1 ${remainingHours >= 0 ? "text-green-400" : "text-red-400"}`}
                          >
                            <strong>Remaining:</strong> {remainingHours}h
                            {remainingHours < 0 && " (Over-assigned!)"}
                          </p>
                        </div>
                      )}
                      {taskAssignments.length === 0 && (
                        <p className="text-xs text-blue-400">
                          No assignments yet. Use the estimated hours as a
                          reference.
                        </p>
                      )}
                    </div>
                  );
                })()}
              <Input
                label="Hours Assigned"
                name="hoursAssigned"
                type="number"
                step="0.5"
                min="0"
                required
                defaultValue={(editingEntity as Assignment)?.hoursAssigned || 0}
              />
              <Textarea
                label="Note"
                name="note"
                defaultValue={(editingEntity as Assignment)?.note || ""}
              />
              <Input
                label="Assigned Date"
                name="assignedDate"
                type="datetime-local"
                required
                defaultValue={
                  (editingEntity as Assignment)?.assignedDate
                    ? new Date((editingEntity as Assignment).assignedDate)
                        .toISOString()
                        .slice(0, 16)
                    : new Date().toISOString().slice(0, 16)
                }
              />
            </>
          )}

          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              {modalMode === "create" ? "Create" : "Update"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Project Edit Modal */}
      <Modal
        isOpen={projectModalOpen}
        onClose={() => setProjectModalOpen(false)}
        title="Edit Project"
      >
        <form onSubmit={handleProjectSubmit} className="space-y-4">
          <Input
            label="Project Name"
            name="name"
            required
            defaultValue={project?.name || ""}
          />
          <Select
            label="Status"
            name="status"
            required
            options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))}
            defaultValue={project?.status || "Planning"}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Update
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setProjectModalOpen(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      </Modal>

      {/* Toast Notifications */}
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
          index={index}
          onClose={() => removeToast(toast.id)}
        />
      ))}
    </PageLayout>
  );
}
