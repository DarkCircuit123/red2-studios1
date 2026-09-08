/**
 * Admin Session Verification Endpoint
 *
 * Verifies that the admin session is still valid before allowing mutations.
 * Called on admin panel mount and by all admin-mutating functions.
 *
 * Supports signed admin tokens stored in the httpOnly admin_session cookie.
 */

import type { APIRoute } from 'astro';
import { verifyAdminToken, getClientIP, verifyMemberToken } from '@/lib/auth-security';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    const body = await request.json().catch(() => ({}));

    // Explicit logout: clear the cookie using the SAME cookie attributes
    // used by admin-login.ts. The previous response added `Partitioned`,
    // which does not match the login cookie and can leave the original
    // admin_session cookie alive in browsers that support partitioned cookies.
    if (body?.action === 'logout') {
      cookies.delete('admin_session', {
        path: '/',
        httpOnly: true,
        secure: true,
        sameSite: 'none',
      });

      return new Response(
        JSON.stringify({ valid: false, loggedOut: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-store',
          },
        }
      );
    }

    const cookieValue = cookies.get('admin_session')?.value;
    const sessionToken = cookieValue || body?.sessionToken;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing session token' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    const clientIP = getClientIP(request.headers);
    const validation = await verifyAdminToken(sessionToken);

    if (validation.valid) {
      return new Response(
        JSON.stringify({
          valid: true,
          username: validation.username,
          message: 'Session is valid',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    // Backward-compatible Wix member verification.
    const memberInfo = await verifyMemberToken(sessionToken);

    if (memberInfo && memberInfo.isAdmin) {
      return new Response(
        JSON.stringify({
          valid: true,
          memberId: memberInfo.memberId,
          message: 'Session is valid',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    console.warn(`[SECURITY] Session verification failed from IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ valid: false, error: 'Invalid or expired session' }),
      { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[ERROR] Admin verify endpoint error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
};
