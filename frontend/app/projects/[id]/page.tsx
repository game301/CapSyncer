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

const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const STATUSES = ["Not started", "In progress", "Completed", "Continuous"];

interface Project {
  id: number;
  name: string;
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
}

interface Coworker {
  id: number;
  name: string;
  capacity: number;
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
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

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
        await fetchData();
      } else {
        alert("Failed to delete task");
      }
    } catch {
      alert("Error deleting task");
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
        await fetchData();
      } else {
        alert("Failed to delete assignment");
      }
    } catch {
      alert("Error deleting assignment");
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

    // Add projectId for new tasks
    if (modalType === "task" && modalMode === "create") {
      data.projectId = projectId;
    }

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
        setModalOpen(false);
        await fetchData();
      } else {
        const errorText = await response.text();
        console.error("Save failed:", errorText);
        alert(`Failed to save: ${errorText || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error saving item:", err);
      alert(
        `Error saving item: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
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
    totalEstimatedHours > 0 ? (completedTasksHours / totalEstimatedHours) * 100 : 0;

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
            <div>
              <h1 className="text-4xl font-bold text-white">{project.name}</h1>
              <p className="mt-2 text-slate-400">Project Overview</p>
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
                      1. Add tasks to your project using the "Add Task" button
                      below
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
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Total Tasks</p>
            <p className="mt-2 text-3xl font-bold text-white">{tasks.length}</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Completed</p>
            <p className="mt-2 text-3xl font-bold text-green-400">
              {completedTasks}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">In Progress</p>
            <p className="mt-2 text-3xl font-bold text-yellow-400">
              {inProgressTasks}
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Completion</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {Math.round(progressPercentage)}%
            </p>
          </div>
        </div>

        {/* Progress visualizations */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          {/* Hours Stats */}
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">
              Hours Overview
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Estimated</span>
                  <span className="font-semibold text-white">
                    {totalEstimatedHours}h
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500"
                    style={{ width: "100%" }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-400">Assigned</span>
                  <span className="font-semibold text-white">
                    {totalAssignedHours}h
                  </span>
                </div>
                <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${totalAssignedHours > totalEstimatedHours ? "bg-red-500" : "bg-green-500"}`}
                    style={{
                      width: `${totalEstimatedHours > 0 ? Math.min(100, (totalAssignedHours / totalEstimatedHours) * 100) : 0}%`,
                    }}
                  />
                </div>
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
              <Button onClick={handleCreateTask}>
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
                },
                {
                  header: "Status",
                  accessor: (t) => (
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold ${
                        t.status === "Completed"
                          ? "bg-green-900 text-green-200"
                          : t.status === "In progress"
                            ? "bg-yellow-900 text-yellow-200"
                            : t.status === "Continuous"
                              ? "bg-blue-900 text-blue-200"
                              : "bg-slate-700 text-slate-300"
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
                  header: "Assigned",
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
                  header: "Assignments",
                  accessor: (t) => t.assignmentCount,
                },
                {
                  header: "Actions",
                  accessor: (t) => (
                    <div className="flex gap-2">
                      {permissions.canManageTasks && (
                        <>
                          <button
                            onClick={() => handleEditTask(t)}
                            className="rounded p-1 text-blue-400 hover:bg-slate-700"
                          >
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
                          </button>
                          <button
                            onClick={() => handleDeleteTask(t.id)}
                            className="rounded p-1 text-red-400 hover:bg-slate-700"
                          >
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
                          </button>
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
              <Button onClick={handleCreateAssignment}>
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
                  header: "Hours",
                  accessor: (a) => `${Math.max(0, a.hoursAssigned)}h`,
                },
                {
                  header: "Date",
                  accessor: (a) =>
                    new Date(a.assignedDate).toLocaleDateString(),
                },
                {
                  header: "Note",
                  accessor: (a) => a.note || "-",
                },
                {
                  header: "Actions",
                  accessor: (a) => (
                    <div className="flex gap-2">
                      {permissions.canManageTasks && (
                        <>
                          <button
                            onClick={() => handleEditAssignment(a)}
                            className="rounded p-1 text-blue-400 hover:bg-slate-700"
                          >
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
                          </button>
                          <button
                            onClick={() => handleDeleteAssignment(a.id)}
                            className="rounded p-1 text-red-400 hover:bg-slate-700"
                          >
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
                          </button>
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
                  ...coworkers.map((c) => ({ value: c.id, label: c.name })),
                ]}
                defaultValue={(editingEntity as Assignment)?.coworkerId || ""}
              />
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
              {selectedTaskId && (() => {
                const selectedTask = tasks.find((t) => t.id === selectedTaskId);
                const taskAssignments = assignments.filter(
                  (a) => a.taskItemId === selectedTaskId
                );
                const totalAssigned = taskAssignments.reduce(
                  (sum, a) => sum + a.hoursAssigned,
                  0
                );
                const remainingHours = (selectedTask?.estimatedHours || 0) - totalAssigned;

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
                              (c) => c.id === a.coworkerId
                            );
                            return (
                              <li key={a.id}>
                                • {coworker?.name || "Unknown"}: {a.hoursAssigned}h
                              </li>
                            );
                          })}
                        </ul>
                        <p className="text-xs text-blue-300 mt-2">
                          <strong>Total Assigned:</strong> {totalAssigned}h
                        </p>
                        <p className={`text-xs font-semibold mt-1 ${remainingHours >= 0 ? "text-green-400" : "text-red-400"}`}>
                          <strong>Remaining:</strong> {remainingHours}h
                          {remainingHours < 0 && " (Over-assigned!)"}
                        </p>
                      </div>
                    )}
                    {taskAssignments.length === 0 && (
                      <p className="text-xs text-blue-400">
                        No assignments yet. Use the estimated hours as a reference.
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
            <Button type="submit" className="flex-1">
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
    </PageLayout>
  );
}
