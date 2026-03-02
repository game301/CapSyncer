import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface Coworker {
  id: number;
  name: string;
  capacity: number;
  isActive: boolean;
}

interface TaskItem {
  id: number;
  name: string;
  projectId: number;
  priority: string;
  status: string;
  estimatedHours: number;
}

interface CreateAssignmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiBaseUrl: string;
  prefilledCoworkerId?: number;
  prefilledYear?: number;
  prefilledWeek?: number;
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  apiBaseUrl,
  prefilledCoworkerId,
  prefilledYear,
  prefilledWeek,
}: CreateAssignmentModalProps) {
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [formData, setFormData] = useState({
    coworkerId: prefilledCoworkerId ? String(prefilledCoworkerId) : "",
    taskItemId: "",
    hoursAssigned: "",
    assignedDate: new Date().toISOString().split("T")[0],
    year: prefilledYear
      ? String(prefilledYear)
      : String(new Date().getFullYear()),
    weekNumber: prefilledWeek ? String(prefilledWeek) : "",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (prefilledCoworkerId) {
      setFormData((prev) => ({
        ...prev,
        coworkerId: String(prefilledCoworkerId),
      }));
    }
  }, [prefilledCoworkerId]);

  useEffect(() => {
    if (prefilledYear) {
      setFormData((prev) => ({ ...prev, year: String(prefilledYear) }));
    }
  }, [prefilledYear]);

  useEffect(() => {
    if (prefilledWeek) {
      setFormData((prev) => ({ ...prev, weekNumber: String(prefilledWeek) }));
    }
  }, [prefilledWeek]);

  const fetchData = async () => {
    try {
      const [coworkersRes, tasksRes] = await Promise.all([
        fetch(`${apiBaseUrl}/api/coworkers`),
        fetch(`${apiBaseUrl}/api/tasks`),
      ]);

      if (coworkersRes.ok && tasksRes.ok) {
        const [coworkersData, tasksData] = await Promise.all([
          coworkersRes.json(),
          tasksRes.json(),
        ]);

        const activeCoworkers = coworkersData.filter(
          (c: Coworker) => c.isActive,
        );
        setCoworkers(activeCoworkers);
        setTasks(tasksData);

        if (!formData.coworkerId && activeCoworkers.length > 0) {
          setFormData((prev) => ({
            ...prev,
            coworkerId: String(activeCoworkers[0].id),
          }));
        }
        if (!formData.taskItemId && tasksData.length > 0) {
          setFormData((prev) => ({
            ...prev,
            taskItemId: String(tasksData[0].id),
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coworkerId: Number(formData.coworkerId),
          taskItemId: Number(formData.taskItemId),
          hoursAssigned: Number(formData.hoursAssigned),
          assignedDate: formData.assignedDate,
          year: Number(formData.year),
          weekNumber: Number(formData.weekNumber),
          note: formData.note || undefined,
        }),
      });

      if (response.ok) {
        setFormData({
          coworkerId: coworkers[0]?.id ? String(coworkers[0].id) : "",
          taskItemId: tasks[0]?.id ? String(tasks[0].id) : "",
          hoursAssigned: "",
          assignedDate: new Date().toISOString().split("T")[0],
          year: String(new Date().getFullYear()),
          weekNumber: "",
          note: "",
        });
        onSuccess();
        onClose();
      } else {
        alert("Failed to create assignment");
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Error creating assignment");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      coworkerId: coworkers[0]?.id ? String(coworkers[0].id) : "",
      taskItemId: tasks[0]?.id ? String(tasks[0].id) : "",
      hoursAssigned: "",
      assignedDate: new Date().toISOString().split("T")[0],
      year: String(new Date().getFullYear()),
      weekNumber: "",
      note: "",
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Assignment">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Team Member *
          </label>
          <select
            required
            value={formData.coworkerId}
            onChange={(e) =>
              setFormData({ ...formData, coworkerId: e.target.value })
            }
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          >
            <option value="" disabled>
              Select a coworker
            </option>
            {coworkers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Task *
          </label>
          <select
            required
            value={formData.taskItemId}
            onChange={(e) =>
              setFormData({ ...formData, taskItemId: e.target.value })
            }
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          >
            <option value="" disabled>
              Select a task
            </option>
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Hours Assigned *
            </label>
            <input
              type="number"
              required
              min="0"
              step="0.5"
              value={formData.hoursAssigned}
              onChange={(e) =>
                setFormData({ ...formData, hoursAssigned: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Assigned Date *
            </label>
            <input
              type="date"
              required
              value={formData.assignedDate}
              onChange={(e) =>
                setFormData({ ...formData, assignedDate: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Year *
            </label>
            <input
              type="number"
              required
              min="2020"
              max="2099"
              value={formData.year}
              onChange={(e) =>
                setFormData({ ...formData, year: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Week Number *
            </label>
            <input
              type="number"
              required
              min="1"
              max="53"
              value={formData.weekNumber}
              onChange={(e) =>
                setFormData({ ...formData, weekNumber: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Note
          </label>
          <textarea
            value={formData.note}
            onChange={(e) => setFormData({ ...formData, note: e.target.value })}
            rows={3}
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          />
        </div>

        <div className="flex gap-3 pt-4">
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            size="md"
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Assignment"}
          </Button>
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            size="md"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
