"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageLayout } from "../../../components/PageLayout";
import { Button } from "../../../components/Button";
import { Table } from "../../../components/Table";

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
}

interface Assignment {
  id: number;
  coworkerId: number;
  taskItemId: number;
  hoursAssigned: number;
  assignedDate: string;
  note?: string;
}

export default function ProjectDetailPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = Number(params.id);

  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, tasksRes, assignmentsRes] = await Promise.all([
          fetch(`${apiBaseUrl}/api/projects/${projectId}`),
          fetch(`${apiBaseUrl}/api/tasks`),
          fetch(`${apiBaseUrl}/api/assignments`),
        ]);

        if (!projectRes.ok) {
          throw new Error("Failed to fetch project");
        }

        const projectData = await projectRes.json();
        const tasksData = await tasksRes.json();
        const assignmentsData = await assignmentsRes.json();

        setProject(projectData);
        const projectTasks = tasksData.filter(
          (t: TaskItem) => t.projectId === projectId,
        );
        setTasks(projectTasks);
        setAssignments(assignmentsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [projectId, apiBaseUrl]);

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
              onClick={() => router.push("/dashboard")}
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

  const progressPercentage =
    tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0;

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
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Project Tasks ({tasks.length})
          </h2>
          {tasksWithAssignments.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
              <p className="text-slate-400">No tasks yet</p>
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
              ]}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
