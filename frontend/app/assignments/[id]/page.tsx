"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
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
  capacity: number;
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

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

  useEffect(() => {
    async function fetchData() {
      try {
        const [assignmentRes, coworkersRes, tasksRes, projectsRes] =
          await Promise.all([
            fetch(`${apiBaseUrl}/api/assignments/${assignmentId}`),
            fetch(`${apiBaseUrl}/api/coworkers`),
            fetch(`${apiBaseUrl}/api/tasks`),
            fetch(`${apiBaseUrl}/api/projects`),
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
  }, [assignmentId, apiBaseUrl]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
            <p className="text-slate-400">Loading assignment details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !assignment) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-6 max-w-2xl">
            <p className="font-semibold text-red-300">
              {error || "Assignment not found"}
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

  return (
    <PageLayout>
      <div className="mx-auto max-w-5xl px-6 py-8">
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
              <h1 className="text-4xl font-bold text-white">
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
        <div className="mb-8 rounded-lg border border-slate-700 bg-gradient-to-br from-blue-900/20 to-purple-900/20 p-8 text-center">
          <div className="text-sm font-medium uppercase tracking-wide text-slate-400">
            Hours Allocated
          </div>
          <div className="mt-2 text-6xl font-bold text-white">
            {assignment.hoursAssigned}h
          </div>
        </div>

        {/* Team Member Card */}
        {coworker ? (
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Assigned To
              </div>
              <Link
                href={`/coworkers/${coworker.id}`}
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
              >
                View Profile &rarr;
              </Link>
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
                <p className="mt-1 text-slate-400">
                  Weekly Capacity: {coworker.capacity}h
                </p>
              </div>
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
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Task
              </div>
              <Link
                href={`/tasks/${task.id}`}
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
              >
                View Task &rarr;
              </Link>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-white">{task.name}</h2>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span
                    className={`rounded px-2 py-1 text-xs font-semibold ${
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
                    className={`rounded px-2 py-1 text-xs font-semibold ${
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
                <div className="mt-3 text-sm text-slate-400">
                  Estimated: {task.estimatedHours}h
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-slate-400">Task information not available</div>
          </div>
        )}

        {/* Project Card */}
        {project ? (
          <div className="mb-6 rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm font-medium uppercase tracking-wide text-slate-400">
                Project
              </div>
              <Link
                href={`/projects/${project.id}`}
                className="text-sm text-blue-400 hover:text-blue-300 hover:underline"
              >
                View Project &rarr;
              </Link>
            </div>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white">{project.name}</h2>
              </div>
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
