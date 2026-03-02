import { useState, useEffect } from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";

interface Project {
  id: number;
  name: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  apiBaseUrl: string;
}

export function CreateTaskModal({
  isOpen,
  onClose,
  onSuccess,
  apiBaseUrl,
}: CreateTaskModalProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    projectId: "",
    priority: "Medium",
    status: "Not started",
    estimatedHours: "",
    weeklyEffort: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const fetchProjects = async () => {
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects`);
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        if (data.length > 0 && !formData.projectId) {
          setFormData((prev) => ({ ...prev, projectId: String(data[0].id) }));
        }
      }
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          projectId: Number(formData.projectId),
          priority: formData.priority,
          status: formData.status,
          estimatedHours: Number(formData.estimatedHours),
          weeklyEffort: Number(formData.weeklyEffort),
          note: formData.note || undefined,
        }),
      });

      if (response.ok) {
        setFormData({
          name: "",
          projectId: projects[0]?.id ? String(projects[0].id) : "",
          priority: "Medium",
          status: "Not started",
          estimatedHours: "",
          weeklyEffort: "",
          note: "",
        });
        onSuccess();
        onClose();
      } else {
        alert("Failed to create task");
      }
    } catch (error) {
      console.error("Error creating task:", error);
      alert("Error creating task");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      projectId: projects[0]?.id ? String(projects[0].id) : "",
      priority: "Medium",
      status: "Not started",
      estimatedHours: "",
      weeklyEffort: "",
      note: "",
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Create New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Task Name *
          </label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Project *
          </label>
          <select
            required
            value={formData.projectId}
            onChange={(e) =>
              setFormData({ ...formData, projectId: e.target.value })
            }
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          >
            {projects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Priority *
            </label>
            <select
              required
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-300">
              Status *
            </label>
            <select
              required
              value={formData.status}
              onChange={(e) =>
                setFormData({ ...formData, status: e.target.value })
              }
              className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
            >
              <option value="Not started">Not started</option>
              <option value="In progress">In progress</option>
              <option value="Completed">Completed</option>
              <option value="Continuous">Continuous</option>
            </select>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Estimated Hours *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.5"
            value={formData.estimatedHours}
            onChange={(e) =>
              setFormData({ ...formData, estimatedHours: e.target.value })
            }
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-slate-300">
            Weekly Effort *
          </label>
          <input
            type="number"
            required
            min="0"
            step="0.5"
            value={formData.weeklyEffort}
            onChange={(e) =>
              setFormData({ ...formData, weeklyEffort: e.target.value })
            }
            className="w-full rounded border border-slate-600 bg-slate-700 px-3 py-2 text-white"
          />
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
            className="flex-1"
          >
            {loading ? "Creating..." : "Create Task"}
          </Button>
          <Button
            type="button"
            onClick={handleClose}
            variant="secondary"
            className="flex-1"
          >
            Cancel
          </Button>
        </div>
      </form>
    </Modal>
  );
}
