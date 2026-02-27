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

interface TaskItem {
  id: number;
  name: string;
  projectId: number;
  priority: string;
  status: string;
  estimatedHours: number;
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
}

interface Coworker {
  id: number;
  name: string;
  capacity: number;
}

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const permissions = usePermissions();
  const taskId = Number(params.id);

  const [task, setTask] = useState<TaskItem | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
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

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

  const fetchData = async () => {
    try {
      const [taskRes, projectsRes, assignmentsRes, coworkersRes] =
        await Promise.all([
          fetch(`${apiBaseUrl}/api/tasks/${taskId}`),
          fetch(`${apiBaseUrl}/api/projects`),
          fetch(`${apiBaseUrl}/api/assignments`),
          fetch(`${apiBaseUrl}/api/coworkers`),
        ]);

      if (!taskRes.ok) {
        throw new Error("Failed to fetch task");
      }

      const taskData = await taskRes.json();
      const projectsData = await projectsRes.json();
      const assignmentsData = await assignmentsRes.json();
      const coworkersData = await coworkersRes.json();

      setTask(taskData);
      setProject(
        projectsData.find((p: Project) => p.id === taskData.projectId) || null,
      );
      setAssignments(
        assignmentsData.filter((a: Assignment) => a.taskItemId === taskId),
      );
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
        setModalOpen(false);
        await fetchData();
      } else {
        const errorText = await response.text();
        console.error("Save failed:", errorText);
        alert(`Failed to save: ${errorText || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error saving assignment:", err);
      alert(
        `Error saving assignment: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
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
  const hoursRemaining = Math.max(0, task.estimatedHours - totalAssignedHours);
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
              <h1 className="text-4xl font-bold text-white">{task.name}</h1>
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
            <p className="text-sm text-slate-400">Assigned Hours</p>
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
                Assignment Progress
              </h3>
              <span className="text-lg font-bold text-white">
                {Math.round(progressPercentage)}%
              </span>
            </div>
            <div className="h-6 overflow-hidden rounded-full bg-slate-700">
              <div
                className={`h-full transition-all ${
                  totalAssignedHours > task.estimatedHours
                    ? "bg-red-500"
                    : totalAssignedHours === task.estimatedHours
                      ? "bg-green-500"
                      : "bg-blue-500"
                }`}
                style={{
                  width: `${Math.min(100, progressPercentage)}%`,
                }}
              />
            </div>
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
                  Click "Add Assignment" to assign this task to a team member
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
                      {permissions.canManageAssignments && (
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
              ...coworkers.map((c) => ({ value: c.id, label: c.name })),
            ]}
            defaultValue={editingAssignment?.coworkerId || ""}
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
                <div className="rounded-lg border border-purple-700 bg-purple-900/20 p-3 space-y-2">
                  <div>
                    <p className="text-sm text-purple-300">
                      <strong>Coworker Capacity:</strong>{" "}
                      {selectedCoworker?.capacity || 0}h/week
                    </p>
                  </div>
                  {coworkerAssignments.length > 0 && (
                    <div className="border-t border-purple-800 pt-2">
                      <p className="text-xs font-semibold text-purple-300 mb-1">
                        Current Assignments:
                      </p>
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
