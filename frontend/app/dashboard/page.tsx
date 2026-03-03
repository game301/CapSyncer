"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Table, SearchInput, useTableSearch } from "../../components/Table";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Input, Select, Textarea } from "../../components/FormInputs";
import { PageLayout } from "../../components/PageLayout";
import { usePermissions } from "../../contexts/PermissionContext";
import { Toast, useToast } from "../../components/Toast";
import { WeekSelector } from "../../components/WeekSelector";
import { ProgressBar } from "../../components/ProgressBar";

// Priority and Status options
const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const STATUSES = ["Not started", "In progress", "Completed", "Continuous"];
const PROJECT_STATUSES = [
  "Planning",
  "In Progress",
  "On Hold",
  "Completed",
  "Cancelled",
];

interface Coworker {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
}

interface Project {
  id: number;
  name: string;
  status: string;
  createdAt: string;
}

interface TaskItem {
  id: number;
  name: string;
  priority: string;
  status: string;
  estimatedHours: number;
  weeklyEffort: number;
  note: string;
  projectId: number;
}

interface Assignment {
  id: number;
  coworkerId: number;
  taskItemId: number;
  hoursAssigned: number;
  note: string;
  assignedDate: string;
  assignedBy: string;
  year: number;
  weekNumber: number;
}

type ViewMode = "team" | "personal";
type EntityType = "coworkers" | "projects" | "tasks" | "assignments";

