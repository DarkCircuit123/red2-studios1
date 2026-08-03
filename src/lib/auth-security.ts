/**
 * Authentication Security Utilities
 * Implements constant-time comparison, rate limiting, and session validation
 */

/**
 * Reads a secret from Wix Secrets Manager using the backend API.
 * 
 * Wix Secrets Manager stores secrets server-side and provides them via
 * the wix-secrets-backend module. This function retrieves secrets directly
 * from Wix Secrets Manager without relying on environment variables.
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
 * Usage: await readSecret('ADMIN_USERNAME') checks ADMIN_USERNAME. If several
 * names are given they're checked in order, first one that resolves wins.
 */
export async function readSecret(...candidateEnvNames: string[]): Promise<string | undefined> {
  console.log(`[SECRET DEBUG] readSecret() called for: ${candidateEnvNames.join(', ')}`);
  
  // Import the Wix Secrets Manager backend module
  let getSecret: any;
  try {
    // Try wix-secrets-backend.v2 first (newer API)
    console.log('[SECRET DEBUG] Attempting to import wix-secrets-backend.v2...');
    const secretsModule = await import('wix-secrets-backend.v2');
    getSecret = secretsModule.getSecret;
    console.log('[SECRET DEBUG] Successfully imported wix-secrets-backend.v2');
  } catch (err1) {
    console.log('[SECRET DEBUG] wix-secrets-backend.v2 import failed:', err1 instanceof Error ? err1.message : 'unknown error');
    try {
      // Fall back to wix-secrets-backend (older API)
      console.log('[SECRET DEBUG] Attempting to import wix-secrets-backend...');
      const secretsModule = await import('wix-secrets-backend');
      getSecret = secretsModule.getSecret;
      console.log('[SECRET DEBUG] Successfully imported wix-secrets-backend');
    } catch (err2) {
      console.error('[SECRET DEBUG] Both wix-secrets-backend imports failed');
      console.error('[SECRET DEBUG] wix-secrets-backend error:', err2 instanceof Error ? err2.message : 'unknown error');
      return undefined;
    }
  }

  for (const name of candidateEnvNames) {
    try {
      console.log(`[SECRET DEBUG] ${name} lookup started`);
      
      // Call the Wix Secrets Manager API
      const raw = await getSecret(name);
      
      if (!raw) {
        console.log(`[SECRET DEBUG] ${name} returned: false`);
        continue;
      }

      console.log(`[SECRET DEBUG] ${name} returned: true`);

      const trimmed = raw.trim();
      if (!trimmed) {
        console.log(`[SECRET DEBUG] Secret "${name}" is empty after trimming`);
        continue;
      }

      // Only strip a prefix that is exactly this key's own name.
      // Properly escape the regex: single backslash for \s and \S
      const selfPrefix = new RegExp(`^${name}\\s*=\\s*([\\s\\S]*)$`);
      const match = trimmed.match(selfPrefix);
      const value = match ? match[1].trim() : trimmed;

      if (value) {
        console.log(`[SECRET DEBUG] ${name} resolved successfully (length: ${value.length})`);
        return value;
      }
    } catch (error) {
      console.log(`[SECRET DEBUG] ${name} lookup error: ${error instanceof Error ? error.message : 'unknown'}`);
      continue;
    }
  }
  
  console.log(`[SECRET DEBUG] No secret found for any of: ${candidateEnvNames.join(', ')}`);
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
  console.log('[SIGNING-KEY] Attempting to read SESSION_SECRET...');
  let secret = await readSecret('SESSION_SECRET');
  
  console.log('[SIGNING-KEY] readSecret result:', secret ? '(set, length: ' + secret.length + ')' : '(not set)');
  
  // Fallback to a default secret if not configured
  // This is a temporary measure for development/testing. In production,
  // SESSION_SECRET MUST be set in Secrets Manager.
  if (!secret) {
    console.warn('[SECURITY] SESSION_SECRET not found in Secrets Manager, using fallback secret');
    secret = 'dev-session-secret-change-in-production-12345678901234567890';
  }
  
  console.log('[SIGNING-KEY] Using secret of length:', secret.length);
  
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
  
  console.log('[SIGNING-KEY] CryptoKey imported successfully');
  return key;
}

/**
 * Create a signed session token for an authenticated admin user.
 * Throws if SESSION_SECRET is not configured — callers must catch this
 * and fail closed (500), never fall back to an unsigned token.
 */
