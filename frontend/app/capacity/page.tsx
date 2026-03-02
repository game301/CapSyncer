"use client";

import { useEffect, useState, useCallback } from "react";
import { PageLayout } from "../../components/PageLayout";
import { WeeklyCapacityView } from "../../components/WeeklyCapacityView";
import { CreateTaskModal } from "../../components/CreateTaskModal";
import { CreateAssignmentModal } from "../../components/CreateAssignmentModal";

interface Coworker {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
}

export default function CapacityPage() {
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [selectedCoworkerId, setSelectedCoworkerId] = useState<number | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const currentYear = new Date().getFullYear();
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [assignmentCoworkerId, setAssignmentCoworkerId] = useState<
    number | null
  >(null);

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_BASEURL || "http://localhost:5128";

  const fetchCoworkers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiBaseUrl}/api/coworkers`);
      if (response.ok) {
        const data = await response.json();
        const activeCoworkers = data.filter((c: Coworker) => c.isActive);
        setCoworkers(activeCoworkers);
        if (activeCoworkers.length > 0 && !selectedCoworkerId) {
          setSelectedCoworkerId(activeCoworkers[0].id);
        }
      }
    } catch (error) {
      console.error("Error fetching coworkers:", error);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl, selectedCoworkerId]);

  useEffect(() => {
    fetchCoworkers();
  }, [fetchCoworkers]);

  const handleCreateTask = () => {
    setTaskModalOpen(true);
  };

  const handleCreateAssignment = (coworkerId: number) => {
    setAssignmentCoworkerId(coworkerId);
    setAssignmentModalOpen(true);
  };

  const selectedCoworker = coworkers.find((c) => c.id === selectedCoworkerId);

  if (loading) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-700 border-t-blue-500 mx-auto"></div>
            <p className="text-slate-400">Loading capacity data...</p>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (coworkers.length === 0) {
    return (
      <PageLayout>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="rounded-lg border border-slate-700 bg-slate-800/50 p-8 max-w-md text-center">
            <div className="mb-4 text-xl font-semibold text-slate-300">
              No active coworkers found
            </div>
            <p className="text-slate-400">
              Add coworkers in the Dashboard to see their weekly capacity.
            </p>
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
              <h1 className="text-3xl font-bold text-white">
                Capacity Calendar
              </h1>
              <p className="mt-1 text-sm text-slate-400">
                Visualize team capacity across the year
              </p>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium text-slate-300">
                Team Member:
              </label>
              <select
                value={selectedCoworkerId || ""}
                onChange={(e) => setSelectedCoworkerId(Number(e.target.value))}
                className="rounded border border-slate-600 bg-slate-700 px-4 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {coworkers.map((coworker) => (
                  <option key={coworker.id} value={coworker.id}>
                    {coworker.name} ({coworker.capacity}h/week)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {selectedCoworker && (
          <WeeklyCapacityView
            coworkerId={selectedCoworker.id}
            coworkerName={selectedCoworker.name}
            year={currentYear}
            onCreateTask={handleCreateTask}
            onCreateAssignment={handleCreateAssignment}
          />
        )}
      </div>

      <CreateTaskModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSuccess={fetchCoworkers}
        apiBaseUrl={apiBaseUrl}
      />

      <CreateAssignmentModal
        isOpen={assignmentModalOpen}
        onClose={() => {
          setAssignmentModalOpen(false);
          setAssignmentCoworkerId(null);
        }}
        onSuccess={fetchCoworkers}
        apiBaseUrl={apiBaseUrl}
        prefilledCoworkerId={assignmentCoworkerId || undefined}
      />
    </PageLayout>
  );
}
