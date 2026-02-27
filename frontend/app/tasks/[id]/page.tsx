"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "../../../components/PageLayout";
import { Button } from "../../../components/Button";

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
  description: string;
  startDate: string;
  endDate?: string;
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
  email: string;
  role: string;
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

  useEffect(() => {
    async function fetchData() {
      try {
        const [taskRes, projectsRes, assignmentsRes, coworkersRes] =
          await Promise.all([
            fetch(`/api/tasks/${taskId}`),
            fetch("/api/projects"),
            fetch("/api/assignments"),
            fetch("/api/coworkers"),
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
  }, [taskId]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-white">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !task) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-red-400">
            {error || "Task not found"}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Get assignments with coworker details
  const taskAssignments = assignments.map((assignment) => {
    const coworker = coworkers.find((c) => c.id === assignment.coworkerId);
    return {
      ...assignment,
      coworkerName: coworker?.name || "Unknown",
      coworkerEmail: coworker?.email || "",
      coworkerRole: coworker?.role || "",
    };
  });

  const totalAssignedHours = taskAssignments.reduce(
    (sum, a) => sum + a.hoursAssigned,
    0,
  );
  const hoursRemaining = Math.max(0, task.estimatedHours - totalAssignedHours);

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

        {/* Task Info Card */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white">{task.name}</h1>
              <div className="mt-3 flex flex-wrap gap-2">
                <span
                  className={`rounded px-3 py-1 text-sm font-semibold ${
                    task.priority === "High"
                      ? "bg-red-900 text-red-200"
                      : task.priority === "Medium"
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
                      : task.status === "In Progress"
                        ? "bg-yellow-900 text-yellow-200"
                        : "bg-blue-900 text-blue-200"
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
            <button
              onClick={() => router.push(`/projects/${project.id}`)}
              className="mt-4 flex items-center gap-2 text-blue-400 transition-colors hover:text-blue-300"
            >
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
              <span className="text-sm font-medium">
                Project: {project.name}
              </span>
            </button>
          )}
        </div>

        {/* Hours Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-sm font-medium text-slate-400">
              Estimated Hours
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {task.estimatedHours}h
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-sm font-medium text-slate-400">
              Assigned Hours
            </div>
            <div className="mt-2 text-3xl font-bold text-blue-400">
              {totalAssignedHours}h
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-sm font-medium text-slate-400">
              Remaining Hours
            </div>
            <div
              className={`mt-2 text-3xl font-bold ${hoursRemaining > 0 ? "text-yellow-400" : "text-green-400"}`}
            >
              {hoursRemaining}h
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {task.estimatedHours > 0 && (
          <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-slate-300">
                Assignment Progress
              </span>
              <span className="font-semibold text-white">
                {Math.round((totalAssignedHours / task.estimatedHours) * 100)}%
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-700">
              <div
                className={`h-full transition-all ${
                  totalAssignedHours > task.estimatedHours
                    ? "bg-red-500"
                    : totalAssignedHours === task.estimatedHours
                      ? "bg-green-500"
                      : "bg-blue-500"
                }`}
                style={{
                  width: `${Math.min(100, (totalAssignedHours / task.estimatedHours) * 100)}%`,
                }}
              />
            </div>
            {totalAssignedHours > task.estimatedHours && (
              <p className="mt-2 text-sm text-red-400">
                ⚠️ Over-allocated by {totalAssignedHours - task.estimatedHours}{" "}
                hours
              </p>
            )}
          </div>
        )}

        {/* Assignments List */}
        <div className="rounded-lg border border-slate-700 bg-slate-800">
          <div className="border-b border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white">
              Assigned Team Members
            </h2>
          </div>
          {taskAssignments.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No assignments yet
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {taskAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="cursor-pointer p-6 transition-colors hover:bg-slate-700"
                  onClick={() =>
                    router.push(`/coworkers/${assignment.coworkerId}`)
                  }
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
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
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">
                          {assignment.coworkerName}
                        </h3>
                        <p className="mt-1 text-sm text-slate-400">
                          {assignment.coworkerRole}
                        </p>
                        <p className="text-sm text-slate-500">
                          {assignment.coworkerEmail}
                        </p>
                        {assignment.note && (
                          <p className="mt-2 text-sm italic text-slate-400">
                            Note: {assignment.note}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="ml-4 text-right">
                      <div className="text-2xl font-bold text-white">
                        {assignment.hoursAssigned}h
                      </div>
                      <div className="mt-1 text-sm text-slate-400">
                        {new Date(assignment.assignedDate).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
