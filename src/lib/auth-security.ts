/**
 * Authentication Security Utilities
 * Implements constant-time comparison and signed session validation.
 */

import { auth } from '@wix/essentials';
import { secrets } from '@wix/secrets';

const getWixSecretValue = auth.elevate(secrets.getSecretValue);

/**
 * Read a secret from the server environment first, then fall back to Wix
 * Secrets Manager. Wix-hosted Astro endpoints do not expose Secrets Manager
 * values through process.env, so relying on environment variables alone makes
 * correctly configured Wix secrets appear to be missing at runtime.
 *
 * Never logs or returns a secret to client-side code.
 */
export async function readSecret(...candidateEnvNames: string[]): Promise<string | undefined> {
  for (const name of candidateEnvNames) {
    try {
      const raw = typeof process !== 'undefined' && process.env ? process.env[name] : undefined;
      if (raw) {
        const trimmed = raw.trim();
        if (trimmed) {
          // Tolerate an accidentally pasted KEY=value environment entry, but
          // only when the prefix exactly matches the key being requested.
          const selfPrefix = new RegExp(`^${name}\\s*=\\s*([\\s\\S]*)$`);
          const match = trimmed.match(selfPrefix);
          const value = match ? match[1].trim() : trimmed;
          if (value) return value;
        }
      }
    } catch {
      // Continue to Wix Secrets Manager if the environment is unavailable.
    }

    try {
      const result = await getWixSecretValue(name);
      const value = typeof result === 'string' ? result : result?.value;
      if (typeof value === 'string' && value.trim()) return value.trim();
    } catch {
      // The secret may not exist, may be unavailable in local development, or
      // the current runtime may not have Wix secret-manager access. Fall back
      // to the next configured source/name without exposing secret details.
    }
  }

  return undefined;
}

/**
 * Read admin token from the httpOnly cookie, or explicitly supplied headers
 * for trusted server-to-server callers.
 */
export function readAdminToken(
  cookies: { get?: (name: string) => { value?: string } | undefined } | undefined,
  request: Request
): string | null {
  const cookieToken = cookies?.get?.('admin_session')?.value;
  if (cookieToken) return cookieToken;

  const headerToken = request.headers.get('x-admin-session');
  if (headerToken) return headerToken;

  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) return authHeader.slice(7);

  return null;
}

/**
 * Admin gate for API routes.
 *
 * IMPORTANT: a normal Wix member is NOT an admin. Admin access requires a
 * valid signed admin_session token. This is especially important for routes
 * using suppressAuth, because Wix collection permissions are bypassed there.
 */
export async function requireAdmin(
  cookies: { get?: (name: string) => { value?: string } | undefined } | undefined,
  request: Request,
  label = 'admin-only endpoint'
): Promise<Response | null> {
  const sessionToken = readAdminToken(cookies, request);
  if (sessionToken) {
    const validation = await verifyAdminToken(sessionToken);
    if (validation.valid) return null;
  }

  console.warn(`[SECURITY] Unauthorized ${label} attempt from IP: ${getClientIP(request.headers)}`);
  return new Response(
    JSON.stringify({ success: false, error: 'Unauthorized' }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}

/** Constant-time string comparison. */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    let result = 0;
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      result |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
    }
    return false;
  }

  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/** SHA-256 helper retained for existing callers. */
export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return constantTimeEqual(await hashPassword(password), hash);
}

export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function isValidSessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return headers.get('x-real-ip') || 'unknown';
}

interface AdminTokenPayload {
  username: string;
  iat: number;
  exp: number;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let str = '';
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str: string): Uint8Array {
  const padLen = (4 - (str.length % 4)) % 4;
  const padded = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(padLen);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

async function getSigningKey(): Promise<CryptoKey> {
  const secret = await readSecret('SESSION_SECRET');

  // Fail closed. A known fallback secret would allow anyone who knows the
  // source code to forge an admin session when deployment configuration is
  // missing.
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured');
  }

  return crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signAdminToken(username: string, ttlMs: number = 30 * 60 * 1000): Promise<string> {
  if (!username) throw new Error('Cannot sign an admin token without a username');

  const now = Date.now();
  const payload: AdminTokenPayload = { username, iat: now, exp: now + ttlMs };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  return `${payloadB64}.${base64UrlEncode(new Uint8Array(signature))}`;
}

export async function verifyAdminToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    if (!token) return { valid: false };

    const parts = token.split('.');
    if (parts.length !== 2) return { valid: false };
    const [payloadB64, sigB64] = parts;
    if (!payloadB64 || !sigB64) return { valid: false };

    const key = await getSigningKey();
    const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    const expectedSigB64 = base64UrlEncode(new Uint8Array(expectedSig));
    if (!constantTimeEqual(sigB64, expectedSigB64)) return { valid: false };

    const payload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64))) as AdminTokenPayload;
    if (!payload || typeof payload.username !== 'string' || !payload.username) return { valid: false };
    if (!Number.isFinite(payload.exp) || !Number.isFinite(payload.iat)) return { valid: false };
    if (payload.exp <= payload.iat || Date.now() > payload.exp) return { valid: false };

    return { valid: true, username: payload.username };
  } catch {
    return { valid: false };
  }
}

/**
 * Verify the current Wix member and determine whether that member has an
 * explicit admin role/tag/custom field. Kept for callers that need member
 * information; requireAdmin deliberately does not treat membership alone as
 * authorization.
 */
export async function verifyMemberToken(sessionToken: string): Promise<{ memberId: string; role?: string; isAdmin?: boolean } | null> {
  try {
    if (!sessionToken) return null;

    const { members } = await import('@wix/members');
    const memberResult = await members.getCurrentMember({ fieldsets: ['FULL'] });
    if (!memberResult?.member) return null;

    const member = memberResult.member;
    const role = member.role || member.customFields?.role;
    const isAdmin = member.customFields?.isAdmin === true || member.customFields?.isAdmin === 'true';
    const hasAdminTag = member.tags?.includes('admin');

    return {
      memberId: member.id,
      role,
      isAdmin: role === 'admin' || isAdmin || hasAdminTag,
    };
  } catch {
    return null;
  }
}
