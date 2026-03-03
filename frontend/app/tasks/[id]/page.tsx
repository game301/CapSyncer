"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

interface Project {
  id: number;
  name: string;
}

interface Assignment {
  id: number;
  coworkerId: number;
  taskItemId: number;
  hoursAssigned: number;
  assignedDate: string;
  note?: string;
  assignedBy: string;
}

interface Coworker {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const permissions = usePermissions();
  const taskId = Number(params.id);

  const [task, setTask] = useState<TaskItem | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allAssignments, setAllAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(
    null,
  );
  const [selectedCoworkerId, setSelectedCoworkerId] = useState<number | null>(
    null,
  );
  const [taskModalOpen, setTaskModalOpen] = useState(false);
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
      const [taskRes, projectsRes, assignmentsRes, tasksRes, coworkersRes] =
        await Promise.all([
          fetch(`${apiBaseUrl}/api/tasks/${taskId}`),
          fetch(`${apiBaseUrl}/api/projects`),
          fetch(`${apiBaseUrl}/api/assignments`),
          fetch(`${apiBaseUrl}/api/tasks`),
          fetch(`${apiBaseUrl}/api/coworkers`),
        ]);

      if (!taskRes.ok) {
        throw new Error("Failed to fetch task");
      }

      const taskData = await taskRes.json();
      const projectsData = await projectsRes.json();
      const assignmentsData = await assignmentsRes.json();
      const tasksData = await tasksRes.json();
      const coworkersData = await coworkersRes.json();

