/**
 * Date formatting utilities
 */

interface FormatDateOptions {
  month?: 'long' | 'short' | 'numeric';
  day?: 'numeric' | '2-digit';
  year?: 'numeric' | '2-digit';
  hour?: 'numeric' | '2-digit';
  minute?: 'numeric' | '2-digit';
  second?: 'numeric' | '2-digit';
  timeZone?: string;
}

/**
 * Format a date string with fallback to empty string on error
 */
export function formatDate(
  dateString: string | Date | undefined,
  options?: FormatDateOptions
): string {
  if (!dateString) return '';

  const defaultOptions: FormatDateOptions = {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    ...options,
  };

  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      console.warn('[dateFormat] Invalid date:', dateString);
      return '';
    }

    return new Intl.DateTimeFormat('en-US', defaultOptions as any).format(date);
  } catch (err) {
    console.error('[dateFormat] Failed to format date:', dateString, err);
    return '';
  }
}

/**
 * Calculate reading time in minutes
 */
export function formatReadingTime(
  text: string,
  wordsPerMinute: number = 200
): string {
  if (!text) return '0 min read';

  try {
    const wordCount = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    return `${minutes} min read`;
  } catch (err) {
    console.error('[dateFormat] Failed to calculate reading time:', err);
    return '0 min read';
  }
}
