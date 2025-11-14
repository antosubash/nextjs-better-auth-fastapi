/**
 * Normalizes a date value to a consistent number format (timestamp in milliseconds)
 * @param date - Date value that can be Date, number (timestamp), or string
 * @returns Timestamp in milliseconds as a number
 */
export function normalizeDate(date: Date | number | string | undefined | null): number {
  if (!date) {
    return Date.now();
  }

  if (typeof date === "number") {
    return date;
  }

  if (date instanceof Date) {
    return date.getTime();
  }

  // Handle string dates
  const parsed = new Date(date);
  if (isNaN(parsed.getTime())) {
    return Date.now();
  }

  return parsed.getTime();
}

/**
 * Formats a date/timestamp to a localized date string
 * @param timestamp - Date value (Date, number, or string)
 * @param format - Format style: 'short' (default) or 'long'
 * @returns Formatted date string
 */
export function formatDate(
  timestamp: Date | number | string | undefined | null,
  format: "short" | "long" = "short"
): string {
  const normalized = normalizeDate(timestamp);
  const date = new Date(normalized);

  if (format === "long") {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }

  // Short format (default)
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
