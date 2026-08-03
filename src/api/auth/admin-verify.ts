/**
 * Admin Session Verification Endpoint
 *
 * Verifies that the admin session is still valid before allowing mutations.
 * Called on admin panel mount and by all admin-mutating functions.
 *
 * Supports both:
 * 1. Legacy signed admin tokens (for backward compatibility)
 * 2. Wix Members-based authentication (new approach)
 */

import type { APIRoute } from 'astro';
import { verifyAdminToken, getClientIP, verifyMemberToken } from '@/lib/auth-security';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (request.method !== 'POST') {
      console.log('[ADMIN-VERIFY] Non-POST request rejected');
      return new Response(
        JSON.stringify({ valid: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json().catch(() => ({}));
    console.log('[ADMIN-VERIFY] Request received, action:', body?.action || 'verify');

    // Explicit logout: always clear the cookie regardless of whether the
    // token was still valid. Previously logout only cleared client-side
    // state and left the httpOnly cookie live until its natural 30-minute
    // expiry — a refresh right after "logging out" would silently log the
    // admin back in.
    if (body?.action === 'logout') {
      console.log('[ADMIN-VERIFY] Logout action triggered');
      console.log('[ADMIN-VERIFY] Clearing admin_session cookie');
      console.log('[ADMIN-VERIFY] Set-Cookie header: admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
      return new Response(
        JSON.stringify({ valid: false, loggedOut: true }),
        {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
          },
        }
      );
    }

    // Log cookie state
    console.log('[ADMIN-VERIFY] Checking for admin_session cookie...');
    const cookieValue = cookies.get('admin_session')?.value;
    console.log('[ADMIN-VERIFY] Cookie from request:', cookieValue ? '(present, length: ' + cookieValue.length + ')' : '(missing)');
    
    // Prefer the httpOnly cookie — it's the tamper-proof source and lets
    // the client verify a session (e.g. on page refresh) without ever
    // having to hold the raw token in JS. Fall back to a body-supplied
    // token for backward compatibility with any existing caller.
    const sessionToken = cookieValue || body?.sessionToken;
    
    console.log('[ADMIN-VERIFY] Session token source:', cookieValue ? 'cookie' : (body?.sessionToken ? 'body' : 'none'));

    if (!sessionToken) {
      console.warn('[ADMIN-VERIFY] No session token found (cookie or body)');
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing session token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientIP = getClientIP(request.headers);
    console.log('[ADMIN-VERIFY] Verifying token from IP:', clientIP);
    
    // First try verifying as admin token (for backward compatibility)
    let validation = await verifyAdminToken(sessionToken);
    
    if (validation.valid) {
      console.log('[ADMIN-VERIFY] Session valid for user:', validation.username);
      return new Response(
        JSON.stringify({
          valid: true,
          username: validation.username,
          message: 'Session is valid'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // If admin token verification failed, try Wix member token verification
    console.log('[ADMIN-VERIFY] Admin token verification failed, trying Wix member verification...');
    const memberInfo = await verifyMemberToken(sessionToken);
    
    if (memberInfo && memberInfo.isAdmin) {
      console.log('[ADMIN-VERIFY] Session valid for admin member:', memberInfo.memberId);
      return new Response(
        JSON.stringify({
          valid: true,
          memberId: memberInfo.memberId,
          message: 'Session is valid'
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.warn(`[SECURITY] Session verification failed from IP: ${clientIP}`);
    return new Response(
      JSON.stringify({ valid: false, error: 'Invalid or expired session' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERROR] Admin verify endpoint error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
