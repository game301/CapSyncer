"use client";

import { useEffect, useState, useCallback } from "react";
import { Modal } from "./Modal";
import { ActionButtons } from "./ActionButtons";
import Link from "next/link";
import { ProgressBar } from "./ProgressBar";

interface WeeklyCapacityProps {
  coworkerId: number;
  coworkerName: string;
  year: number;
  onCreateTask?: () => void;
  onCreateAssignment?: (coworkerId: number) => void;
}

interface WeekData {
  weekNumber: number;
  year: number;
  capacity: number;
  usedHours: number;
  availableHours: number;
  utilizationPercentage: number;
  assignmentCount: number;
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

interface Project {
  id: number;
  name: string;
}

export function WeeklyCapacityView({
  coworkerId,
  coworkerName,
  year: initialYear,
  onCreateTask,
  onCreateAssignment,
}: WeeklyCapacityProps) {
  const [year, setYear] = useState(initialYear);
  const [weekData, setWeekData] = useState<WeekData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

  const fetchWeeklyData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(
        `${apiBaseUrl}/api/capacity/weekly/${coworkerId}/${year}`,
      );
      if (response.ok) {
        const data = await response.json();
        setWeekData(data);
      } else {
        console.error("Failed to fetch weekly capacity data");
      }
    } catch (error) {
      console.error("Error fetching weekly capacity:", error);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, coworkerId, year]);

  const fetchAssignmentsAndTasks = useCallback(async () => {
    try {
      const [assignmentsRes, tasksRes, projectsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/assignments`),
        fetch(`${apiBaseUrl}/api/tasks`),
        fetch(`${apiBaseUrl}/api/projects`),
      ]);

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data);
      }
      if (tasksRes.ok) {
        const data = await tasksRes.json();
        setTasks(data);
      }
      if (projectsRes.ok) {
        const data = await projectsRes.json();
        setProjects(data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    fetchWeeklyData();
    fetchAssignmentsAndTasks();
  }, [fetchWeeklyData, fetchAssignmentsAndTasks]);

  const getUtilizationColor = (percentage: number) => {
    if (percentage === 0) return "bg-slate-700";
    if (percentage < 50) return "bg-green-600";
    if (percentage < 80) return "bg-yellow-600";
    if (percentage < 100) return "bg-orange-600";
    return "bg-red-600";
  };

  const getUtilizationTextColor = (percentage: number) => {
    if (percentage === 0) return "text-slate-400";
    if (percentage < 50) return "text-green-400";
    if (percentage < 80) return "text-yellow-400";
    if (percentage < 100) return "text-orange-400";
    return "text-red-400";
  };

  // Get current week for highlighting
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentWeek = getISOWeek(now);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
          <p className="text-slate-400">Loading weekly capacity...</p>
        </div>
      </div>
    );
  }

  // Group weeks by month for better visualization
  // Use Thursday of the week (ISO standard) to determine which month the week belongs to
  const weeksByMonth: {
    [key: string]: { weeks: WeekData[]; monthNumber: number };
  } = {};
  weekData.forEach((week) => {
    const weekStartDate = getWeekStartDate(week.year, week.weekNumber);
    // Get Thursday of the week (day 3, since Monday is day 0)
    const thursday = new Date(weekStartDate);
    thursday.setDate(weekStartDate.getDate() + 3);

    const monthKey = thursday.toLocaleDateString("en-US", { month: "long" });
    const monthNumber = thursday.getMonth(); // 0-11

    if (!weeksByMonth[monthKey]) {
      weeksByMonth[monthKey] = { weeks: [], monthNumber };
    }
    weeksByMonth[monthKey].weeks.push(week);
  });

  // Sort months by month number (January=0 to December=11)
  const sortedMonths = Object.entries(weeksByMonth).sort((a, b) => {
    return a[1].monthNumber - b[1].monthNumber;
  });

  return (
    <div className="space-y-6">
      {/* Header with year selector */}
      <div className="flex items-center justify-between rounded-lg bg-slate-800 p-4">
        <h3 className="text-xl font-bold text-white">{coworkerName}</h3>
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-slate-300">Year:</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            {Array.from({ length: 5 }, (_, i) => currentYear - 1 + i).map(
              (y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ),
            )}
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-lg bg-slate-800 p-3">
          <div className="text-xs text-slate-400">Total Weeks</div>
          <div className="text-xl font-bold text-white">52</div>
        </div>
        <div className="rounded-lg bg-slate-800 p-3">
          <div className="text-xs text-slate-400">Weeks Assigned</div>
          <div className="text-xl font-bold text-white">
            {weekData.filter((w) => w.usedHours > 0).length}
          </div>
        </div>
        <div className="rounded-lg bg-slate-800 p-3">
          <div className="text-xs text-slate-400">Total Capacity</div>
          <div className="text-xl font-bold text-white">
            {weekData.length > 0 ? weekData[0].capacity * 52 : 0}h
          </div>
        </div>
        <div className="rounded-lg bg-slate-800 p-3">
          <div className="text-xs text-slate-400">Total Assigned</div>
          <div className="text-xl font-bold text-white">
            {weekData.reduce((sum, w) => sum + w.usedHours, 0).toFixed(1)}h
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg bg-slate-800 p-3">
        <span className="text-xs font-semibold text-slate-300">
          Utilization:
        </span>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-slate-700"></div>
          <span className="text-xs text-slate-400">0%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-green-600"></div>
          <span className="text-xs text-slate-400">&lt;50%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-yellow-600"></div>
          <span className="text-xs text-slate-400">50-80%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-orange-600"></div>
          <span className="text-xs text-slate-400">80-100%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-3 w-3 rounded bg-red-600"></div>
          <span className="text-xs text-slate-400">&gt;100%</span>
        </div>
      </div>

      {/* Calendar Grid - Show weeks grouped by month */}
      <div className="space-y-6">
        {sortedMonths.map(([month, { weeks }]) => {
          // Sort weeks within each month by week number
          const sortedWeeks = [...weeks].sort(
            (a, b) => a.weekNumber - b.weekNumber,
          );

          return (
            <div key={month} className="space-y-4">
              <h4 className="text-xl font-bold text-white">{month}</h4>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
                {sortedWeeks.map((week) => {
                  const isCurrentWeek =
                    year === currentYear && week.weekNumber === currentWeek;
                  const weekStartDate = getWeekStartDate(
                    week.year,
                    week.weekNumber,
                  );

                  return (
                    <div
                      key={week.weekNumber}
                      className={`cursor-pointer rounded-lg p-3 transition-all hover:scale-105 ${
                        isCurrentWeek ? "ring-2 ring-blue-500" : ""
                      } ${getUtilizationColor(week.utilizationPercentage)}`}
                      onClick={() => {
                        setSelectedWeek(week.weekNumber);
                        setModalOpen(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-white">
                          W{week.weekNumber}
                        </span>
                        {isCurrentWeek && (
                          <span className="text-xs font-bold text-blue-300">
                            NOW
                          </span>
                        )}
                      </div>
                      <div className="mt-1 text-xs text-white">
                        {weekStartDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </div>
                      <div className="mt-2 text-xs text-white">
                        <div className="font-semibold">
                          {week.usedHours}h / {week.capacity}h
                        </div>
                        <div className="text-xs text-slate-200">
                          {week.utilizationPercentage.toFixed(0)}%
                        </div>
                      </div>
                      {week.assignmentCount > 0 && (
                        <div className="mt-1 text-xs text-slate-200">
                          {week.assignmentCount}{" "}
                          {week.assignmentCount === 1 ? "task" : "tasks"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Week Details Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedWeek(null);
        }}
        title={`Week ${selectedWeek} - ${year}`}
      >
        {selectedWeek !== null &&
          (() => {
            const week = weekData.find((w) => w.weekNumber === selectedWeek);
            if (!week)
              return (
                <div className="text-slate-400">No data for this week.</div>
              );

            const weekStartDate = getWeekStartDate(week.year, week.weekNumber);
            const weekEndDate = getWeekEndDate(week.year, week.weekNumber);

            // Filter assignments for this coworker and week
            const weekAssignments = assignments.filter(
              (a) =>
                a.coworkerId === coworkerId &&
                a.year === year &&
                a.weekNumber === selectedWeek,
            );

            return (
              <div className="space-y-6">
                {/* Week Info */}
                <div className="rounded-lg bg-slate-800 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-slate-400">Week Range</div>
                      <div className="text-white">
                        {weekStartDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}{" "}
                        -{" "}
                        {weekEndDate.toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Capacity</div>
                      <div className="text-white">{week.capacity}h</div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Used</div>
                      <div
                        className={getUtilizationTextColor(
                          week.utilizationPercentage,
                        )}
                      >
                        {week.usedHours}h (
                        {week.utilizationPercentage.toFixed(1)}%)
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-slate-400">Available</div>
                      <div
                        className={
                          week.availableHours < 0
                            ? "text-red-400"
                            : "text-green-400"
                        }
                      >
                        {week.availableHours}h
                      </div>
                    </div>
                  </div>

                  {/* Visual bar */}
                  <div className="mt-4">
                    <ProgressBar
                      percentage={week.utilizationPercentage}
                      variant="auto"
                      showDetails={true}
                      current={week.usedHours}
                      total={week.capacity}
                      currentLabel="used"
                      unit="h"
                    />
                  </div>
                </div>

                {/* Assignments and Tasks */}
                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-white">
                      Assignments ({weekAssignments.length})
                    </h4>
                    {(onCreateTask || onCreateAssignment) && (
                      <ActionButtons
                        onCreateTask={onCreateTask || (() => {})}
                        onCreateAssignment={() =>
                          onCreateAssignment?.(coworkerId)
                        }
                        coworkerId={coworkerId}
                      />
                    )}
                  </div>
                  {weekAssignments.length === 0 ? (
                    <div className="rounded-lg bg-slate-800 p-4 text-center text-slate-400">
                      No assignments for this week
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {weekAssignments.map((assignment) => {
                        const task = tasks.find(
                          (t) => t.id === assignment.taskItemId,
                        );
                        const project = projects.find(
                          (p) => p.id === task?.projectId,
                        );

                        return (
                          <div
                            key={assignment.id}
                            className="rounded-lg bg-slate-800 p-4 transition hover:bg-slate-750"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <Link
                                    href={`/tasks/${task?.id}`}
                                    className="text-lg font-semibold text-blue-400 hover:text-blue-300 hover:underline"
                                  >
                                    {task?.name || "Unknown Task"}
                                  </Link>
                                  {task && (
                                    <>
                                      <span
                                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                          task.priority === "Critical"
                                            ? "bg-red-900/50 text-red-300"
                                            : task.priority === "High"
                                              ? "bg-orange-900/50 text-orange-300"
                                              : task.priority === "Normal"
                                                ? "bg-yellow-900/50 text-yellow-300"
                                                : "bg-blue-900/50 text-blue-300"
                                        }`}
                                      >
                                        {task.priority}
                                      </span>
                                      <span
                                        className={`rounded px-2 py-0.5 text-xs font-semibold ${
                                          task.status === "Completed"
                                            ? "bg-green-900/50 text-green-300"
                                            : task.status === "In progress"
                                              ? "bg-blue-900/50 text-blue-300"
                                              : task.status === "Continuous"
                                                ? "bg-purple-900/50 text-purple-300"
                                                : "bg-gray-900/50 text-gray-300"
                                        }`}
                                      >
                                        {task.status}
                                      </span>
                                    </>
                                  )}
                                </div>
                                {project && (
                                  <Link
                                    href={`/projects/${project.id}`}
                                    className="mt-1 text-sm text-slate-400 hover:text-slate-300"
                                  >
                                    Project: {project.name}
                                  </Link>
                                )}
                                <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                                  <div>
                                    <span className="text-slate-400">
                                      Hours:
                                    </span>{" "}
                                    <span className="font-semibold text-white">
                                      {assignment.hoursAssigned}h
                                    </span>
                                  </div>
                                  {task && (
                                    <>
                                      <div>
                                        <span className="text-slate-400">
                                          Estimated:
                                        </span>{" "}
                                        <span className="text-white">
                                          {task.estimatedHours}h
                                        </span>
                                      </div>
                                      <div>
                                        <span className="text-slate-400">
                                          Weekly Effort:
                                        </span>{" "}
                                        <span className="text-white">
                                          {task.weeklyEffort}h
                                        </span>
                                      </div>
                                    </>
                                  )}
                                  <div>
                                    <span className="text-slate-400">
                                      Assigned by:
                                    </span>{" "}
                                    <span className="text-white">
                                      {assignment.assignedBy}
                                    </span>
                                  </div>
                                </div>
                                {assignment.note && (
                                  <div className="mt-2 rounded bg-slate-700 p-2 text-sm text-slate-300">
                                    <span className="font-semibold text-slate-400">
                                      Note:
                                    </span>{" "}
                                    {assignment.note}
                                  </div>
                                )}
                                {task?.note && (
                                  <div className="mt-2 rounded bg-slate-700 p-2 text-sm text-slate-300">
                                    <span className="font-semibold text-slate-400">
                                      Task Note:
                                    </span>{" "}
                                    {task.note}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
      </Modal>
    </div>
  );
}

// Helper functions (same as WeekSelector)
function getISOWeek(date: Date): number {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
}

function getWeekStartDate(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const weekOneMonday = new Date(jan4.valueOf());
  weekOneMonday.setDate(jan4.getDate() - jan4Day);
  const targetDate = new Date(weekOneMonday.valueOf());
  targetDate.setDate(weekOneMonday.getDate() + (week - 1) * 7);
  return targetDate;
}

function getWeekEndDate(year: number, week: number): Date {
  const startDate = getWeekStartDate(year, week);
  const endDate = new Date(startDate.valueOf());
  endDate.setDate(startDate.getDate() + 6);
  return endDate;
}
