"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "../../../components/PageLayout";
import { Button } from "../../../components/Button";

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

export default function AssignmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const assignmentId = Number(params.id);

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [coworker, setCoworker] = useState<Coworker | null>(null);
  const [task, setTask] = useState<TaskItem | null>(null);
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [assignmentRes, coworkersRes, tasksRes, projectsRes] =
          await Promise.all([
            fetch(`/api/assignments/${assignmentId}`),
            fetch("/api/coworkers"),
            fetch("/api/tasks"),
            fetch("/api/projects"),
          ]);

        if (!assignmentRes.ok) {
          throw new Error("Failed to fetch assignment");
        }

        const assignmentData = await assignmentRes.json();
        const coworkersData = await coworkersRes.json();
        const tasksData = await tasksRes.json();
        const projectsData = await projectsRes.json();

        setAssignment(assignmentData);

        const foundCoworker = coworkersData.find(
          (c: Coworker) => c.id === assignmentData.coworkerId,
        );
        setCoworker(foundCoworker || null);

        const foundTask = tasksData.find(
          (t: TaskItem) => t.id === assignmentData.taskItemId,
        );
        setTask(foundTask || null);

        if (foundTask) {
          const foundProject = projectsData.find(
            (p: Project) => p.id === foundTask.projectId,
          );
          setProject(foundProject || null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [assignmentId]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-white">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !assignment) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-red-400">
            {error || "Assignment not found"}
          </div>
        </div>
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-4xl px-4 py-8">
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

        {/* Assignment Header */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">
                Assignment Details
              </h1>
              <p className="mt-2 text-slate-400">
                Created on{" "}
                {new Date(assignment.assignedDate).toLocaleDateString()}
              </p>
            </div>
            <div className="rounded-full bg-cyan-600 p-4">
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
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Hours Allocated */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-linear-to-br from-blue-900/20 to-purple-900/20 p-8 text-center">
          <div className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Hours Allocated
          </div>
          <div className="mt-2 text-6xl font-bold text-white">
            {assignment.hoursAssigned}h
          </div>
        </div>

        {/* Team Member Card */}
        {coworker ? (
          <div
            className="mb-6 cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-6 transition-colors hover:bg-slate-700"
            onClick={() => router.push(`/coworkers/${coworker.id}`)}
          >
            <div className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
              Assigned To
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-blue-600 p-4">
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
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">
                  {coworker.name}
                </h2>
                <p className="mt-1 text-slate-400">{coworker.role}</p>
                <p className="text-sm text-slate-500">{coworker.email}</p>
              </div>
              <svg
                className="h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-slate-400">
              Team member information not available
            </div>
          </div>
        )}

        {/* Task Card */}
        {task ? (
          <div
            className="mb-6 cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-6 transition-colors hover:bg-slate-700"
            onClick={() => router.push(`/tasks/${task.id}`)}
          >
            <div className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
              Task
            </div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{task.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
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
                <div className="mt-3 text-sm text-slate-400">
                  Estimated: {task.estimatedHours}h
                </div>
              </div>
              <svg
                className="ml-4 h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-slate-400">Task information not available</div>
          </div>
        )}

        {/* Project Card */}
        {project ? (
          <div
            className="mb-6 cursor-pointer rounded-lg border border-slate-700 bg-slate-800 p-6 transition-colors hover:bg-slate-700"
            onClick={() => router.push(`/projects/${project.id}`)}
          >
            <div className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
              Project
            </div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{project.name}</h2>
                {project.description && (
                  <p className="mt-2 text-slate-400">{project.description}</p>
                )}
                <div className="mt-3 text-sm text-slate-500">
                  {new Date(project.startDate).toLocaleDateString()}
                  {project.endDate &&
                    ` - ${new Date(project.endDate).toLocaleDateString()}`}
                </div>
              </div>
              <svg
                className="ml-4 h-6 w-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
            </div>
          </div>
        ) : task ? (
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-slate-400">
              Project information not available
            </div>
          </div>
        ) : null}

        {/* Notes */}
        {assignment.note && (
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="mb-3 text-sm font-medium uppercase tracking-wide text-slate-400">
              Notes
            </div>
            <p className="text-slate-300">{assignment.note}</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
