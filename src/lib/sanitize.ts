/**
 * HTML sanitization utilities
 */

/**
 * Sanitize HTML string (remove dangerous tags/attributes)
 * Uses a simple allowlist approach for common safe tags
 */
export function sanitizeHtml(str: string): string {
  if (!str) return '';

  try {
    // Create a temporary container
    const temp = document.createElement('div');
    temp.textContent = str; // Use textContent to escape HTML

    // For now, return the escaped version
    // In production, consider using DOMPurify library
    return temp.innerHTML;
  } catch (err) {
    console.error('[sanitize] Failed to sanitize HTML:', err);
    return '';
  }
}

/**
 * Strip all HTML tags and return plain text
 */
export function sanitizePlainText(str: string): string {
  if (!str) return '';

  try {
    const temp = document.createElement('div');
    temp.innerHTML = str;
    return temp.textContent || temp.innerText || '';
  } catch (err) {
    console.error('[sanitize] Failed to sanitize plain text:', err);
    return '';
  }
}

/**
 * Truncate plain text to N characters with ellipsis
 */
export function truncatePlain(str: string, maxLength: number): string {
  if (!str) return '';

  const plain = sanitizePlainText(str);

  if (plain.length <= maxLength) {
    return plain;
  }

  return plain.substring(0, maxLength).trim() + '…';
}