      setTask(taskData);
      setProjects(projectsData);
      setProject(
        projectsData.find((p: Project) => p.id === taskData.projectId) || null,
      );
      setAssignments(
        assignmentsData.filter((a: Assignment) => a.taskItemId === taskId),
      );
      setAllAssignments(assignmentsData);
      setTasks(tasksData);
      setCoworkers(coworkersData);
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [taskId, apiBaseUrl]);

  const handleCreateAssignment = () => {
    setModalMode("create");
    setEditingAssignment(null);
    setSelectedCoworkerId(null);
    setModalOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setModalMode("edit");
    setEditingAssignment(assignment);
    setSelectedCoworkerId(assignment.coworkerId);
    setModalOpen(true);
  };

  const handleDeleteAssignment = async (id: number) => {
    if (!permissions.canManageAssignments) {
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
      if (key.includes("Id") || key === "hoursAssigned") {
        data[key] = Number(value);
      } else if (key === "assignedDate") {
        // Convert datetime-local to UTC ISO string
        const localDate = new Date(String(value));
        data[key] = localDate.toISOString();
      } else {
        data[key] = String(value);
      }
    });

    // Add taskItemId for new assignments
    data.taskItemId = taskId;

    // Add assignedBy (use context userName, will be replaced with Azure AD later)
    data.assignedBy = permissions.userName || "Unknown User";

    // Calculate year and weekNumber from assignedDate
    if (data.assignedDate) {
      const assignedDate = new Date(String(data.assignedDate));
      const weekInfo = getIsoWeekNumber(assignedDate);
      data.year = weekInfo.year;
      data.weekNumber = weekInfo.weekNumber;
    }

    // Validate required fields
    if (!data.coworkerId || data.coworkerId === 0) {
      alert("Please select a coworker");
      return;
    }
    if (!data.hoursAssigned || data.hoursAssigned === 0) {
      alert("Please enter hours assigned (must be greater than 0)");
      return;
    }

    console.log("Submitting assignment data:", data);

    try {
      const url =
        modalMode === "create"
          ? `${apiBaseUrl}/api/assignments`
          : `${apiBaseUrl}/api/assignments/${editingAssignment?.id}`;

      const response = await fetch(url, {
        method: modalMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showToast({
          message: `Assignment ${modalMode === "create" ? "created" : "updated"} successfully!`,
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
      console.error("Error saving assignment:", err);
      console.error("Data attempted:", data);
      showToast({
        message: `Error saving assignment: ${err instanceof Error ? err.message : "Unknown error"}`,
        type: "error",
      });
    }
  };

  const handleTaskSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string | number> = {};

    formData.forEach((value, key) => {
      if (
        key.includes("Id") ||
        key === "estimatedHours" ||
        key === "weeklyEffort"
      ) {
        data[key] = Number(value);
      } else {
        data[key] = String(value);
      }
    });

    console.log("Updating task:", data);

    try {
      const response = await fetch(`${apiBaseUrl}/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        showToast({
          message: "Task updated successfully!",
          type: "success",
        });
        setTaskModalOpen(false);
        await fetchData();
      } else {
        const errorText = await response.text();
        console.error("Update failed:", errorText);
        showToast({
          message: `Failed to update task: ${errorText || "Unknown error"}`,
          type: "error",
        });
      }
    } catch (err) {
      console.error("Error updating task:", err);
      showToast({
        message: `Error updating task: ${err instanceof Error ? err.message : "Unknown error"}`,
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
            <p className="text-slate-400">Loading task details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !task) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-6 max-w-2xl">
            <p className="font-semibold text-red-300">
              {error || "Task not found"}
            </p>
            <Button
              className="mt-4"
              variant="secondary"
              onClick={() => router.push("/dashboard")}
            >
              Back to Dashboard
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const taskAssignments = assignments.map((assignment) => {
    const coworker = coworkers.find((c) => c.id === assignment.coworkerId);
    return {
      ...assignment,
      coworker,
    };
  });

  const totalAssignedHours = taskAssignments.reduce(
    (sum, a) => sum + a.hoursAssigned,
    0,
  );
  const hoursRemaining = task.estimatedHours - totalAssignedHours;
  const progressPercentage =
    task.estimatedHours > 0
      ? (totalAssignedHours / task.estimatedHours) * 100
      : 0;

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

        {/* Task Info Card */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-4">
                <h1 className="text-4xl font-bold text-white">{task.name}</h1>
                <Button
                  onClick={() => setTaskModalOpen(true)}
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
              <div className="mt-4 flex flex-wrap gap-3">
                <span
                  className={`rounded px-3 py-1 text-sm font-semibold ${
                    task.priority === "Critical"
                      ? "bg-red-950 text-red-200 border border-red-800"
                      : task.priority === "High"
                        ? "bg-orange-900 text-orange-200"
                        : task.priority === "Normal"
                          ? "bg-yellow-900 text-yellow-200"
                          : "bg-green-900 text-green-200"
                  }`}
                >
                  {task.priority} Priority
                </span>
                <span
                  className={`rounded px-3 py-1 text-sm font-semibold ${
                    task.status === "Completed"
                      ? "bg-green-900 text-green-200"
                      : task.status === "In progress"
                        ? "bg-yellow-900 text-yellow-200"
                        : task.status === "Continuous"
                          ? "bg-blue-900 text-blue-200"
                          : "bg-slate-700 text-slate-300"
                  }`}
                >
                  {task.status}
                </span>
              </div>
            </div>
            <div className="ml-4 rounded-full bg-indigo-600 p-4">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
                />
              </svg>
            </div>
          </div>

          {/* Project Link */}
          {project && (
            <div className="mt-6 flex items-center gap-2 text-slate-400">
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm">Project:</span>
              <Link
                href={`/projects/${project.id}`}
                className="text-sm font-medium text-blue-400 hover:text-blue-300 hover:underline"
              >
                {project.name}
              </Link>
            </div>
          )}
        </div>

        {/* Hours Stats */}
        <div className="mb-8 grid gap-6 md:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Estimated Hours</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {task.estimatedHours}h
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Allocated Hours</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {totalAssignedHours}h
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Remaining Hours</p>
            <p
              className={`mt-2 text-3xl font-bold ${hoursRemaining === 0 ? "text-green-400" : hoursRemaining < 0 ? "text-red-400" : "text-yellow-400"}`}
            >
              {hoursRemaining}h
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        {task.estimatedHours > 0 && (
          <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Allocation Progress
              </h3>
              <span className="text-lg font-bold text-white">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <ProgressBar
              percentage={progressPercentage}
              variant={
                totalAssignedHours > task.estimatedHours
                  ? "red"
                  : totalAssignedHours === task.estimatedHours
                    ? "green"
                    : "blue"
              }
            />
            {totalAssignedHours > task.estimatedHours && (
              <p className="mt-3 flex items-center gap-2 text-sm text-red-400">
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
                Over-allocated by {totalAssignedHours - task.estimatedHours}{" "}
                hours
              </p>
            )}
          </div>
        )}

        {/* Assignments Table */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">
              Assigned Team Members ({taskAssignments.length})
            </h2>
            {permissions.canManageAssignments && (
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
          {taskAssignments.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
              <svg
                className="mx-auto h-12 w-12 text-slate-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
              <p className="text-slate-400 mb-2">
                No team members assigned yet
              </p>
              {permissions.canManageAssignments && (
                <p className="text-sm text-slate-500">
                  Click &quot;Add Assignment&quot; to assign this task to a team
                  member
                </p>
              )}
            </div>
          ) : (
            <Table
              data={taskAssignments}
              columns={[
                {
                  header: "Coworker",
                  accessor: (a) =>
                    a.coworker ? (
                      <Link
                        href={`/coworkers/${a.coworker.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {a.coworker.name}
                      </Link>
                    ) : (
                      "N/A"
                    ),
                },
                {
                  header: "Capacity",
                  accessor: (a) =>
                    a.coworker ? `${a.coworker.capacity}h/week` : "N/A",
                },
                {
                  header: "Hours Assigned",
                  accessor: (a) => (
                    <span className="font-semibold text-blue-400">
                      {a.hoursAssigned}h
                    </span>
                  ),
                },
                {
                  header: "Assigned Date",
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
                      {permissions.canManageAssignments && (
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

      {/* Assignment Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={`${modalMode === "create" ? "Create" : "Edit"} Assignment`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
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
            defaultValue={editingAssignment?.coworkerId || ""}
            onChange={(e) => setSelectedCoworkerId(Number(e.target.value))}
          />
          {selectedCoworkerId &&
            (() => {
              const selectedCoworker = coworkers.find(
                (c) => c.id === selectedCoworkerId,
              );
              const coworkerAssignments = allAssignments.filter(
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
                        This coworker is inactive and no longer available for
                        new assignments.
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
                          const assignedTask = tasks.find(
                            (t) => t.id === a.taskItemId,
                          );
                          return (
                            <li key={a.id}>
                              • {assignedTask?.name || "Unknown Task"}:{" "}
                              {a.hoursAssigned}h
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
                        <strong>Remaining Capacity:</strong> {remainingCapacity}
                        h{remainingCapacity < 0 && " (Over-capacity!)"}
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

          {/* Task Information Box */}
          {(() => {
            const taskAssignments = assignments;
            const totalAssigned = taskAssignments.reduce(
              (sum, a) => sum + a.hoursAssigned,
              0,
            );
            const remainingHours = (task?.estimatedHours || 0) - totalAssigned;

            return (
              <div className="rounded-lg border border-blue-700 bg-blue-900/20 p-3 space-y-2">
                <div>
                  <p className="text-sm text-blue-300">
                    <strong>Task Estimated Hours:</strong>{" "}
                    {task?.estimatedHours || 0}h
                  </p>
                </div>
                {taskAssignments.length > 0 && (
                  <div className="border-t border-blue-800 pt-2">
                    <p className="text-xs font-semibold text-blue-300 mb-1">
                      Already Assigned:
                    </p>
                    <ul className="text-xs text-blue-400 space-y-1 ml-2">
                      {taskAssignments.map((a) => {
                        const assignedCoworker = coworkers.find(
                          (c) => c.id === a.coworkerId,
                        );
                        return (
                          <li key={a.id}>
                            • {assignedCoworker?.name || "Unknown"}:{" "}
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
            defaultValue={editingAssignment?.hoursAssigned || 0}
          />
          <Textarea
            label="Note"
            name="note"
            defaultValue={editingAssignment?.note || ""}
          />
          <Input
            label="Assigned Date"
            name="assignedDate"
            type="datetime-local"
            required
            defaultValue={
              editingAssignment?.assignedDate
                ? new Date(editingAssignment.assignedDate)
                    .toISOString()
                    .slice(0, 16)
                : new Date().toISOString().slice(0, 16)
            }
          />

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

      {/* Task Edit Modal */}
      <Modal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        title="Edit Task"
      >
        <form onSubmit={handleTaskSubmit} className="space-y-4">
          <Input
            label="Task Name"
            name="name"
            required
            defaultValue={task?.name || ""}
          />
          <Select
            label="Project"
            name="projectId"
            required
            options={[
              { value: "", label: "Select a project" },
              ...projects.map((p) => ({ value: p.id, label: p.name })),
            ]}
            defaultValue={task?.projectId || ""}
          />
          <Select
            label="Priority"
            name="priority"
            required
            options={PRIORITIES.map((p) => ({ value: p, label: p }))}
            defaultValue={task?.priority || "Normal"}
          />
          <Select
            label="Status"
            name="status"
            required
            options={STATUSES.map((s) => ({ value: s, label: s }))}
            defaultValue={task?.status || "Not started"}
          />
          <Input
            label="Estimated Hours"
            name="estimatedHours"
            type="number"
            step="0.5"
            min="0"
            required
            defaultValue={task?.estimatedHours || 0}
          />
          <Input
            label="Weekly Effort"
            name="weeklyEffort"
            type="number"
            step="0.5"
            min="0"
            required
            defaultValue={task?.weeklyEffort || 0}
          />
          <Textarea label="Note" name="note" defaultValue={task?.note || ""} />
          <div className="flex gap-3 pt-4">
            <Button type="submit" variant="primary" className="flex-1">
              Update
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setTaskModalOpen(false)}
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
