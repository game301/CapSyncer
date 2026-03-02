"use client";

import { useEffect, useState } from "react";

interface WeekSelectorProps {
  defaultYear?: number;
  defaultWeek?: number;
  onWeekChange?: (year: number, week: number) => void;
  name?: string;
  required?: boolean;
}

export function WeekSelector({
  defaultYear,
  defaultWeek,
  onWeekChange,
  name = "week",
  required = false,
}: WeekSelectorProps) {
  const currentDate = new Date();
  const [year, setYear] = useState(defaultYear || currentDate.getFullYear());
  const [week, setWeek] = useState(defaultWeek || getISOWeek(currentDate));

  useEffect(() => {
    if (onWeekChange) {
      onWeekChange(year, week);
    }
  }, [year, week, onWeekChange]);

  const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = parseInt(e.target.value);
    setYear(newYear);
  };

  const handleWeekChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newWeek = parseInt(e.target.value);
    setWeek(newWeek);
  };

  const goToPreviousWeek = () => {
    if (week > 1) {
      setWeek(week - 1);
    } else {
      setYear(year - 1);
      setWeek(52);
    }
  };

  const goToNextWeek = () => {
    if (week < 52) {
      setWeek(week + 1);
    } else {
      setYear(year + 1);
      setWeek(1);
    }
  };

  const goToCurrentWeek = () => {
    const now = new Date();
    setYear(now.getFullYear());
    setWeek(getISOWeek(now));
  };

  const weekStartDate = getWeekStartDate(year, week);
  const weekEndDate = getWeekEndDate(year, week);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={goToPreviousWeek}
          className="rounded bg-slate-700 px-3 py-1 text-white hover:bg-slate-600"
          aria-label="Previous week"
        >
          ←
        </button>

        <select
          value={year}
          onChange={handleYearChange}
          className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required={required}
        >
          {Array.from(
            { length: 5 },
            (_, i) => currentDate.getFullYear() - 1 + i,
          ).map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>

        <select
          value={week}
          onChange={handleWeekChange}
          className="rounded border border-slate-600 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          required={required}
        >
          {Array.from({ length: 52 }, (_, i) => i + 1).map((w) => (
            <option key={w} value={w}>
              Week {w}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={goToNextWeek}
          className="rounded bg-slate-700 px-3 py-1 text-white hover:bg-slate-600"
          aria-label="Next week"
        >
          →
        </button>

        <button
          type="button"
          onClick={goToCurrentWeek}
          className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
        >
          Today
        </button>
      </div>

      <div className="text-sm text-slate-400">
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

      {/* Hidden inputs for form submission */}
      <input type="hidden" name={`${name}Year`} value={year} />
      <input type="hidden" name={`${name}Number`} value={week} />
    </div>
  );
}

// Calculate ISO week number from a date
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

// Get the Monday of a specific ISO week
function getWeekStartDate(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const jan4Day = (jan4.getDay() + 6) % 7;
  const weekOneMonday = new Date(jan4.valueOf());
  weekOneMonday.setDate(jan4.getDate() - jan4Day);
  const targetDate = new Date(weekOneMonday.valueOf());
  targetDate.setDate(weekOneMonday.getDate() + (week - 1) * 7);
  return targetDate;
}

// Get the Sunday of a specific ISO week
function getWeekEndDate(year: number, week: number): Date {
  const startDate = getWeekStartDate(year, week);
  const endDate = new Date(startDate.valueOf());
  endDate.setDate(startDate.getDate() + 6);
  return endDate;
}
