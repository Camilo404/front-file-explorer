/**
 * Date formatting utilities for consistent date display across the application.
 */

/**
 * Creates a cached date formatter for the specified locale and options.
 * Uses Intl.DateTimeFormat for efficient repeated formatting.
 */
export function createDateFormatter(
  locale: string = 'es',
  options: Intl.DateTimeFormatOptions = {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }
): (value: string | Date | undefined) => string {
  const formatter = new Intl.DateTimeFormat(locale, options);

  return (value: string | Date | undefined): string => {
    if (!value) {
      return '-';
    }

    const date = value instanceof Date ? value : new Date(value);
    return isNaN(date.getTime()) ? '-' : formatter.format(date);
  };
}

/**
 * Default date-time formatter for the application (Spanish locale).
 */
export const formatDateTime = createDateFormatter('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/**
 * Short date formatter (without time).
 */
export const formatDate = createDateFormatter('es', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

/**
 * Time-only formatter.
 */
export const formatTime = createDateFormatter('es', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

/**
 * ISO-style date formatter (YYYY-MM-DD).
 */
export const formatIsoDate = (value: string | Date | undefined): string => {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return '-';
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

/**
 * Relative time formatter (e.g., "2 hours ago", "in 3 days").
 */
export const formatRelativeTime = (value: string | Date | undefined): string => {
  if (!value) {
    return '-';
  }

  const date = value instanceof Date ? value : new Date(value);
  if (isNaN(date.getTime())) {
    return '-';
  }

  const now = new Date();
  const diffMs = date.getTime() - now.getTime();
  const diffSeconds = Math.round(diffMs / 1000);
  const diffMinutes = Math.round(diffSeconds / 60);
  const diffHours = Math.round(diffMinutes / 60);
  const diffDays = Math.round(diffHours / 24);

  const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

  if (Math.abs(diffSeconds) < 60) {
    return rtf.format(diffSeconds, 'second');
  }
  if (Math.abs(diffMinutes) < 60) {
    return rtf.format(diffMinutes, 'minute');
  }
  if (Math.abs(diffHours) < 24) {
    return rtf.format(diffHours, 'hour');
  }
  if (Math.abs(diffDays) < 30) {
    return rtf.format(diffDays, 'day');
  }

  // Fall back to absolute date for older dates
  return formatDateTime(date);
};