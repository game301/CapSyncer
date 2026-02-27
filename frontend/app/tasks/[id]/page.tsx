"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageLayout } from "../../../components/PageLayout";
import { Button } from "../../../components/Button";
import { Table } from "../../../components/Table";

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
  const taskId = Number(params.id);

  const [task, setTask] = useState<TaskItem | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

  useEffect(() => {
    async function fetchData() {
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
          projectsData.find((p: Project) => p.id === taskData.projectId) ||
            null,
        );
        setAssignments(
          assignmentsData.filter((a: Assignment) => a.taskItemId === taskId),
        );
        setCoworkers(coworkersData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [taskId, apiBaseUrl]);

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
          <h2 className="mb-4 text-2xl font-bold text-white">
            Assigned Team Members ({taskAssignments.length})
          </h2>
          {taskAssignments.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
              <p className="text-slate-400">No team members assigned yet</p>
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
              ]}
            />
          )}
        </div>
      </div>
    </PageLayout>
  );
}
