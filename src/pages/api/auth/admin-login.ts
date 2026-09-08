import type { APIRoute } from 'astro';
import { constantTimeEqual, readSecret, signAdminToken } from '@/lib/auth-security';

const MAX_BODY_BYTES = 4 * 1024;

function jsonResponse(payload: Record<string, unknown>, status: number): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
    },
  });
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const contentType = request.headers.get('content-type')?.split(';', 1)[0].trim().toLowerCase();
    if (contentType !== 'application/json') {
      return jsonResponse({ success: false, message: 'Content-Type must be application/json' }, 415);
    }

    const contentLength = request.headers.get('content-length');
    if (contentLength && Number.isFinite(Number(contentLength)) && Number(contentLength) > MAX_BODY_BYTES) {
      return jsonResponse({ success: false, message: 'Request body is too large' }, 413);
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return jsonResponse({ success: false, message: 'Invalid request body' }, 400);
    }

    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password || username.length > 128 || password.length > 256) {
      return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
    }

    // Credentials must come from deployment secrets, never source control.
    const configuredUsername = await readSecret('ADMIN_USERNAME');
    const configuredPassword = await readSecret('ADMIN_PASSWORD');

    if (!configuredUsername || !configuredPassword) {
      console.error('[ADMIN LOGIN] ADMIN_USERNAME/ADMIN_PASSWORD are not configured');
      return jsonResponse({ success: false, message: 'Admin authentication is not configured' }, 503);
    }

    const credentialsValid =
      constantTimeEqual(username, configuredUsername) &&
      constantTimeEqual(password, configuredPassword);

    if (!credentialsValid) {
      return jsonResponse({ success: false, message: 'Invalid credentials' }, 401);
    }

    const sessionToken = await signAdminToken(username, 86400 * 7 * 1000);

    cookies.set('admin_session', sessionToken, {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      partitioned: true,
      maxAge: 86400 * 7,
    });

    return jsonResponse({ success: true, admin: true, username }, 200);
  } catch (error) {
    console.error('[ADMIN LOGIN] Error:', error instanceof Error ? error.message : String(error));
    return jsonResponse({ success: false, message: 'Server error' }, 500);
  }
};
