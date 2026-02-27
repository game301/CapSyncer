"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { PageLayout } from "../../../components/PageLayout";
import { Button } from "../../../components/Button";

interface Coworker {
  id: number;
  name: string;
  email: string;
  role: string;
}

interface Assignment {
  id: number;
  coworkerId: number;
  taskItemId: number;
  hoursAssigned: number;
  assignedDate: string;
  note?: string;
}

interface TaskItem {
  id: number;
  name: string;
  projectId: number;
  priority: string;
  status: string;
  estimatedHours: number;
}

export default function CoworkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const coworkerId = Number(params.id);

  const [coworker, setCoworker] = useState<Coworker | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [coworkerRes, assignmentsRes, tasksRes] = await Promise.all([
          fetch(`/api/coworkers/${coworkerId}`),
          fetch("/api/assignments"),
          fetch("/api/tasks"),
        ]);

        if (!coworkerRes.ok) {
          throw new Error("Failed to fetch coworker");
        }

        const coworkerData = await coworkerRes.json();
        const assignmentsData = await assignmentsRes.json();
        const tasksData = await tasksRes.json();

        setCoworker(coworkerData);
        setAssignments(
          assignmentsData.filter(
            (a: Assignment) => a.coworkerId === coworkerId,
          ),
        );
        setTasks(tasksData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [coworkerId]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-white">Loading...</div>
        </div>
      </PageLayout>
    );
  }

  if (error || !coworker) {
    return (
      <PageLayout>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-xl text-red-400">
            {error || "Coworker not found"}
          </div>
        </div>
      </PageLayout>
    );
  }

  // Get coworker's assignments with task details
  const coworkerAssignments = assignments.map((assignment) => {
    const task = tasks.find((t) => t.id === assignment.taskItemId);
    return {
      ...assignment,
      taskName: task?.name || "Unknown Task",
      taskPriority: task?.priority || "N/A",
      taskStatus: task?.status || "N/A",
    };
  });

  const totalHours = coworkerAssignments.reduce(
    (sum, a) => sum + a.hoursAssigned,
    0,
  );

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

        {/* Coworker Info Card */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="mb-4 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold text-white">{coworker.name}</h1>
              <p className="mt-2 text-lg text-slate-400">{coworker.role}</p>
            </div>
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
          </div>

          <div className="space-y-2">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {coworker.email}
            </div>
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
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              {coworker.role}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-sm font-medium text-slate-400">
              Total Assignments
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {coworkerAssignments.length}
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-sm font-medium text-slate-400">
              Total Hours
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {totalHours}h
            </div>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <div className="text-sm font-medium text-slate-400">
              Avg Hours/Task
            </div>
            <div className="mt-2 text-3xl font-bold text-white">
              {coworkerAssignments.length > 0
                ? (totalHours / coworkerAssignments.length).toFixed(1)
                : 0}
              h
            </div>
          </div>
        </div>

        {/* Assignments List */}
        <div className="rounded-lg border border-slate-700 bg-slate-800">
          <div className="border-b border-slate-700 p-6">
            <h2 className="text-2xl font-bold text-white">Assignments</h2>
          </div>
          {coworkerAssignments.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              No assignments yet
            </div>
          ) : (
            <div className="divide-y divide-slate-700">
              {coworkerAssignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="cursor-pointer p-6 transition-colors hover:bg-slate-700"
                  onClick={() => router.push(`/tasks/${assignment.taskItemId}`)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white">
                        {assignment.taskName}
                      </h3>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span
                          className={`rounded px-2 py-1 text-xs font-semibold ${
                            assignment.taskPriority === "High"
                              ? "bg-red-900 text-red-200"
                              : assignment.taskPriority === "Medium"
                                ? "bg-yellow-900 text-yellow-200"
                                : "bg-green-900 text-green-200"
                          }`}
                        >
                          {assignment.taskPriority}
                        </span>
                        <span className="rounded bg-slate-700 px-2 py-1 text-xs font-semibold text-slate-300">
                          {assignment.taskStatus}
                        </span>
                      </div>
                      {assignment.note && (
                        <p className="mt-2 text-sm text-slate-400">
                          {assignment.note}
                        </p>
                      )}
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
