/**
 * Authentication Security Utilities
 * Implements constant-time comparison, rate limiting, and session validation
 */

/**
 * Reads a secret from process.env / import.meta.env, checking each
 * candidate name in order and returning the first one that's set.
 *
 * Trims surrounding whitespace, which matters because pasting a value
 * into the Secrets Manager dashboard easily leaves a trailing newline.
 *
 * Also tolerates a value accidentally saved in "KEY = value" form (the
 * whole env line pasted into the Value field instead of just the value).
 * This ONLY strips the prefix when KEY is exactly the name being looked
 * up - deliberately narrow. A looser pattern would silently corrupt any
 * legitimate secret whose value happens to contain an '=', e.g. a
 * password like "ABC=123" would be truncated to "123" and every login
 * would fail for a reason nothing in the logs would explain.
 *
 * Usage: readSecret('ADMIN_USERNAME') checks ADMIN_USERNAME. If several
 * names are given they're checked in order, first one that resolves wins.
 */
export function readSecret(...candidateEnvNames: string[]): string | undefined {
  for (const name of candidateEnvNames) {
    const raw = process.env[name] || import.meta.env[name];
    if (!raw) continue;

    const trimmed = raw.trim();
    if (!trimmed) continue;

    // Only strip a prefix that is exactly this key's own name.
    const selfPrefix = new RegExp(`^${name}\\s*=\\s*([\\s\\S]*)$`);
    const match = trimmed.match(selfPrefix);
    const value = match ? match[1].trim() : trimmed;

    if (value) return value;
  }
  return undefined;
}

/**
 * Admin gate for API routes.
 *
 * Returns null when the caller holds a valid admin session, or a ready-to-
 * return 401 Response when they don't.
 *
 * Use this on EVERY route that calls Wix Data with `suppressAuth: true`.
 * suppressAuth bypasses collection permissions completely, so such a route
 * is only as protected as its own auth check - locking the collection down
 * does nothing if an open endpoint reads or writes it with suppressAuth.
 *
 *   const denied = await requireAdmin(cookies, request);
 *   if (denied) return denied;
 */
export async function requireAdmin(
  cookies: { get?: (name: string) => { value?: string } | undefined } | undefined,
  request: Request,
  label = 'admin-only endpoint'
): Promise<Response | null> {
  const sessionToken = cookies?.get?.('admin_session')?.value;
  const validation = sessionToken
    ? await verifyAdminToken(sessionToken)
    : { valid: false as const };

  if (!validation.valid) {
    console.warn(
      `[SECURITY] Unauthorized ${label} attempt from IP: ${getClientIP(request.headers)}`
    );
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  return null;
}

/**
 * Constant-time string comparison to prevent timing attacks
 * Compares two strings in constant time regardless of length or content
 */
export function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    // Still iterate to prevent timing leak
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

/**
 * Simple password hashing using crypto (Node.js compatible)
 * For production, use bcrypt via backend
 */
export async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify password against hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  const passwordHash = await hashPassword(password);
  return constantTimeEqual(passwordHash, hash);
}

/**
 * Rate limiter using in-memory store
 * Tracks failed attempts per IP address
 */
interface RateLimitEntry {
  attempts: number;
  resetTime: number;
  locked: boolean;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const RATE_LIMIT_CONFIG = {
  maxAttempts: 5,
  windowMs: 15 * 60 * 1000, // 15 minutes
  lockoutMs: 30 * 60 * 1000, // 30 minutes
};

export function getRateLimitKey(ip: string): string {
  return `auth:${ip}`;
}

export function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetTime: number } {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    rateLimitStore.delete(key);
    entry = undefined;
  }

  if (!entry) {
    entry = {
      attempts: 0,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      locked: false,
    };
    rateLimitStore.set(key, entry);
  }

  const isLocked = entry.locked && now < entry.resetTime + RATE_LIMIT_CONFIG.lockoutMs;
  const allowed = !isLocked && entry.attempts < RATE_LIMIT_CONFIG.maxAttempts;
  const remaining = Math.max(0, RATE_LIMIT_CONFIG.maxAttempts - entry.attempts);

  return {
    allowed,
    remaining,
    resetTime: entry.resetTime,
  };
}

export function recordFailedAttempt(ip: string): void {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  let entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    entry = {
      attempts: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
      locked: false,
    };
  } else {
    entry.attempts++;
    if (entry.attempts >= RATE_LIMIT_CONFIG.maxAttempts) {
      entry.locked = true;
    }
  }

  rateLimitStore.set(key, entry);
}

export function resetRateLimit(ip: string): void {
  const key = getRateLimitKey(ip);
  rateLimitStore.delete(key);
}

/**
 * Session token generation and validation
 */
export function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Validate session token format
 */
export function isValidSessionToken(token: string): boolean {
  return /^[a-f0-9]{64}$/.test(token);
}

/**
 * Extract IP address from request headers
 */
export function getClientIP(headers: Headers): string {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return headers.get('x-real-ip') || 'unknown';
}

/**
 * Stateless signed admin session tokens (HMAC-SHA256)
 *
 * This site deploys on Cloudflare Workers (@astrojs/cloudflare). An
 * in-memory Map is NOT reliably shared across requests there — different
 * edge isolates/regions can each hold their own empty copy, which caused
 * the intermittent "login succeeds, then admin panel never appears"
 * behavior: the session was created in one isolate's memory and the next
 * request landed on a different one that had never heard of it.
 *
 * A signed token is self-verifying: the signature + expiry are checked
 * with pure math, no server-side lookup required, so it behaves
 * identically on every edge node and survives redeploys/cold starts.
 *
 * Deliberately NOT pinned to client IP: mobile/cellular connections (and
 * CDN edge hops) legitimately rotate IPs mid-session, which would cause
 * spurious logouts for exactly that kind of usage.
 */

interface AdminTokenPayload {
  username: string;
  iat: number; // issued-at, ms epoch
  exp: number; // expiry, ms epoch
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
  const secret = readSecret('SESSION_SECRET');
  if (!secret) {
    throw new Error('SESSION_SECRET is not configured in Secrets Manager');
  }
  const encoder = new TextEncoder();
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Create a signed session token for an authenticated admin user.
 * Throws if SESSION_SECRET is not configured — callers must catch this
 * and fail closed (500), never fall back to an unsigned token.
 */
export async function signAdminToken(username: string, ttlMs: number = 30 * 60 * 1000): Promise<string> {
  const payload: AdminTokenPayload = {
    username,
    iat: Date.now(),
    exp: Date.now() + ttlMs,
  };
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));

  const key = await getSigningKey();
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  const sigB64 = base64UrlEncode(new Uint8Array(signature));

  return `${payloadB64}.${sigB64}`;
}

/**
 * Verify a signed session token. Returns { valid: false } for any
 * malformed, tampered, expired, or unconfigured-secret case — never throws.
 */
export async function verifyAdminToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    const [payloadB64, sigB64] = token.split('.');
    if (!payloadB64 || !sigB64) return { valid: false };

    const key = await getSigningKey();
    const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    const expectedSigB64 = base64UrlEncode(new Uint8Array(expectedSig));

    if (!constantTimeEqual(sigB64, expectedSigB64)) {
      return { valid: false };
    }

    const payload: AdminTokenPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));

    if (Date.now() > payload.exp) {
      return { valid: false };
    }

    return { valid: true, username: payload.username };
  } catch {
    return { valid: false };
  }
}
