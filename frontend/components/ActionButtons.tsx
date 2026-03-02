import { Button } from "./Button";

interface ActionButtonsProps {
  onCreateTask: () => void;
  onCreateAssignment: () => void;
  coworkerId?: number;
}

export function ActionButtons({
  onCreateTask,
  onCreateAssignment,
}: ActionButtonsProps) {
  const plusIcon = (
    <svg
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 4v16m8-8H4"
      />
    </svg>
  );

  return (
    <div className="flex items-center gap-3">
      <Button
        onClick={onCreateTask}
        variant="primary"
        size="md"
        icon={plusIcon}
        iconPosition="left"
      >
        Add Task
      </Button>
      <Button
        onClick={onCreateAssignment}
        variant="primary"
        size="md"
        icon={plusIcon}
        iconPosition="left"
      >
        Add Assignment
      </Button>
    </div>
  );
}
