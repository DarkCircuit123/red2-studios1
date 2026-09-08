/**
 * URL-level SSRF guard for admin-controlled external imports.
 *
 * This intentionally rejects local/private/reserved address forms before any
 * outbound request. DNS rebinding cannot be fully prevented here because the
 * final resolver/fetcher is outside this helper.
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
    (a === 192 && b === 88 && c === 99) ||
    (a === 198 && (b === 18 || b === 19)) ||
    (a === 198 && b === 51 && c === 100) ||
    (a === 203 && b === 0 && c === 113) ||
    a >= 224
  );
}

function hexToIPv4(value: string): string | null {
  const n = Number.parseInt(value, 16);
  if (!Number.isFinite(n) || n < 0 || n > 0xffffffff) return null;
  return `${(n >>> 24) & 255}.${(n >>> 16) & 255}.${(n >>> 8) & 255}.${n & 255}`;
}

function isBlockedIPv6(hostname: string): boolean {
  const normalized = hostname.toLowerCase();
  if (isIP(normalized) !== 6) return false;

  if (normalized === '::' || normalized === '::1') return true;
  if (/^(?:fe[89ab]|fc|fd|ff)/.test(normalized)) return true;

  // IPv4-mapped IPv6 may appear in either dotted-decimal or hexadecimal form.
  const mappedDotted = normalized.match(/^(?:0*:){0,6}ffff:(\d+(?:\.\d+){3})$/i)?.[1];
  if (mappedDotted) return isBlockedIPv4(mappedDotted);

  const mappedHex = normalized.match(/^(?:0*:){0,6}ffff:([0-9a-f]{4}):([0-9a-f]{4})$/i);
  if (mappedHex) {
    const ipv4 = hexToIPv4(`${mappedHex[1]}${mappedHex[2]}`);
    return ipv4 ? isBlockedIPv4(ipv4) : true;
  }

  return false;
}

export function isSafeExternalUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString.trim());
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return false;
    if (url.username || url.password || !url.hostname) return false;

    const hostname = url.hostname.toLowerCase().replace(/^\[/, '').replace(/\]$/, '').replace(/\.$/, '');
    if (
      hostname === 'localhost' || hostname.endsWith('.localhost') ||
      hostname === 'local' || hostname.endsWith('.local') ||
      hostname.endsWith('.internal') || hostname.endsWith('.home.arpa')
    ) return false;

    const ipVersion = isIP(hostname);
    if (ipVersion === 4) return !isBlockedIPv4(hostname);
    if (ipVersion === 6) return !isBlockedIPv6(hostname);

    // Reject alternate numeric IPv4 spellings (decimal/octal/hex) rather than
    // letting a parser/fetcher reinterpret them as a private address.
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
