/**
 * Authentication Security Utilities
 * Implements constant-time comparison, rate limiting, and session validation
 */

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
