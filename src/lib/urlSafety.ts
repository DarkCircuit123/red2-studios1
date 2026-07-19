/**
 * URL safety utilities for validating and sanitizing external URLs
 */

export function isValidHttpUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

export function getHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function sanitizeExternalUrl(url: string): string {
  try {
    const parsed = new URL(url);

    // Reject dangerous protocols
    if (
      parsed.protocol === 'javascript:' ||
      parsed.protocol === 'data:' ||
      parsed.protocol === 'file:'
    ) {
      console.warn('[urlSafety] Rejected dangerous protocol:', parsed.protocol);
      return '';
    }

    // Only allow http and https
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      console.warn('[urlSafety] Rejected non-http protocol:', parsed.protocol);
      return '';
    }

    return parsed.toString();
  } catch (err) {
    console.error('[urlSafety] Failed to parse URL:', url, err);
    return '';
  }
}
