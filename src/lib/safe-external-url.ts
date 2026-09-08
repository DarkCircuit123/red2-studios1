/**
 * Safe External URL Validator
 * Prevents SSRF attacks by rejecting local, private, link-local and reserved targets.
 *
 * This is intentionally a URL-level guard. A hostname can still resolve to a private
 * address after validation (DNS rebinding), so callers that perform their own fetches
 * should also disable redirects or revalidate every redirect target.
 */
import { isIP } from 'node:net';

function isBlockedIPv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
    return true;
  }

  const [a, b, c, d] = parts;
  const value = (((a * 256) + b) * 256 + c) * 256 + d;

  // RFC 1918 private, loopback, link-local, unspecified, documentation,
  // benchmarking, shared address space, multicast and future/reserved space.
  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224 ||
    value === 0xffffffff ||
    // 100.64.0.0/10 is handled above; keep explicit integer use to avoid
    // accidentally accepting malformed dotted forms.
    false
  );
}

function isBlockedIPv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (isIP(normalized) !== 6) return false;

  // Loopback and unspecified.
  if (normalized === '::1' || normalized === '::') return true;

  // Link-local (fe80::/10), unique-local/private (fc00::/7), multicast (ff00::/8).
  if (
    normalized.startsWith('fe8') ||
    normalized.startsWith('fe9') ||
    normalized.startsWith('fea') ||
    normalized.startsWith('feb') ||
    normalized.startsWith('fc') ||
    normalized.startsWith('fd') ||
    normalized.startsWith('ff')
  ) {
    return true;
  }

  // IPv4-mapped IPv6 addresses such as ::ffff:127.0.0.1.
  const mapped = normalized.match(/^(?:0*:){5}ffff:(\d+(?:\.\d+){3})$/i);
  if (mapped?.[1]) return isBlockedIPv4(mapped[1]);

  return false;
}

/** Validates that a URL is safe to fetch server-side. */
export function isSafeExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());

    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.username || url.password) return false;
    if (!url.hostname) return false;

    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');

    // Local/internal DNS names.
    if (
      hostname === 'localhost' ||
      hostname.endsWith('.localhost') ||
      hostname === 'local' ||
      hostname.endsWith('.local') ||
      hostname.endsWith('.internal') ||
      hostname.endsWith('.home.arpa')
    ) {
      return false;
    }

    const ipVersion = isIP(hostname);
    if (ipVersion === 4) return !isBlockedIPv4(hostname);
    if (ipVersion === 6) return !isBlockedIPv6(hostname);

    // Reject numeric-looking hostnames that URL parsers could normalize in
    // surprising ways (decimal/hex/octal IP representations).
    if (/^(?:0x[0-9a-f]+|0[0-7]+|\d+)$/.test(hostname)) return false;

    return true;
  } catch {
    return false;
  }
}

/** Fetches a URL after applying the URL-level SSRF guard. */
export async function fetchSafeUrl(urlString: string, options?: RequestInit): Promise<Response> {
  if (!isSafeExternalUrl(urlString)) {
    throw new Error('URL is not safe to fetch');
  }

  return fetch(urlString, options);
}
