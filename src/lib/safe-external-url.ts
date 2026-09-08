/**
 * Safe External URL Validator
 * Prevents SSRF attacks by rejecting local, private, link-local and reserved targets.
 *
 * This is a URL-level guard. DNS rebinding cannot be fully prevented here without
 * resolving and pinning the destination address at the point of the actual fetch.
 */
import { isIP } from 'node:net';

function isBlockedIPv4(hostname: string): boolean {
  const parts = hostname.split('.').map((part) => Number(part));
  if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) return true;
  const [a, b, c] = parts;
  return (
    a === 0 || a === 10 || a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0 && c === 0) ||
    (a === 192 && b === 0 && c === 2) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function isBlockedIPv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (isIP(normalized) !== 6) return false;
  if (normalized === '::' || normalized === '::1') return true;
  if (/^fe[89ab]/.test(normalized) || /^(?:fc|fd|ff)/.test(normalized)) return true;
  const mapped = normalized.match(/:ffff:(\d+(?:\.\d+){3})$/i);
  return Boolean(mapped?.[1] && isBlockedIPv4(mapped[1]));
}

export function isSafeExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.username || url.password || !url.hostname) return false;
    const hostname = url.hostname.toLowerCase().replace(/\.$/, '');

    if (
      hostname === 'localhost' || hostname.endsWith('.localhost') ||
      hostname === 'local' || hostname.endsWith('.local') ||
      hostname.endsWith('.internal') || hostname.endsWith('.home.arpa')
    ) return false;

    const ipVersion = isIP(hostname);
    if (ipVersion === 4) return !isBlockedIPv4(hostname);
    if (ipVersion === 6) return !isBlockedIPv6(hostname);
    if (/^(?:0x[0-9a-f]+|0[0-7]+|\d+)$/.test(hostname)) return false;
    return true;
  } catch {
    return false;
  }
}

export async function fetchSafeUrl(urlString: string, options?: RequestInit): Promise<Response> {
  if (!isSafeExternalUrl(urlString)) throw new Error('URL is not safe to fetch');
  return fetch(urlString, options);
}
