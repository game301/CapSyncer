/**
 * Date utility functions
 *
 * Provides reusable date manipulation and formatting functions.
 * Follows DRY principle by extracting common date operations.
 */

/**
 * Calculates ISO 8601 week number from a given date
 *
 * ISO week date system rules:
 * - Week 1 is the first week with a Thursday in it (or first week with 4+ days in the new year)
 * - Weeks start on Monday
 * - Week numbers range from 1-53
 *
 * This function is used for capacity planning and assignment tracking.
 *
 * @param date - The date to calculate week number for
 * @returns Object with year and week number (1-53)
 *
 * @example
 * const { year, weekNumber } = getIsoWeekNumber(new Date('2026-03-05'));
 * console.log(`Week ${weekNumber} of ${year}`); // "Week 10 of 2026"
 *
 * @example
 * // Group assignments by ISO week
 * const weekInfo = getIsoWeekNumber(assignment.assignedDate);
 * const weeklyAssignments = assignments.filter(a => {
 *   const week = getIsoWeekNumber(new Date(a.assignedDate));
 *   return week.year === weekInfo.year && week.weekNumber === weekInfo.weekNumber;
 * });
 */
export function getIsoWeekNumber(date: Date): {
  year: number;
  weekNumber: number;
} {
  // Create a copy to avoid mutating the original date
  const target = new Date(date.valueOf());

  // Get day of week (0 = Sunday, converting to Monday = 0)
  const dayNr = (date.getDay() + 6) % 7;

  // Set to nearest Thursday (current week's Thursday)
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();

  // Set to January 1st of the Thursday's year
  target.setMonth(0, 1);

  // Adjust to first Thursday of the year if January 1st is not Thursday
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }

  // Calculate week number (difference in weeks from first Thursday)
  const weekNumber =
    1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);

  return { year: target.getFullYear(), weekNumber };
}

/**
 * Formats a date to ISO string for datetime-local inputs
 * Removes seconds and timezone for HTML5 datetime-local compatibility
 *
 * @param date - Date to format (defaults to now)
 * @returns String in format "YYYY-MM-DDTHH:mm"
 *
 * @example
 * <input type="datetime-local" value={toDateTimeLocalString(new Date())} />
 */
export function toDateTimeLocalString(date: Date = new Date()): string {
  return date.toISOString().slice(0, 16);
}

/**
 * Formats a date to a readable string
 *
 * @param date - Date to format
 * @param options - Intl.DateTimeFormatOptions for customization
 * @returns Formatted date string
 *
 * @example
 * formatDate(new Date('2026-03-05')); // "March 5, 2026"
 * formatDate(new Date('2026-03-05'), { dateStyle: 'short' }); // "3/5/26"
 */
export function formatDate(
  date: Date | string,
  options: Intl.DateTimeFormatOptions = { dateStyle: "long" },
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("en-US", options).format(dateObj);
}

/**
 * Calculates the difference between two dates in days
 *
 * @param start - Start date
 * @param end - End date
 * @returns Number of days between dates (can be negative)
 *
 * @example
 * const days = daysBetween(new Date('2026-03-01'), new Date('2026-03-05'));
 * console.log(days); // 4
 */
export function daysBetween(start: Date | string, end: Date | string): number {
  const startDate = typeof start === "string" ? new Date(start) : start;
  const endDate = typeof end === "string" ? new Date(end) : end;
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculates the difference between two dates in weeks
 *
 * @param start - Start date
 * @param end - End date
 * @returns Number of weeks between dates (rounded up)
 *
 * @example
 * const weeks = weeksBetween(new Date('2026-03-01'), new Date('2026-03-22'));
 * console.log(weeks); // 3
 */
export function weeksBetween(start: Date | string, end: Date | string): number {
  const days = daysBetween(start, end);
  return Math.ceil(days / 7);
}