export default function Dashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const permissions = usePermissions();
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(
    (searchParams.get("view") as ViewMode) || "team",
  );
  const [activeEntity, setActiveEntity] = useState<EntityType>("coworkers");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEntity, setEditingEntity] = useState<
    Coworker | Project | TaskItem | Assignment | null
  >(null);
  const [selectedCoworkerId, setSelectedCoworkerId] = useState<number | null>(
    null,
  );
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [hasInteractedWithCoworker, setHasInteractedWithCoworker] =
    useState(false);
  const { toasts, showToast, removeToast } = useToast();

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [coworkersRes, projectsRes, tasksRes, assignmentsRes] =
        await Promise.all([
          fetch(`${apiBaseUrl}/api/coworkers`),
          fetch(`${apiBaseUrl}/api/projects`),
          fetch(`${apiBaseUrl}/api/tasks`),
          fetch(`${apiBaseUrl}/api/assignments`),
        ]);

      if (
        !coworkersRes.ok ||
        !projectsRes.ok ||
        !tasksRes.ok ||
        !assignmentsRes.ok
      ) {
        throw new Error("Failed to fetch data");
      }

      const [c, p, t, a] = await Promise.all([
        coworkersRes.json(),
        projectsRes.json(),
        tasksRes.json(),
        assignmentsRes.json(),
      ]);

      setCoworkers(c || []);
      setProjects(p || []);
      setTasks(t || []);
      setAssignments(a || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchData();

    // Handle query params for pre-filling forms
    const createParam = searchParams.get("create");
    const coworkerIdParam = searchParams.get("coworkerId");

    if (createParam === "true") {
      const tabParam = searchParams.get("tab");
      if (tabParam === "assignments" && coworkerIdParam) {
        // Pre-fill assignment creation with coworker
        setActiveEntity("assignments");
        setSelectedCoworkerId(Number(coworkerIdParam));
        setModalMode("create");
        setEditingEntity(null);
        setModalOpen(true);

        // Clean up URL params
        const params = new URLSearchParams(searchParams.toString());
        params.delete("create");
        params.delete("coworkerId");
        params.delete("year");
        params.delete("week");
        router.replace(`/dashboard?${params.toString()}`);
      } else if (tabParam === "tasks") {
        // Open task creation modal
        setActiveEntity("tasks");
        setModalMode("create");
        setEditingEntity(null);
        setModalOpen(true);

        // Clean up URL params
        const params = new URLSearchParams(searchParams.toString());
        params.delete("create");
        router.replace(`/dashboard?${params.toString()}`);
      }
    }
  }, [fetchData, searchParams, router]);

  // Update URL when viewMode changes
  const updateViewMode = (mode: ViewMode) => {
    setViewMode(mode);
    const params = new URLSearchParams(searchParams.toString());
    params.set("view", mode);
    router.replace(`/dashboard?${params.toString()}`);
  };

  const handleCreate = (
    entityType: EntityType,
    prefilledCoworkerId?: number,
  ) => {
    setModalMode("create");
    setActiveEntity(entityType);
    setEditingEntity(null);
    setSelectedCoworkerId(prefilledCoworkerId || null);
    setSelectedTaskId(null);
    setHasInteractedWithCoworker(false);
    setModalOpen(true);
  };

  const handleEdit = (
    entityType: EntityType,
    entity: Coworker | Project | TaskItem | Assignment,
  ) => {
    setModalMode("edit");
    setActiveEntity(entityType);
    setEditingEntity(entity);

    // Initialize selected IDs for assignment editing
    if (entityType === "assignments") {
      const assignment = entity as Assignment;
      setSelectedCoworkerId(assignment.coworkerId);
      setSelectedTaskId(assignment.taskItemId);
      setHasInteractedWithCoworker(true); // Show capacity info when editing
    } else {
      setSelectedCoworkerId(null);
      setSelectedTaskId(null);
      setHasInteractedWithCoworker(false);
    }

    setModalOpen(true);
  };

  const handleReactivate = async (id: number) => {
    if (!permissions.canManageCoworkers) {
      alert("You don't have permission to reactivate coworkers");
      return;
    }

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/coworkers/${id}/reactivate`,
        {
          method: "PUT",
        },
      );

      if (response.ok) {
        showToast({
          message: "Coworker reactivated successfully!",
          type: "success",
        });
        await fetchData();
      } else {
        showToast({
          message: "Failed to reactivate coworker",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error reactivating coworker:", error);
      showToast({
        message: "Error reactivating coworker",
        type: "error",
      });
    }
  };

  const handleDelete = async (entityType: EntityType, id: number) => {
    // Permission checking
    if (entityType === "coworkers" && !permissions.canDeleteCoworkers) {
      alert("You don't have permission to delete coworkers");
      return;
    }
    if (entityType === "projects" && !permissions.canManageProjects) {
      alert("Only admins can delete projects");
      return;
    }

    // Special handling for coworkers - check if it's inactive (second delete)
    let confirmMessage = "Are you sure you want to delete this item?";
    if (entityType === "coworkers") {
      const coworker = coworkers.find((c) => c.id === id);
      if (coworker && !coworker.isActive) {
        confirmMessage =
          "This coworker is already inactive. This will PERMANENTLY delete the coworker and all data. Are you sure?";
      } else {
        confirmMessage =
          "This will deactivate the coworker (soft delete). You can permanently delete later. Continue?";
      }
    }

    if (!confirm(confirmMessage)) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/${entityType}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        const entityName = entityType.slice(0, -1);

        // Check if it's a coworker soft delete or permanent delete
        if (entityType === "coworkers") {
          const result = await response.json();
          if (result.message === "soft-delete") {
            showToast({
              message:
                "Coworker deactivated (soft delete). Delete again to permanently remove.",
              type: "success",
              duration: 5000,
            });
          } else if (result.message === "permanent-delete") {
            showToast({
              message: "Coworker permanently deleted!",
              type: "success",
            });
          }
        } else {
          showToast({
            message: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} deleted successfully!`,
            type: "success",
          });
        }

        await fetchData();
      } else {
        showToast({
          message: "Failed to delete",
          type: "error",
        });
      }
    } catch {
      alert("Error deleting item");
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data: Record<string, string | number> = {};

    formData.forEach((value, key) => {
      if (
        key.includes("Id") ||
        key === "capacity" ||
        key === "estimatedHours" ||
        key === "weeklyEffort" ||
        key === "hoursAssigned" ||
        key === "weekYear" ||
        key === "weekNumber"
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

    // Add assignedBy for assignments (use context userName, will be replaced with Azure AD later)
    if (activeEntity === "assignments") {
      data.assignedBy = permissions.userName || "Unknown User";

      // Rename weekYear and weekNumber to match backend model (year, weekNumber)
      if (data.weekYear !== undefined) {
        data.year = data.weekYear;
        delete data.weekYear;
      }
      // weekNumber already has the correct name, no need to rename

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
      if (!data.year) {
        alert("Please select a year");
        return;
      }
      if (!data.weekNumber) {
        alert("Please select a week number");
        return;
      }
    }

    // Validate required fields for tasks
    if (activeEntity === "tasks") {
      if (!data.projectId || data.projectId === 0) {
        alert("Please select a project");
        return;
      }
      if (!data.estimatedHours || data.estimatedHours === 0) {
        alert("Please enter estimated hours (must be greater than 0)");
        return;
      }
    }

    console.log("Submitting data:", data);

    try {
      const url =
        modalMode === "create"
          ? `${apiBaseUrl}/api/${activeEntity}`
          : `${apiBaseUrl}/api/${activeEntity}/${editingEntity?.id}`;

      const response = await fetch(url, {
        method: modalMode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        setModalOpen(false);
        setSelectedCoworkerId(null);
        setSelectedTaskId(null);
        setHasInteractedWithCoworker(false);

        // Show success toast
        const entityName = activeEntity.slice(0, -1); // Remove 's' from end
        showToast({
          message: `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} ${modalMode === "create" ? "created" : "updated"} successfully!`,
          type: "success",
        });

        // If creating a new project, redirect to its detail page
        if (modalMode === "create" && activeEntity === "projects") {
          const newProject = await response.json();
          router.push(`/projects/${newProject.id}?new=true`);
        } else {
          await fetchData();
        }
      } else {
        const errorText = await response.text();
        console.error("Save failed:", errorText);
        console.error("Data sent:", data);
        alert(`Failed to save: ${errorText || "Unknown error"}`);
      }
    } catch (err) {
      console.error("Error saving item:", err);
      console.error("Data attempted:", data);
      alert(
        `Error saving item: ${err instanceof Error ? err.message : "Unknown error"}`,
      );
    }
  };

  const calculateCoworkerStats = (coworkerId: number) => {
    const assignedHours = assignments
      .filter((a) => a.coworkerId === coworkerId)
      .reduce((sum, a) => sum + a.hoursAssigned, 0);
    const capacity = coworkers.find((c) => c.id === coworkerId)?.capacity || 0;
    const available = capacity - assignedHours;
    const percentage = capacity > 0 ? (assignedHours / capacity) * 100 : 0;
    return { assignedHours, capacity, available, percentage };
  };

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
            <p className="text-slate-400">Loading dashboard...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-6 max-w-2xl">
            <p className="font-semibold text-red-300">Error: {error}</p>
            <Button className="mt-4" onClick={() => fetchData()}>
              Retry
            </Button>
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="border-b border-slate-700 bg-slate-800/50">
        <div className="mx-auto max-w-7xl px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">Dashboard</h1>
              <p className="mt-1 text-sm text-slate-400">
                Manage your team&apos;s capacity
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "team" ? "primary" : "secondary"}
                onClick={() => updateViewMode("team")}
              >
                Team View
              </Button>
              <Button
                variant={viewMode === "personal" ? "primary" : "secondary"}
                onClick={() => updateViewMode("personal")}
              >
                Personal View
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="min-h-[calc(100vh-300px)]">
          {viewMode === "team" ? (
            <TeamView
              coworkers={coworkers}
              projects={projects}
              tasks={tasks}
              assignments={assignments}
              router={router}
              searchParams={searchParams}
              permissions={permissions}
              onCreateCoworker={() => handleCreate("coworkers")}
              onEditCoworker={(c: Coworker) => handleEdit("coworkers", c)}
              onDeleteCoworker={(id: number) => handleDelete("coworkers", id)}
              onReactivateCoworker={handleReactivate}
              onCreateProject={() => handleCreate("projects")}
              onEditProject={(p: Project) => handleEdit("projects", p)}
              onDeleteProject={(id: number) => handleDelete("projects", id)}
              onCreateTask={() => handleCreate("tasks")}
              onEditTask={(t: TaskItem) => handleEdit("tasks", t)}
              onDeleteTask={(id: number) => handleDelete("tasks", id)}
              onCreateAssignment={() => handleCreate("assignments")}
              onEditAssignment={(a: Assignment) => handleEdit("assignments", a)}
              onDeleteAssignment={(id: number) =>
                handleDelete("assignments", id)
              }
              calculateCoworkerStats={calculateCoworkerStats}
            />
          ) : (
            <PersonalView
              coworkers={coworkers}
              projects={projects}
              tasks={tasks}
              assignments={assignments}
              calculateCoworkerStats={calculateCoworkerStats}
              onCreateTask={() => handleCreate("tasks")}
              onCreateAssignment={(coworkerId) =>
                handleCreate("assignments", coworkerId)
              }
            />
          )}
        </div>
      </div>

      {/* CRUD Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setHasInteractedWithCoworker(false);
        }}
        title={`${modalMode === "create" ? "Create" : "Edit"} ${activeEntity.slice(0, -1)}`}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {activeEntity === "coworkers" && (
            <>
              <Input
                label="Name"
                name="name"
                required
                defaultValue={(editingEntity as Coworker)?.name || ""}
              />
              <Input
                label="Capacity (hours/week)"
                name="capacity"
                type="number"
                required
                defaultValue={(editingEntity as Coworker)?.capacity || 40}
              />
            </>
          )}

          {activeEntity === "projects" && (
            <>
              <Input
                label="Project Name"
                name="name"
                required
                defaultValue={(editingEntity as Project)?.name || ""}
              />
              <Select
                label="Status"
                name="status"
                required
                options={PROJECT_STATUSES.map((s) => ({ value: s, label: s }))}
                defaultValue={(editingEntity as Project)?.status || "Planning"}
              />
            </>
          )}

          {activeEntity === "tasks" && (
            <>
              <Input
                label="Task Name"
                name="name"
                required
                defaultValue={(editingEntity as TaskItem)?.name || ""}
              />
              <Select
                label="Project"
                name="projectId"
                required
                options={[
                  { value: "", label: "Select a project" },
                  ...projects.map((p) => ({ value: p.id, label: p.name })),
                ]}
                defaultValue={(editingEntity as TaskItem)?.projectId || ""}
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

          {activeEntity === "assignments" && (
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
                onChange={(e) => {
                  setSelectedCoworkerId(Number(e.target.value));
                  setHasInteractedWithCoworker(true);
                }}
              />
              {selectedCoworkerId &&
                hasInteractedWithCoworker &&
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
              <div className="space-y-2">
                <label className="block text-sm font-medium text-slate-300">
                  Week <span className="text-red-400">*</span>
                </label>
                <WeekSelector
                  name="week"
                  required
                  defaultYear={(editingEntity as Assignment)?.year}
                  defaultWeek={(editingEntity as Assignment)?.weekNumber}
                />
              </div>
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
              onClick={() => {
                setModalOpen(false);
                setHasInteractedWithCoworker(false);
              }}
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

interface TeamViewProps {
  coworkers: Coworker[];
  projects: Project[];
  tasks: TaskItem[];
  assignments: Assignment[];
  router: ReturnType<typeof useRouter>;
  searchParams: ReturnType<typeof useSearchParams>;
  permissions: ReturnType<typeof usePermissions>;
  onCreateCoworker: () => void;
  onEditCoworker: (c: Coworker) => void;
  onDeleteCoworker: (id: number) => void;
  onReactivateCoworker: (id: number) => void;
  onCreateProject: () => void;
  onEditProject: (p: Project) => void;
  onDeleteProject: (id: number) => void;
  onCreateTask: () => void;
  onEditTask: (t: TaskItem) => void;
  onDeleteTask: (id: number) => void;
  onCreateAssignment: () => void;
  onEditAssignment: (a: Assignment) => void;
  onDeleteAssignment: (id: number) => void;
  calculateCoworkerStats: (id: number) => {
    assignedHours: number;
    capacity: number;
    available: number;
    percentage: number;
  };
}

function TeamView({
  coworkers,
  projects,
  tasks,
  assignments,
  router,
  searchParams,
  permissions,
  onCreateCoworker,
  onEditCoworker,
  onDeleteCoworker,
  onReactivateCoworker,
  onCreateProject,
  onEditProject,
  onDeleteProject,
  onCreateTask,
  onEditTask,
  onDeleteTask,
  onCreateAssignment,
  onEditAssignment,
  onDeleteAssignment,
  calculateCoworkerStats,
}: TeamViewProps) {
  const [activeTab, setActiveTab] = useState<EntityType>(
    (searchParams.get("tab") as EntityType) || "coworkers",
  );

  // Search states for each tab
  const { searchQuery: coworkersSearch, setSearchQuery: setCoworkersSearch } =
    useTableSearch();
  const { searchQuery: projectsSearch, setSearchQuery: setProjectsSearch } =
    useTableSearch();
  const { searchQuery: tasksSearch, setSearchQuery: setTasksSearch } =
    useTableSearch();
  const {
    searchQuery: assignmentsSearch,
    setSearchQuery: setAssignmentsSearch,
  } = useTableSearch();

  // Update URL when tab changes
  const updateActiveTab = (tab: EntityType) => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set("tab", tab);
    router.replace(`/dashboard?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-700">
        <Button
          onClick={() => updateActiveTab("coworkers")}
          variant="secondary"
          size="md"
          className={`rounded-none border-b-2 ${
            activeTab === "coworkers"
              ? "border-blue-500 bg-transparent text-blue-400"
              : "border-transparent bg-transparent text-slate-400 hover:bg-transparent hover:text-white"
          }`}
        >
          Team ({coworkers.length})
        </Button>
        <Button
          onClick={() => updateActiveTab("projects")}
          variant="secondary"
          size="md"
          className={`rounded-none border-b-2 ${
            activeTab === "projects"
              ? "border-blue-500 bg-transparent text-blue-400"
              : "border-transparent bg-transparent text-slate-400 hover:bg-transparent hover:text-white"
          }`}
        >
          Projects ({projects.length})
        </Button>
        <Button
          onClick={() => updateActiveTab("tasks")}
          variant="secondary"
          size="md"
          className={`rounded-none border-b-2 ${
            activeTab === "tasks"
              ? "border-blue-500 bg-transparent text-blue-400"
              : "border-transparent bg-transparent text-slate-400 hover:bg-transparent hover:text-white"
          }`}
        >
          Tasks ({tasks.length})
        </Button>
        <Button
          onClick={() => updateActiveTab("assignments")}
          variant="secondary"
          size="md"
          className={`rounded-none border-b-2 ${
            activeTab === "assignments"
              ? "border-blue-500 bg-transparent text-blue-400"
              : "border-transparent bg-transparent text-slate-400 hover:bg-transparent hover:text-white"
          }`}
        >
          Assignments ({assignments.length})
        </Button>
      </div>

      {activeTab === "coworkers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Team Members</h2>
            <div className="flex items-center gap-3">
              <SearchInput
                value={coworkersSearch}
                onChange={setCoworkersSearch}
                placeholder="Search team members..."
                className="w-64"
              />
              {permissions.canManageCoworkers && (
                <Button onClick={onCreateCoworker}>
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
                  Add Coworker
                </Button>
              )}
            </div>
          </div>
          <Table
            data={coworkers}
            searchQuery={coworkersSearch}
            onSearchChange={setCoworkersSearch}
            columns={[
              {
                header: "Name",
                accessor: (c) => (
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/coworkers/${c.id}`}
                      className={`hover:underline ${
                        c.isActive
                          ? "text-blue-400 hover:text-blue-300"
                          : "text-slate-500 hover:text-slate-400"
                      }`}
                    >
                      {c.name}
                    </Link>
                    {!c.isActive && (
                      <span className="rounded bg-slate-700 px-2 py-0.5 text-xs text-slate-400">
                        Inactive
                      </span>
                    )}
                  </div>
                ),
                sortKey: "name",
              },
              {
                header: "Capacity",
                accessor: (c) => (
                  <span
                    className={!c.isActive ? "text-slate-500 line-through" : ""}
                  >
                    {c.capacity}h/week
                  </span>
                ),
                sortKey: "capacity",
              },
              {
                header: "Assigned",
                accessor: (c) => {
                  const stats = calculateCoworkerStats(c.id);
                  return `${stats.assignedHours}h`;
                },
                sortKey: (c) => calculateCoworkerStats(c.id).assignedHours,
              },
              {
                header: "Available",
                accessor: (c) => {
                  const stats = calculateCoworkerStats(c.id);
                  return (
                    <span
                      className={
                        stats.available < 0
                          ? "text-red-400 font-semibold"
                          : "text-green-400"
                      }
                    >
                      {stats.available}h
                    </span>
                  );
                },
                sortKey: (c) => calculateCoworkerStats(c.id).available,
              },
              {
                header: "Capacity Utilization",
                accessor: (c) => {
                  const stats = calculateCoworkerStats(c.id);
                  return (
                    <div className="flex items-center gap-3">
                      <ProgressBar
                        percentage={stats.percentage}
                        variant="auto"
                        width="w-32"
                      />
                      <span
                        className={`text-sm font-semibold ${
                          stats.percentage > 100
                            ? "text-red-400"
                            : stats.percentage > 80
                              ? "text-yellow-400"
                              : "text-green-400"
                        }`}
                      >
                        {stats.percentage.toFixed(0)}%
                      </span>
                    </div>
                  );
                },
                sortKey: (c) => calculateCoworkerStats(c.id).percentage,
              },
              {
                header: "Actions",
                accessor: (c) => (
                  <div className="flex gap-2">
                    {permissions.canManageCoworkers && (
                      <Button
                        onClick={() => onEditCoworker(c)}
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
                    )}
                    {!c.isActive && permissions.canManageCoworkers && (
                      <Button
                        onClick={() => onReactivateCoworker(c.id)}
                        variant="outline-success"
                        size="icon"
                        title="Reactivate coworker"
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
                              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                            />
                          </svg>
                        }
                      />
                    )}
                    {permissions.canDeleteCoworkers && (
                      <Button
                        onClick={() => onDeleteCoworker(c.id)}
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
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>
      )}

      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Projects</h2>
            <div className="flex items-center gap-3">
              <SearchInput
                value={projectsSearch}
                onChange={setProjectsSearch}
                placeholder="Search projects..."
                className="w-64"
              />
              {permissions.canManageProjects && (
                <Button onClick={onCreateProject}>
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
                  Add Project
                </Button>
              )}
            </div>
          </div>
          <Table
            data={projects}
            searchQuery={projectsSearch}
            onSearchChange={setProjectsSearch}
            columns={[
              {
                header: "Project Name",
                accessor: (p) => (
                  <Link
                    href={`/projects/${p.id}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {p.name}
                  </Link>
                ),
                sortKey: "name",
              },
              {
                header: "Tasks",
                accessor: (p) =>
                  tasks.filter((t) => t.projectId === p.id).length,
                sortKey: (p) =>
                  tasks.filter((t) => t.projectId === p.id).length,
              },
              {
                header: "Total Hours",
                accessor: (p) =>
                  `${tasks
                    .filter((t) => t.projectId === p.id)
                    .reduce((sum, t) => sum + t.estimatedHours, 0)}h`,
                sortKey: (p) =>
                  tasks
                    .filter((t) => t.projectId === p.id)
                    .reduce((sum, t) => sum + t.estimatedHours, 0),
              },
              {
                header: "Status",
                accessor: (p) => {
                  const status = p.status || "Planning";
                  return (
                    <span
                      className={`rounded px-2 py-1 text-xs font-semibold whitespace-nowrap ${
                        status === "Completed"
                          ? "bg-green-950 text-green-200 border border-green-800"
                          : status === "In Progress"
                            ? "bg-blue-900 text-blue-200 border border-blue-800"
                            : status === "On Hold"
                              ? "bg-amber-900 text-amber-200 border border-amber-800"
                              : status === "Cancelled"
                                ? "bg-red-900 text-red-200 border border-red-800"
                                : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}
                    >
                      {status}
                    </span>
                  );
                },
                sortKey: (p) => p.status || "Planning",
                customSortOrder: [
                  "Planning",
                  "In Progress",
                  "On Hold",
                  "Cancelled",
                  "Completed",
                ],
              },
              {
                header: "Created",
                accessor: (p) => {
                  if (!p.createdAt) return "-";
                  const createdDate = new Date(p.createdAt);
                  const now = new Date();
                  const diffMs = now.getTime() - createdDate.getTime();
                  const diffWeeks = Math.floor(
                    diffMs / (1000 * 60 * 60 * 24 * 7),
                  );
                  return diffWeeks === 0
                    ? "This week"
                    : diffWeeks === 1
                      ? "1 week ago"
                      : `${diffWeeks} weeks ago`;
                },
                sortKey: (p) => {
                  if (!p.createdAt) return 0;
                  const createdDate = new Date(p.createdAt);
                  const now = new Date();
                  const diffMs = now.getTime() - createdDate.getTime();
                  return Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7));
                },
              },
              {
                header: "Actions",
                accessor: (p) => (
                  <div className="flex gap-2">
                    {permissions.canManageProjects && (
                      <>
                        <Button
                          onClick={() => onEditProject(p)}
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
                          onClick={() => onDeleteProject(p.id)}
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
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Tasks</h2>
            <div className="flex items-center gap-3">
              <SearchInput
                value={tasksSearch}
                onChange={setTasksSearch}
                placeholder="Search tasks..."
                className="w-64"
              />
              {permissions.canManageTasks && (
                <Button onClick={onCreateTask} variant="primary">
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
          </div>
          <Table
            data={tasks}
            searchQuery={tasksSearch}
            onSearchChange={setTasksSearch}
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
                sortKey: "name",
              },
              {
                header: "Project",
                accessor: (t) => {
                  const project = projects.find((p) => p.id === t.projectId);
                  return project ? (
                    <Link
                      href={`/projects/${project.id}`}
                      className="text-blue-400 hover:text-blue-300 hover:underline"
                    >
                      {project.name}
                    </Link>
                  ) : (
                    "N/A"
                  );
                },
                sortKey: (t) => {
                  const project = projects.find((p) => p.id === t.projectId);
                  return project ? project.name : "N/A";
                },
              },
              {
                header: "Priority",
                accessor: (t) => (
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold whitespace-nowrap ${
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
                sortKey: "status",
                customSortOrder: [
                  "Not started",
                  "In progress",
                  "Continuous",
                  "Completed",
                ],
              },
              {
                header: "Estimated",
                accessor: (t) => `${t.estimatedHours}h`,
                sortKey: "estimatedHours",
              },
              {
                header: "Assigned Total",
                accessor: (t) => {
                  const totalAssigned = assignments
                    .filter((a) => a.taskItemId === t.id)
                    .reduce((sum, a) => sum + a.hoursAssigned, 0);
                  return (
                    <span
                      className={
                        totalAssigned > t.estimatedHours
                          ? "text-red-400 font-semibold"
                          : "text-slate-300"
                      }
                    >
                      {totalAssigned}h
                    </span>
                  );
                },
                sortKey: (t) =>
                  assignments
                    .filter((a) => a.taskItemId === t.id)
                    .reduce((sum, a) => sum + a.hoursAssigned, 0),
              },
              {
                header: "Assignments",
                accessor: (t) =>
                  assignments.filter((a) => a.taskItemId === t.id).length,
                sortKey: (t) =>
                  assignments.filter((a) => a.taskItemId === t.id).length,
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
                sortKey: "note",
              },
              {
                header: "Actions",
                accessor: (t) => (
                  <div className="flex gap-2">
                    {permissions.canManageTasks && (
                      <>
                        <Button
                          onClick={() => onEditTask(t)}
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
                          onClick={() => onDeleteTask(t.id)}
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
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Assignments</h2>
            <div className="flex items-center gap-3">
              <SearchInput
                value={assignmentsSearch}
                onChange={setAssignmentsSearch}
                placeholder="Search assignments..."
                className="w-64"
              />
              {permissions.canManageAssignments && (
                <Button onClick={onCreateAssignment} variant="primary">
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
          </div>
          <Table
            data={assignments}
            searchQuery={assignmentsSearch}
            onSearchChange={setAssignmentsSearch}
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
                sortKey: (a) => {
                  const task = tasks.find((t) => t.id === a.taskItemId);
                  return task ? task.name : "N/A";
                },
              },
              {
                header: "Coworker",
                accessor: (a) => {
                  const coworker = coworkers.find((c) => c.id === a.coworkerId);
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
                sortKey: (a) => {
                  const coworker = coworkers.find((c) => c.id === a.coworkerId);
                  return coworker ? coworker.name : "N/A";
                },
              },
              {
                header: "Assigned This Week",
                accessor: (a) => `${a.hoursAssigned}h`,
                sortKey: "hoursAssigned",
              },
              {
                header: "Week",
                accessor: (a) =>
                  a.year && a.weekNumber ? `${a.year} W${a.weekNumber}` : "-",
                sortKey: (a) =>
                  a.year && a.weekNumber ? a.year * 100 + a.weekNumber : 0,
              },
              {
                header: "Date",
                accessor: (a) =>
                  new Date(a.assignedDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  }),
                sortKey: "assignedDate",
              },
              {
                header: "Note",
                accessor: (a) => a.note || "-",
                sortKey: "note",
              },
              {
                header: "Assigned By",
                accessor: (a) => a.assignedBy || "Unknown User",
                sortKey: "assignedBy",
              },
              {
                header: "Actions",
                accessor: (a) => (
                  <div className="flex gap-2">
                    {permissions.canManageAssignments && (
                      <>
                        <Button
                          onClick={() => onEditAssignment(a)}
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
                          onClick={() => onDeleteAssignment(a.id)}
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
        </div>
      )}
    </div>
  );
}

interface PersonalViewProps {
  coworkers: Coworker[];
  projects: Project[];
  tasks: TaskItem[];
  assignments: Assignment[];
  calculateCoworkerStats: (id: number) => {
    assignedHours: number;
    capacity: number;
    available: number;
    percentage: number;
  };
  onCreateTask: () => void;
  onCreateAssignment: (coworkerId: number) => void;
}

function PersonalView({
  coworkers,
  projects,
  tasks,
  assignments,
  calculateCoworkerStats,
  onCreateTask,
  onCreateAssignment,
}: PersonalViewProps) {
  const [selectedCoworker, setSelectedCoworker] = useState<number | null>(
    coworkers[0]?.id || null,
  );

  const selectedCoworkerData = coworkers.find((c) => c.id === selectedCoworker);
  const coworkerAssignments = assignments.filter(
    (a) => a.coworkerId === selectedCoworker,
  );
  const stats = selectedCoworker
    ? calculateCoworkerStats(selectedCoworker)
    : null;

  // Get unique task IDs from assignments
  const assignedTaskIds = new Set(coworkerAssignments.map((a) => a.taskItemId));
  const assignedTasks = tasks.filter((t) => assignedTaskIds.has(t.id));

  // Group tasks by project
  const tasksByProject = assignedTasks.reduce(
    (acc, task) => {
      const projectId = task.projectId;
      if (!acc[projectId]) {
        acc[projectId] = [];
      }
      acc[projectId].push(task);
      return acc;
    },
    {} as Record<number, TaskItem[]>,
  );

  // Calculate total assigned hours per task for the selected coworker
  const getTaskHours = (taskId: number) => {
    return coworkerAssignments
      .filter((a) => a.taskItemId === taskId)
      .reduce((sum, a) => sum + a.hoursAssigned, 0);
  };

  // Calculate weekly assigned hours for the selected coworker
  const getWeeklyAssignedHours = (
    taskId: number,
    year: number,
    weekNumber: number,
  ) => {
    return coworkerAssignments
      .filter(
        (a) =>
          a.taskItemId === taskId &&
          a.year === year &&
          a.weekNumber === weekNumber,
      )
      .reduce((sum, a) => sum + a.hoursAssigned, 0);
  };

  // Get priority badge color
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "bg-red-900 text-red-200 border border-red-700";
      case "High":
        return "bg-orange-900 text-orange-200 border border-orange-700";
      case "Normal":
        return "bg-blue-900 text-blue-200 border border-blue-700";
      case "Low":
        return "bg-slate-800 text-slate-300 border border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border border-slate-700";
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Completed":
        return "bg-green-950 text-green-200 border border-green-800";
      case "In progress":
        return "bg-blue-900 text-blue-200 border border-blue-800";
      case "Continuous":
        return "bg-purple-900 text-purple-200 border border-purple-800";
      case "Not started":
        return "bg-slate-800 text-slate-300 border border-slate-700";
      default:
        return "bg-slate-800 text-slate-300 border border-slate-700";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Coworker Selector */}
      <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-full bg-blue-600 p-3">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-1">
                Viewing workload for
              </label>
              <select
                value={selectedCoworker || ""}
                onChange={(e) => setSelectedCoworker(Number(e.target.value))}
                className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-lg font-semibold text-white focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {coworkers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {selectedCoworkerData && stats && (
        <>
          {/* Compact Stats Overview */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Capacity Card */}
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">
                  Weekly Capacity
                </h3>
                <span
                  className={`text-3xl font-bold ${stats.percentage > 100 ? "text-red-400" : stats.percentage > 80 ? "text-yellow-400" : "text-green-400"}`}
                >
                  {stats.percentage.toFixed(0)}%
                </span>
              </div>
              <ProgressBar
                percentage={stats.percentage}
                variant="auto"
                showDetails={true}
                current={Math.max(0, stats.assignedHours)}
                total={stats.capacity}
                currentLabel="allocated"
                unit="h"
              />
            </div>

            {/* Task Summary Card */}
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <h3 className="text-lg font-semibold text-white mb-4">
                Task Summary
              </h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">
                    {assignedTasks.length}
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Total Tasks</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-blue-400">
                    {
                      assignedTasks.filter((t) => t.status === "In progress")
                        .length
                    }
                  </p>
                  <p className="text-xs text-slate-400 mt-1">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-green-400">
                    {
                      assignedTasks.filter((t) => t.status === "Completed")
                        .length
                    }
                  </p>
                  <p className="text-xs text-slate-400 mt-1">Completed</p>
                </div>
              </div>
            </div>
          </div>

          {/* Tasks Grouped by Project */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">
                My Tasks by Project
              </h2>
              <Button onClick={onCreateTask} variant="primary" size="md">
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Task
              </Button>
            </div>

            {Object.keys(tasksByProject).length === 0 ? (
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
                  No tasks assigned yet
                </p>
                <p className="text-slate-500 text-sm">
                  Tasks assigned to {selectedCoworkerData.name} will appear here
                </p>
              </div>
            ) : (
              Object.entries(tasksByProject).map(
                ([projectIdStr, projectTasks]) => {
                  const projectId = Number(projectIdStr);
                  const project = projects.find((p) => p.id === projectId);
                  const completedTasks = projectTasks.filter(
                    (t) => t.status === "Completed",
                  ).length;
                  const totalTasks = projectTasks.length;
                  const progress =
                    totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

                  return (
                    <div
                      key={projectId}
                      className="rounded-lg border border-slate-700 bg-slate-800 p-6"
                    >
                      {/* Project Header */}
                      <div className="mb-4 flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Link
                              href={`/projects/${projectId}`}
                              className="text-xl font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                            >
                              {project?.name || "Unknown Project"}
                            </Link>
                          </div>
                          <ProgressBar
                            percentage={progress}
                            variant="green"
                            showDetails={true}
                            current={completedTasks}
                            total={totalTasks}
                            currentLabel="completed"
                            unit=" tasks"
                          />
                        </div>
                      </div>

                      {/* Project Tasks */}
                      <div className="space-y-3">
                        {projectTasks.map((task) => {
                          const taskHours = getTaskHours(task.id);
                          return (
                            <div
                              key={task.id}
                              className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 hover:bg-slate-900 transition-colors"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-2">
                                    <Link
                                      href={`/tasks/${task.id}`}
                                      className="text-blue-400 hover:text-blue-300 hover:underline font-medium truncate"
                                    >
                                      {task.name}
                                    </Link>
                                  </div>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span
                                      className={`rounded px-2 py-1 text-xs font-semibold ${getPriorityColor(task.priority)}`}
                                    >
                                      {task.priority}
                                    </span>
                                    <span
                                      className={`rounded px-2 py-1 text-xs font-semibold ${getStatusColor(task.status)}`}
                                    >
                                      {task.status}
                                    </span>
                                    {task.note && (
                                      <span
                                        className="flex items-center gap-1 text-xs text-slate-400 truncate max-w-xs"
                                        title={task.note}
                                      >
                                        <svg
                                          className="h-3.5 w-3.5 shrink-0"
                                          fill="none"
                                          viewBox="0 0 24 24"
                                          stroke="currentColor"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                          />
                                        </svg>
                                        {task.note}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div className="text-right shrink-0">
                                  <div className="text-lg font-bold text-white">
                                    {taskHours}h
                                  </div>
                                  <div className="text-xs text-slate-400">
                                    total assigned
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )
            )}
          </div>

          {/* Assignments Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-white">My Assignments</h2>
              {selectedCoworker && (
                <Button
                  onClick={() => onCreateAssignment(selectedCoworker)}
                  variant="primary"
                  size="md"
                >
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  Add Assignment
                </Button>
              )}
            </div>

            {coworkerAssignments.length === 0 ? (
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
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
                <p className="text-slate-400 text-lg font-medium mb-2">
                  No assignments yet
                </p>
                <p className="text-slate-500 text-sm">
                  Assignments for {selectedCoworkerData.name} will appear here
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
                <div className="space-y-3">
                  {coworkerAssignments.map((assignment) => {
                    const task = tasks.find(
                      (t) => t.id === assignment.taskItemId,
                    );
                    const weeklyHours =
                      assignment.year && assignment.weekNumber
                        ? getWeeklyAssignedHours(
                            assignment.taskItemId,
                            assignment.year,
                            assignment.weekNumber,
                          )
                        : assignment.hoursAssigned;
                    return (
                      <div
                        key={assignment.id}
                        className="rounded-lg border border-slate-700 bg-slate-900/50 p-4 hover:bg-slate-900 transition-colors"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {task ? (
                                <Link
                                  href={`/tasks/${task.id}`}
                                  className="text-blue-400 hover:text-blue-300 hover:underline font-medium truncate"
                                >
                                  {task.name}
                                </Link>
                              ) : (
                                <span className="text-slate-500 font-medium">
                                  Unknown Task
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              {assignment.year && assignment.weekNumber && (
                                <span className="rounded px-2 py-1 text-xs font-semibold bg-purple-900 text-purple-200 border border-purple-700">
                                  {assignment.year} W{assignment.weekNumber}
                                </span>
                              )}
                              <span className="rounded px-2 py-1 text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                                {new Date(
                                  assignment.assignedDate,
                                ).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                })}
                              </span>
                              {assignment.note && (
                                <span
                                  className="flex items-center gap-1 text-xs text-slate-400 truncate max-w-xs"
                                  title={assignment.note}
                                >
                                  <svg
                                    className="h-3.5 w-3.5 shrink-0"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                                    />
                                  </svg>
                                  {assignment.note}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className="text-lg font-bold text-white">
                              {weeklyHours}h
                            </div>
                            <div className="text-xs text-slate-400">
                              weekly assigned
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
