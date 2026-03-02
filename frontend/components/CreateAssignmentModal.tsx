import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { usePermissions } from "../contexts/PermissionContext";

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
}

export function CreateAssignmentModal({
  isOpen,
  onClose,
  onSuccess,
  apiBaseUrl,
  prefilledCoworkerId,
}: CreateAssignmentModalProps) {
  const permissions = usePermissions();
  const [coworkers, setCoworkers] = useState<Coworker[]>([]);
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  
  // Calculate ISO week number and year from a date (ISO 8601)
  const getWeekInfo = (dateString: string) => {
    // Parse date as local to avoid timezone issues
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    
    // Copy date so we don't mutate the original
    const tempDate = new Date(date.getTime());
    // Set to nearest Thursday: current date + 4 - current day number (make Sunday's day number 7)
    tempDate.setDate(tempDate.getDate() + 4 - (tempDate.getDay() || 7));
    
    // Get first day of year
    const yearStart = new Date(tempDate.getFullYear(), 0, 1);
    
    // Calculate full weeks to nearest Thursday
    const weekNumber = Math.ceil((((tempDate.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
    
    return {
      year: tempDate.getFullYear(),
      weekNumber: weekNumber
    };
  };

  const [formData, setFormData] = useState({
    coworkerId: prefilledCoworkerId ? String(prefilledCoworkerId) : "",
    taskItemId: "",
    hoursAssigned: "",
    assignedDate: new Date().toISOString().split("T")[0],
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
      const weekInfo = getWeekInfo(formData.assignedDate);
      
      // Convert date string to ISO DateTime format for the backend
      const assignedDateTime = new Date(formData.assignedDate + 'T00:00:00').toISOString();
      
      const response = await fetch(`${apiBaseUrl}/api/assignments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          coworkerId: Number(formData.coworkerId),
          taskItemId: Number(formData.taskItemId),
          hoursAssigned: Number(formData.hoursAssigned),
          assignedDate: assignedDateTime,
          year: weekInfo.year,
          weekNumber: weekInfo.weekNumber,
          assignedBy: permissions.userName || "Unknown User",
          note: formData.note || "",
        }),
      });

      if (response.ok) {
        setFormData({
          coworkerId: coworkers[0]?.id ? String(coworkers[0].id) : "",
          taskItemId: tasks[0]?.id ? String(tasks[0].id) : "",
          hoursAssigned: "",
          assignedDate: new Date().toISOString().split("T")[0],
          note: "",
        });
        onSuccess();
        onClose();
      } else {
        const errorText = await response.text();
        console.error("Failed to create assignment:", response.status, errorText);
        alert(`Failed to create assignment: ${response.status} ${errorText}`);
      }
    } catch (error) {
      console.error("Error creating assignment:", error);
      alert("Error creating assignment: " + (error instanceof Error ? error.message : String(error)));
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
