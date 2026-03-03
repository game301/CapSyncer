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
}

export function ProgressBar({
  percentage,
  variant = "auto",
  className = "",
  width = "w-full",
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

  return (
    <div
      className={`h-3 overflow-hidden rounded-full bg-slate-700 ${width} ${className}`}
    >
      <div
        className={`h-full transition-all ${getColorClass()}`}
        style={{ width: `${Math.min(percentage, 100)}%` }}
      />
    </div>
  );
}
