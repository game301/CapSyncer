"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table } from "../../components/Table";
import { Modal } from "../../components/Modal";
import { Button } from "../../components/Button";
import { Input, Select, Textarea } from "../../components/FormInputs";
import { PageLayout } from "../../components/PageLayout";
import { RoleSwitcher } from "../../components/RoleSwitcher";
import { usePermissions } from "../../contexts/PermissionContext";

// Priority and Status options
const PRIORITIES = ["Low", "Normal", "High", "Critical"];
const STATUSES = ["Not started", "In progress", "Completed", "Continuous"];

interface Coworker {
  id: number;
  name: string;
  capacity: number;
}

interface Project {
  id: number;
  name: string;
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
}

type ViewMode = "team" | "personal";
type EntityType = "coworkers" | "projects" | "tasks" | "assignments";

export default function Dashboard() {
  const router = useRouter();
  const permissions = usePermissions();
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("team");
  const [activeEntity, setActiveEntity] = useState<EntityType>("coworkers");

  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editingEntity, setEditingEntity] = useState<
    Coworker | Project | TaskItem | Assignment | null
  >(null);

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
  }, [fetchData]);

  const handleCreate = (entityType: EntityType) => {
    setModalMode("create");
    setActiveEntity(entityType);
    setEditingEntity(null);
    setModalOpen(true);
  };

  const handleEdit = (
    entityType: EntityType,
    entity: Coworker | Project | TaskItem | Assignment,
  ) => {
    setModalMode("edit");
    setActiveEntity(entityType);
    setEditingEntity(entity);
    setModalOpen(true);
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

    if (!confirm("Are you sure you want to delete this item?")) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/${entityType}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        await fetchData();
      } else {
        alert("Failed to delete");
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
        key === "hoursAssigned"
      ) {
        data[key] = Number(value);
      } else {
        data[key] = String(value);
      }
    });

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
        await fetchData();
      } else {
        alert("Failed to save");
      }
    } catch {
      alert("Error saving item");
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
            <div className="flex items-center gap-4">
              <RoleSwitcher />
              <div className="flex gap-2">
                <Button
                  variant={viewMode === "team" ? "primary" : "secondary"}
                  onClick={() => setViewMode("team")}
                >
                  Team View
                </Button>
                <Button
                  variant={viewMode === "personal" ? "primary" : "secondary"}
                  onClick={() => setViewMode("personal")}
                >
                  Personal View
                </Button>
              </div>
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
              permissions={permissions}
              onCreateCoworker={() => handleCreate("coworkers")}
              onEditCoworker={(c: Coworker) => handleEdit("coworkers", c)}
              onDeleteCoworker={(id: number) => handleDelete("coworkers", id)}
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
              tasks={tasks}
              assignments={assignments}
              calculateCoworkerStats={calculateCoworkerStats}
            />
          )}
        </div>
      </div>

      {/* CRUD Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
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
            <Input
              label="Project Name"
              name="name"
              required
              defaultValue={(editingEntity as Project)?.name || ""}
            />
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
              />
              <Input
                label="Hours Assigned"
                name="hoursAssigned"
                type="number"
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
                type="date"
                required
                defaultValue={
                  (editingEntity as Assignment)?.assignedDate
                    ? new Date((editingEntity as Assignment).assignedDate)
                        .toISOString()
                        .split("T")[0]
                    : new Date().toISOString().split("T")[0]
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

interface TeamViewProps {
  coworkers: Coworker[];
  projects: Project[];
  tasks: TaskItem[];
  assignments: Assignment[];
  router: ReturnType<typeof useRouter>;
  permissions: ReturnType<typeof usePermissions>;
  onCreateCoworker: () => void;
  onEditCoworker: (c: Coworker) => void;
  onDeleteCoworker: (id: number) => void;
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
  permissions,
  onCreateCoworker,
  onEditCoworker,
  onDeleteCoworker,
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
  const [activeTab, setActiveTab] = useState<EntityType>("coworkers");

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-700">
        <button
          onClick={() => setActiveTab("coworkers")}
          className={`px-6 py-3 font-medium transition ${
            activeTab === "coworkers"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Team ({coworkers.length})
        </button>
        <button
          onClick={() => setActiveTab("projects")}
          className={`px-6 py-3 font-medium transition ${
            activeTab === "projects"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Projects ({projects.length})
        </button>
        <button
          onClick={() => setActiveTab("tasks")}
          className={`px-6 py-3 font-medium transition ${
            activeTab === "tasks"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Tasks ({tasks.length})
        </button>
        <button
          onClick={() => setActiveTab("assignments")}
          className={`px-6 py-3 font-medium transition ${
            activeTab === "assignments"
              ? "border-b-2 border-blue-500 text-blue-400"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Assignments ({assignments.length})
        </button>
      </div>

      {activeTab === "coworkers" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Team Members</h2>
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
          <Table
            data={coworkers}
            columns={[
              {
                header: "Name",
                accessor: (c) => (
                  <Link
                    href={`/coworkers/${c.id}`}
                    className="text-blue-400 hover:text-blue-300 hover:underline"
                  >
                    {c.name}
                  </Link>
                ),
              },
              { header: "Capacity", accessor: (c) => `${c.capacity}h/week` },
              {
                header: "Assigned",
                accessor: (c) => {
                  const stats = calculateCoworkerStats(c.id);
                  return `${stats.assignedHours}h`;
                },
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
              },
              {
                header: "Time % Busy",
                accessor: (c) => {
                  const stats = calculateCoworkerStats(c.id);
                  return (
                    <div className="flex items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-slate-700">
                        <div
                          className={`h-full transition-all ${
                            stats.percentage > 100
                              ? "bg-red-500"
                              : stats.percentage > 80
                                ? "bg-yellow-500"
                                : "bg-green-500"
                          }`}
                          style={{
                            width: `${Math.min(stats.percentage, 100)}%`,
                          }}
                        />
                      </div>
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
              },
              {
                header: "Actions",
                accessor: (c) => (
                  <div className="flex gap-2">
                    {permissions.canManageCoworkers && (
                      <button
                        onClick={() => onEditCoworker(c)}
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
                    )}
                    {permissions.canDeleteCoworkers && (
                      <button
                        onClick={() => onDeleteCoworker(c.id)}
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
          <Table
            data={projects}
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
              },
              {
                header: "Tasks",
                accessor: (p) =>
                  tasks.filter((t) => t.projectId === p.id).length,
              },
              {
                header: "Total Hours",
                accessor: (p) =>
                  `${tasks
                    .filter((t) => t.projectId === p.id)
                    .reduce((sum, t) => sum + t.estimatedHours, 0)}h`,
              },
              {
                header: "Actions",
                accessor: (p) => (
                  <div className="flex gap-2">
                    {permissions.canManageProjects && (
                      <>
                        <button
                          onClick={() => onEditProject(p)}
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
                          onClick={() => onDeleteProject(p.id)}
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
        </div>
      )}

      {activeTab === "tasks" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Tasks</h2>
            {permissions.canManageTasks && (
              <Button onClick={onCreateTask}>
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
          <Table
            data={tasks}
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
              { header: "Status", accessor: "status" },
              { header: "Est. Hours", accessor: (t) => `${t.estimatedHours}h` },
              {
                header: "Assigned",
                accessor: (t) =>
                  assignments.filter((a) => a.taskItemId === t.id).length,
              },
              {
                header: "Actions",
                accessor: (t) => (
                  <div className="flex gap-2">
                    {permissions.canManageTasks && (
                      <>
                        <button
                          onClick={() => onEditTask(t)}
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
                          onClick={() => onDeleteTask(t.id)}
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
        </div>
      )}

      {activeTab === "assignments" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-white">Assignments</h2>
            {permissions.canManageAssignments && (
              <Button onClick={onCreateAssignment}>
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
          <Table
            data={assignments}
            columns={[
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
              { header: "Hours", accessor: (a) => `${a.hoursAssigned}h` },
              {
                header: "Date",
                accessor: (a) => new Date(a.assignedDate).toLocaleDateString(),
              },
              { header: "Note", accessor: (a) => a.note || "-" },
              {
                header: "Actions",
                accessor: (a) => (
                  <div className="flex gap-2">
                    {permissions.canManageAssignments && (
                      <>
                        <button
                          onClick={() => onEditAssignment(a)}
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
                          onClick={() => onDeleteAssignment(a.id)}
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
        </div>
      )}
    </div>
  );
}

interface PersonalViewProps {
  coworkers: Coworker[];
  tasks: TaskItem[];
  assignments: Assignment[];
  calculateCoworkerStats: (id: number) => {
    assignedHours: number;
    capacity: number;
    available: number;
    percentage: number;
  };
}

function PersonalView({
  coworkers,
  tasks,
  assignments,
  calculateCoworkerStats,
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-lg font-semibold text-white">
          Select Team Member:
        </label>
        <select
          value={selectedCoworker || ""}
          onChange={(e) => setSelectedCoworker(Number(e.target.value))}
          className="rounded-lg border border-slate-600 bg-slate-700 px-4 py-2 text-white"
        >
          {coworkers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {selectedCoworkerData && stats && (
        <>
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <p className="text-sm text-slate-400">Weekly Capacity</p>
              <p className="mt-2 text-3xl font-bold text-white">
                {stats.capacity}h
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <p className="text-sm text-slate-400">Assigned Hours</p>
              <p className="mt-2 text-3xl font-bold text-blue-400">
                {Math.max(0, stats.assignedHours)}h
              </p>
            </div>
            <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
              <p className="text-sm text-slate-400">Available</p>
              <p
                className={`mt-2 text-3xl font-bold ${stats.available < 0 ? "text-red-400" : "text-green-400"}`}
              >
                {Math.max(0, stats.available)}h
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Time % Busy</h3>
              <span
                className={`text-2xl font-bold ${stats.percentage > 100 ? "text-red-400" : stats.percentage > 80 ? "text-yellow-400" : "text-green-400"}`}
              >
                {stats.percentage.toFixed(0)}%
              </span>
            </div>
            <div className="h-4 overflow-hidden rounded-full bg-slate-700">
              <div
                className={`h-full transition-all ${stats.percentage > 100 ? "bg-red-500" : stats.percentage > 80 ? "bg-yellow-500" : "bg-green-500"}`}
                style={{ width: `${Math.min(stats.percentage, 100)}%` }}
              />
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white">Assignments</h2>
            {coworkerAssignments.length === 0 ? (
              <p className="text-slate-400">No assignments found</p>
            ) : (
              <Table
                data={coworkerAssignments}
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
                    header: "Priority",
                    accessor: (a) => {
                      const task = tasks.find((t) => t.id === a.taskItemId);
                      return task ? (
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            task.priority === "High"
                              ? "bg-red-900 text-red-200"
                              : task.priority === "Medium"
                                ? "bg-yellow-900 text-yellow-200"
                                : "bg-green-900 text-green-200"
                          }`}
                        >
                          {task.priority}
                        </span>
                      ) : (
                        "N/A"
                      );
                    },
                  },
                  {
                    header: "Status",
                    accessor: (a) =>
                      tasks.find((t) => t.id === a.taskItemId)?.status || "N/A",
                  },
                  {
                    header: "Assigned Hours",
                    accessor: (a) => `${Math.max(0, a.hoursAssigned)}h`,
                  },
                  {
                    header: "Date",
                    accessor: (a) =>
                      new Date(a.assignedDate).toLocaleDateString(),
                  },
                  { header: "Note", accessor: (a) => a.note || "-" },
                ]}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
}