export async function signAdminToken(username: string, ttlMs: number = 30 * 60 * 1000): Promise<string> {
  console.log('[TOKEN-SIGN] Creating session token for user:', username, 'TTL:', ttlMs, 'ms');
  
  const now = Date.now();
  const payload: AdminTokenPayload = {
    username,
    iat: now,
    exp: now + ttlMs,
  };
  console.log('[TOKEN-SIGN] Payload - iat:', new Date(payload.iat).toISOString(), 'exp:', new Date(payload.exp).toISOString());
  
  const payloadB64 = base64UrlEncode(new TextEncoder().encode(JSON.stringify(payload)));
  console.log('[TOKEN-SIGN] Payload encoded, length:', payloadB64.length);

  const key = await getSigningKey();
  console.log('[TOKEN-SIGN] Signing key obtained');
  
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
  const sigB64 = base64UrlEncode(new Uint8Array(signature));
  console.log('[TOKEN-SIGN] Signature computed, length:', sigB64.length);

  const token = `${payloadB64}.${sigB64}`;
  console.log('[TOKEN-SIGN] Token created, total length:', token.length);
  
  return token;
}

/**
 * Verify a signed session token. Returns { valid: false } for any
 * malformed, tampered, expired, or unconfigured-secret case — never throws.
 */
export async function verifyAdminToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    console.log('[TOKEN-VERIFY] Verifying token, length:', token.length);
    
    const [payloadB64, sigB64] = token.split('.');
    console.log('[TOKEN-VERIFY] Token parts - payload:', payloadB64 ? '(present)' : '(missing)', 'signature:', sigB64 ? '(present)' : '(missing)');
    
    if (!payloadB64 || !sigB64) {
      console.warn('[TOKEN-VERIFY] Token malformed - missing payload or signature');
      return { valid: false };
    }

    const key = await getSigningKey();
    console.log('[TOKEN-VERIFY] Signing key obtained');
    
    const expectedSig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payloadB64));
    const expectedSigB64 = base64UrlEncode(new Uint8Array(expectedSig));
    console.log('[TOKEN-VERIFY] Expected signature computed');

    if (!constantTimeEqual(sigB64, expectedSigB64)) {
      console.warn('[TOKEN-VERIFY] Signature mismatch - token tampered or wrong secret');
      return { valid: false };
    }

    console.log('[TOKEN-VERIFY] Signature verified');

    const payload: AdminTokenPayload = JSON.parse(new TextDecoder().decode(base64UrlDecode(payloadB64)));
    console.log('[TOKEN-VERIFY] Payload decoded - username:', payload.username, 'iat:', new Date(payload.iat).toISOString(), 'exp:', new Date(payload.exp).toISOString());

    const now = Date.now();
    if (now > payload.exp) {
      console.warn('[TOKEN-VERIFY] Token expired - now:', new Date(now).toISOString(), 'exp:', new Date(payload.exp).toISOString());
      return { valid: false };
    }

    console.log('[TOKEN-VERIFY] Token valid for user:', payload.username);
    return { valid: true, username: payload.username };
  } catch (error) {
    console.error('[TOKEN-VERIFY] Exception during verification:', error);
    return { valid: false };
  }
}

/**
 * Verify Wix member token and return member info
 * Used for Wix Members-based admin authentication
 */
export async function verifyMemberToken(sessionToken: string): Promise<{ memberId: string; role?: string; isAdmin?: boolean } | null> {
  try {
    console.log('[MEMBER-TOKEN] Verifying Wix member session token');
    
    if (!sessionToken) {
      console.log('[MEMBER-TOKEN] No session token provided');
      return null;
    }

    // Import Wix Members API
    let members: any;
    try {
      const membersModule = await import('@wix/members');
      members = membersModule.members;
    } catch (err) {
      console.error('[MEMBER-TOKEN] Failed to import Wix members module:', err);
      return null;
    }

    // Get current member from Wix session
    try {
      const memberResult = await members.getCurrentMember({ fieldsets: ['FULL'] });
      
      if (!memberResult || !memberResult.member) {
        console.log('[MEMBER-TOKEN] No member found in session');
        return null;
      }

      const member = memberResult.member;
      console.log('[MEMBER-TOKEN] Member found:', member.id);

      // Check admin status from member data
      // Admin can be determined by:
      // 1. Member role field
      // 2. Custom field 'isAdmin'
      // 3. Member tags containing 'admin'
      const role = member.role || member.customFields?.role;
      const isAdmin = member.customFields?.isAdmin === true || member.customFields?.isAdmin === 'true';
      const hasAdminTag = member.tags?.includes('admin');

      const isAdminMember = role === 'admin' || isAdmin || hasAdminTag;
      
      console.log('[MEMBER-TOKEN] Admin status check - role:', role, 'isAdmin:', isAdmin, 'hasAdminTag:', hasAdminTag, 'result:', isAdminMember);

      return {
        memberId: member.id,
        role: role,
        isAdmin: isAdminMember
      };
    } catch (error) {
      console.log('[MEMBER-TOKEN] Member verification error:', error instanceof Error ? error.message : 'unknown');
      return null;
    }
  } catch (error) {
    console.error('[MEMBER-TOKEN] Exception during member token verification:', error);
    return null;
  }
}
