import type { APIRoute } from 'astro';
import { constantTimeEqual, getClientIP, readSecret, signAdminToken } from '@/lib/auth-security';

const MAX_BODY_BYTES = 4 * 1024;
const MAX_FAILURES = 8;
const LOCKOUT_MS = 15 * 60 * 1000;
const failedAttempts = new Map<string, { count: number; firstFailureAt: number }>();

function jsonResponse(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });
}

function isRateLimited(ip: string): boolean {
  const record = failedAttempts.get(ip);
  if (!record) return false;
  if (Date.now() - record.firstFailureAt >= LOCKOUT_MS) {
    failedAttempts.delete(ip);
    return false;
  }
  return record.count >= MAX_FAILURES;
}

function recordFailure(ip: string): void {
  const now = Date.now();
  const existing = failedAttempts.get(ip);
  if (!existing || now - existing.firstFailureAt >= LOCKOUT_MS) {
    failedAttempts.set(ip, { count: 1, firstFailureAt: now });
  } else {
    existing.count += 1;
  }
}

function clearFailures(ip: string): void {
  failedAttempts.delete(ip);
}

export const POST: APIRoute = async ({ request, cookies }) => {
  const ip = getClientIP(request.headers);
  try {
    if (isRateLimited(ip)) return jsonResponse({ success: false, message: 'Too many login attempts. Try again later.' }, 429);

    const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    if (contentType !== 'application/json') return jsonResponse({ success: false, message: 'Content-Type must be application/json' }, 415);

    const contentLength = request.headers.get('content-length');
    if (contentLength && Number.isFinite(Number(contentLength)) && Number(contentLength) > MAX_BODY_BYTES) return jsonResponse({ success: false, message: 'Request body is too large' }, 413);

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return jsonResponse({ success: false, message: 'Invalid request body' }, 400);

    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';
    if (!username || !password || username.length > 128 || password.length > 256) {
      recordFailure(ip);
      return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
    }

    const configuredUsername = await readSecret('ADMIN_USERNAME');
    const configuredPassword = await readSecret('ADMIN_PASSWORD');
    if (!configuredUsername || !configuredPassword) {
      console.error('[ADMIN LOGIN] Admin credentials are not configured. Please set ADMIN_USERNAME and ADMIN_PASSWORD in your Wix Secrets Manager.');
      return jsonResponse({ 
        success: false, 
        message: 'Admin credentials are not configured. Please contact your administrator to set up ADMIN_USERNAME and ADMIN_PASSWORD in Wix Secrets Manager.' 
      }, 503);
    }

    const credentialsValid = constantTimeEqual(username, configuredUsername) && constantTimeEqual(password, configuredPassword);
    if (!credentialsValid) {
      recordFailure(ip);
      return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
    }

    clearFailures(ip);
    const sessionToken = await signAdminToken(username, 86400 * 7 * 1000);
    cookies.set('admin_session', sessionToken, {
      path: '/', httpOnly: true, secure: true, sameSite: 'none', partitioned: true, maxAge: 86400 * 7,
    });

    return jsonResponse({ success: true, admin: true, username }, 200);
  } catch (error) {
    console.error('[ADMIN LOGIN] Error:', error instanceof Error ? error.message : String(error));
    return jsonResponse({ success: false, message: 'Server error' }, 500);
  }
};
