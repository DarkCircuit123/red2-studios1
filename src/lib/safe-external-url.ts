/**
 * Safe External URL Validator
 * Prevents SSRF attacks by validating URLs before server-side fetches
 */

/**
 * Validates that a URL is safe to fetch server-side
 * Blocks: loopback (127.0.0.1, localhost), private ranges (10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16),
 * link-local (169.254.0.0/16), cloud metadata (169.254.169.254), and other reserved ranges
 */
export function isSafeExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);

    // Only allow http and https
    if (!['http:', 'https:'].includes(url.protocol)) {
      return false;
    }

    const hostname = url.hostname;

    // Block loopback
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }

    // Parse as IPv4 if it looks like one
    if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
      const parts = hostname.split('.').map(Number);
      if (parts.some(p => p > 255)) return false;

      const [a, b, c, d] = parts;

      // 10.0.0.0/8
      if (a === 10) return false;

      // 172.16.0.0/12
      if (a === 172 && b >= 16 && b <= 31) return false;

      // 192.168.0.0/16
      if (a === 192 && b === 168) return false;

      // 169.254.0.0/16 (link-local)
      if (a === 169 && b === 254) return false;

      // 127.0.0.0/8 (loopback)
      if (a === 127) return false;

      // 0.0.0.0/8
      if (a === 0) return false;

      // 255.255.255.255 (broadcast)
      if (a === 255 && b === 255 && c === 255 && d === 255) return false;
    }

    // Block IPv6 loopback and link-local
    if (hostname === '::1' || hostname.startsWith('fe80:')) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches a URL safely, with SSRF protection
 * Returns the response if safe, throws if URL is unsafe
 */
export async function fetchSafeUrl(
  urlString: string,
  options?: RequestInit
): Promise<Response> {
  if (!isSafeExternalUrl(urlString)) {
    throw new Error('URL is not safe to fetch');
  }

  return fetch(urlString, options);
}
