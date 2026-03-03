interface ProgressBarProps {
  /**
   * The percentage to display (0-100+)
   */
  percentage: number;
  /**
   * The color variant of the progress bar
   * - auto: green (<80%), yellow (80-100%), red (>100%)
   * - green: always green
   * - blue: always blue
   * - red: always red
   * - yellow: always yellow
   */
  variant?: "auto" | "green" | "blue" | "red" | "yellow";
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Width class (e.g., "w-32", "w-full")
   */
  width?: string;
  /**
   * Show details below the progress bar (current/total values)
   */
  showDetails?: boolean;
  /**
   * Current value (e.g., assigned hours)
   */
  current?: number;
  /**
   * Total/maximum value (e.g., capacity)
   */
  total?: number;
  /**
   * Label for the current value (e.g., "allocated", "completed")
   */
  currentLabel?: string;
  /**
   * Unit to display (e.g., "h", "tasks")
   */
  unit?: string;
}

export function ProgressBar({
  percentage,
  variant = "auto",
  className = "",
  width = "w-full",
  showDetails = false,
  current,
  total,
  currentLabel = "current",
  unit = "",
}: ProgressBarProps) {
  const getColorClass = () => {
    if (variant !== "auto") {
      const colorMap = {
        green: "bg-green-500",
        blue: "bg-blue-500",
        red: "bg-red-500",
        yellow: "bg-yellow-500",
      };
      return colorMap[variant];
    }

    // Auto variant based on percentage
    if (percentage > 100) return "bg-red-500";
    if (percentage > 80) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getTextColorClass = () => {
    if (variant !== "auto") {
      const colorMap = {
        green: "text-green-400",
        blue: "text-blue-400",
        red: "text-red-400",
        yellow: "text-yellow-400",
      };
      return colorMap[variant];
    }

    // Auto variant based on percentage
    if (percentage > 100) return "text-red-400";
    if (percentage > 80) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className={className}>
      <div className={`h-3 overflow-hidden rounded-full bg-slate-700 ${width}`}>
        <div
          className={`h-full transition-all ${getColorClass()}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {showDetails && current !== undefined && total !== undefined && (
        <div className="flex justify-between text-sm mt-2">
          <span className="text-slate-400">
            <span className={`font-semibold ${getTextColorClass()}`}>
              {current}
              {unit}
            </span>{" "}
            {currentLabel}
          </span>
          <span className="text-slate-400">
            of{" "}
            <span className="font-semibold text-white">
              {total}
              {unit}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
