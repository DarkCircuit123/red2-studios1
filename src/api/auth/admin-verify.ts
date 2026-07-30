/**
 * Admin Session Verification Endpoint
 *
 * Verifies that the admin session is still valid before allowing mutations.
 * Called on admin panel mount and by all admin-mutating functions.
 *
 * NOTE: This used to check an in-memory Map of active sessions. That does
 * not work reliably on Cloudflare Workers (this site's deploy target) —
 * different edge isolates can each hold their own empty copy of the Map,
 * so a session created on one request could appear invalid on the very
 * next one. Verification now checks a signed token's own signature and
 * expiry instead (see verifyAdminToken in @/lib/auth-security), which
 * requires no shared server state at all.
 */

import type { APIRoute } from 'astro';
import { verifyAdminToken, getClientIP } from '@/lib/auth-security';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Explicit logout: always clear the cookie regardless of whether the
    // token was still valid. Previously logout only cleared client-side
    // state and left the httpOnly cookie live until its natural 30-minute
    // expiry — a refresh right after "logging out" would silently log the
    // admin back in.
    if (body?.action === 'logout') {
      return new Response(
        JSON.stringify({ valid: false, loggedOut: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'admin_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0',
          },
        }
      );
    }

    // Prefer the httpOnly cookie — it's the tamper-proof source and lets
    // the client verify a session (e.g. on page refresh) without ever
    // having to hold the raw token in JS. Fall back to a body-supplied
    // token for backward compatibility with any existing caller.
    const sessionToken = cookies.get('admin_session')?.value || body?.sessionToken;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing session token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientIP = getClientIP(request.headers);
    const validation = await verifyAdminToken(sessionToken);

    if (!validation.valid) {
      console.warn(`[SECURITY] Session verification failed from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        valid: true,
        username: validation.username,
        message: 'Session is valid'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERROR] Admin verify endpoint error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
