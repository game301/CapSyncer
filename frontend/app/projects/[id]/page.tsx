"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "../../../components/PageLayout";
import { Button } from "../../../components/Button";

interface Project {
  id: number;
  name: string;
  description: string;
  startDate: string;
  endDate?: string;
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

  useEffect(() => {
    async function fetchData() {
      try {
        const [projectRes, tasksRes, assignmentsRes] = await Promise.all([
          fetch(`/api/projects/${projectId}`),
          fetch("/api/tasks"),
          fetch("/api/assignments"),
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
  }, [projectId]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-white">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !project) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-red-400">
            {error || "Project not found"}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Calculate stats
  const totalEstimatedHours = tasks.reduce(
    (sum, t) => sum + t.estimatedHours,
    0,
  );
  const totalAssignedHours = assignments
    .filter((a) => tasks.some((t) => t.id === a.taskItemId))
    .reduce((sum, a) => sum + a.hoursAssigned, 0);

  const completedTasks = tasks.filter((t) => t.status === "Completed").length;
  const inProgressTasks = tasks.filter(
    (t) => t.status === "In Progress",
  ).length;
  const todoTasks = tasks.filter((t) => t.status === "To Do").length;

  const projectStatus = project.endDate
    ? new Date(project.endDate) < new Date()
      ? "Completed"
      : "Active"
    : "Active";

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-4 py-8">
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
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-white">
                  {project.name}
                </h1>
                <span
                  className={`rounded px-3 py-1 text-sm font-semibold ${
                    projectStatus === "Completed"
                      ? "bg-green-900 text-green-200"
                      : "bg-blue-900 text-blue-200"
                  }`}
                >
                  {projectStatus}
                </span>
              </div>
              {project.description && (
                <p className="mt-3 text-slate-300">{project.description}</p>
              )}
            </div>
            <div className="ml-4 rounded-full bg-purple-600 p-4">
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

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="flex items-center text-slate-300">
              <svg
                className="mr-3 h-5 w-5 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              Start: {new Date(project.startDate).toLocaleDateString()}
            </div>
            {project.endDate && (
              <div className="flex items-center text-slate-300">
                <svg
                  className="mr-3 h-5 w-5 text-slate-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                End: {new Date(project.endDate).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <div className="text-sm font-medium text-slate-400">
              Total Tasks
            </div>
            <div className="mt-2 text-2xl font-bold text-white">
              {tasks.length}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <div className="text-sm font-medium text-slate-400">Completed</div>
            <div className="mt-2 text-2xl font-bold text-green-400">
              {completedTasks}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <div className="text-sm font-medium text-slate-400">
              In Progress
            </div>
            <div className="mt-2 text-2xl font-bold text-yellow-400">
              {inProgressTasks}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-4">
            <div className="text-sm font-medium text-slate-400">To Do</div>
            <div className="mt-2 text-2xl font-bold text-blue-400">
              {todoTasks}
            </div>
          </div>
        </div>

        {/* Hours Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-sm font-medium text-slate-400">
              Estimated Hours
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {totalEstimatedHours}h
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-sm font-medium text-slate-400">
              Assigned Hours
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {totalAssignedHours}h
            </div>
          </div>
        </div>

        {/* Tasks List */}
        <div className="rounded-lg border border-slate-700 bg-slate-800">
          <div className="border-b border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white">Tasks</h2>
          </div>
          {tasks.length === 0 ? (
            <div className="p-8 text-center text-slate-400">No tasks yet</div>
          ) : (
            <div className="divide-y divide-slate-700">
              {tasks.map((task) => {
                const taskAssignments = assignments.filter(
                  (a) => a.taskItemId === task.id,
                );
                const taskAssignedHours = taskAssignments.reduce(
                  (sum, a) => sum + a.hoursAssigned,
                  0,
                );

                return (
                  <div
                    key={task.id}
                    className="cursor-pointer p-6 transition-colors hover:bg-slate-700"
                    onClick={() => router.push(`/tasks/${task.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {task.name}
                        </h3>
                        <div className="mt-2 flex flex-wrap gap-2">
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
                          <span
                            className={`rounded px-2 py-1 text-xs font-semibold ${
                              task.status === "Completed"
                                ? "bg-green-900 text-green-200"
                                : task.status === "In Progress"
                                  ? "bg-yellow-900 text-yellow-200"
                                  : "bg-blue-900 text-blue-200"
                            }`}
                          >
                            {task.status}
                          </span>
                        </div>
                        {taskAssignments.length > 0 && (
                          <div className="mt-2 text-sm text-slate-400">
                            {taskAssignments.length} assignment
                            {taskAssignments.length !== 1 ? "s" : ""} •{" "}
                            {taskAssignedHours}h assigned
                          </div>
                        )}
                      </div>
                      <div className="ml-4 text-right">
                        <div className="text-lg font-bold text-white">
                          {task.estimatedHours}h
                        </div>
                        <div className="text-xs text-slate-400">estimated</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
