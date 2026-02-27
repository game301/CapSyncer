"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { PageLayout } from "../../../components/PageLayout";
import { Button } from "../../../components/Button";
import { Table } from "../../../components/Table";

interface Coworker {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
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

interface Project {
  id: number;
  name: string;
}

export default function CoworkerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const coworkerId = Number(params.id);

  const [coworker, setCoworker] = useState<Coworker | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

  useEffect(() => {
    async function fetchData() {
      try {
        const [coworkerRes, assignmentsRes, tasksRes, projectsRes] =
          await Promise.all([
            fetch(`${apiBaseUrl}/api/coworkers/${coworkerId}`),
            fetch(`${apiBaseUrl}/api/assignments`),
            fetch(`${apiBaseUrl}/api/tasks`),
            fetch(`${apiBaseUrl}/api/projects`),
          ]);

        if (!coworkerRes.ok) {
          throw new Error("Failed to fetch coworker");
        }

        const coworkerData = await coworkerRes.json();
        const assignmentsData = await assignmentsRes.json();
        const tasksData = await tasksRes.json();
        const projectsData = await projectsRes.json();

        setCoworker(coworkerData);
        setAssignments(
          assignmentsData.filter(
            (a: Assignment) => a.coworkerId === coworkerId,
          ),
        );
        setTasks(tasksData);
        setProjects(projectsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [coworkerId, apiBaseUrl]);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
            <p className="text-slate-400">Loading coworker details...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (error || !coworker) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center p-8">
          <div className="rounded-lg border border-red-700 bg-red-900/20 p-6 max-w-2xl">
            <p className="font-semibold text-red-300">
              {error || "Coworker not found"}
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

  const totalHours = assignments.reduce((sum, a) => sum + a.hoursAssigned, 0);
  const availableHours = coworker.capacity - totalHours;
  const usagePercentage = (totalHours / coworker.capacity) * 100;

  const coworkerAssignments = assignments.map((assignment) => {
    const task = tasks.find((t) => t.id === assignment.taskItemId);
    const project = projects.find((p) => p.id === task?.projectId);
    return {
      ...assignment,
      task,
      project,
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

        {/* Coworker Info Card */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white">{coworker.name}</h1>
              <p className="mt-2 text-slate-400">Team Member</p>
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
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-4">
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Weekly Capacity</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {coworker.capacity}h
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Assigned Hours</p>
            <p className="mt-2 text-3xl font-bold text-blue-400">
              {totalHours}h
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Available</p>
            <p
              className={`mt-2 text-3xl font-bold ${availableHours < 0 ? "text-red-400" : "text-green-400"}`}
            >
              {availableHours}h
            </p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
            <p className="text-sm text-slate-400">Usage</p>
            <p
              className={`mt-2 text-3xl font-bold ${usagePercentage > 100 ? "text-red-400" : usagePercentage > 80 ? "text-yellow-400" : "text-green-400"}`}
            >
              {usagePercentage.toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Capacity Bar */}
        <div className="mb-8 rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h3 className="mb-4 text-lg font-semibold text-white">
            Capacity Overview
          </h3>
          <div className="h-8 overflow-hidden rounded-full bg-slate-700">
            <div
              className={`h-full transition-all ${usagePercentage > 100 ? "bg-red-500" : usagePercentage > 80 ? "bg-yellow-500" : "bg-green-500"}`}
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            />
          </div>
          <div className="mt-2 flex justify-between text-sm text-slate-400">
            <span>0h</span>
            <span>{coworker.capacity}h capacity</span>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="rounded-lg border border-slate-700 bg-slate-800 p-6">
          <h2 className="mb-4 text-2xl font-bold text-white">
            Task Assignments ({assignments.length})
          </h2>
          {coworkerAssignments.length === 0 ? (
            <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-12 text-center">
              <p className="text-slate-400">No assignments yet</p>
            </div>
          ) : (
            <Table
              data={coworkerAssignments}
              columns={[
                {
                  header: "Task",
                  accessor: (a) =>
                    a.task ? (
                      <Link
                        href={`/tasks/${a.task.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {a.task.name}
                      </Link>
                    ) : (
                      "N/A"
                    ),
                },
                {
                  header: "Project",
                  accessor: (a) =>
                    a.project ? (
                      <Link
                        href={`/projects/${a.project.id}`}
                        className="text-blue-400 hover:text-blue-300 hover:underline"
                      >
                        {a.project.name}
                      </Link>
                    ) : (
                      "N/A"
                    ),
                },
                {
                  header: "Priority",
                  accessor: (a) =>
                    a.task ? (
                      <span
                        className={`rounded px-2 py-1 text-xs font-semibold ${
                          a.task.priority === "Critical"
                            ? "bg-red-950 text-red-200 border border-red-800"
                            : a.task.priority === "High"
                              ? "bg-orange-900 text-orange-200"
                              : a.task.priority === "Normal"
                                ? "bg-yellow-900 text-yellow-200"
                                : "bg-green-900 text-green-200"
                        }`}
                      >
                        {a.task.priority}
                      </span>
                    ) : (
                      "N/A"
                    ),
                },
                {
                  header: "Status",
                  accessor: (a) => a.task?.status || "N/A",
                },
                {
                  header: "Hours",
                  accessor: (a) => `${a.hoursAssigned}h`,
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
