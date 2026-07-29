/**
 * Shared date formatter for booking system
 * Ensures all dates are handled as local time, not UTC
 * Prevents timezone offset bugs where selected date is one day behind
 */

/**
 * Parse a date string (YYYY-MM-DD) as local time
 * Returns a Date object representing midnight in local timezone
 */
export const parseLocalDate = (dateString: string): Date => {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
};

/**
 * Convert a Date object to YYYY-MM-DD string in local timezone
 * Used for calendar input values and database storage
 */
export const formatDateToString = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Format a date string or Date object for display
 * Example: "2026-08-02" or Date(2026, 7, 2) -> "Sunday, August 2, 2026"
 */
export const formatDateForDisplay = (date: string | Date): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseLocalDate(date);
  } else {
    dateObj = date;
  }
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });
};

/**
 * Format a date string or Date object for short display
 * Example: "2026-08-02" or Date(2026, 7, 2) -> "Sun, Aug 2"
 */
export const formatDateShort = (date: string | Date): string => {
  let dateObj: Date;
  
  if (typeof date === 'string') {
    dateObj = parseLocalDate(date);
  } else {
    dateObj = date;
  }
  
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Get today's date as YYYY-MM-DD string in local timezone
 */
export const getTodayString = (): string => {
  return formatDateToString(new Date());
};

/**
 * Normalize any date value to YYYY-MM-DD string
 * Handles Date objects, date strings, and undefined values
 */
export const normalizeDateString = (date: Date | string | undefined): string => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) return formatDateToString(date);
  return '';
};
