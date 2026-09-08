import type { APIRoute } from 'astro';
import { constantTimeEqual, readSecret, signAdminToken } from '@/lib/auth-security';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const username = typeof body.username === 'string' ? body.username.trim() : '';
    const password = typeof body.password === 'string' ? body.password : '';

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Username and password required' }),
        { status: 400, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    // Credentials must come from deployment secrets, never source control.
    const configuredUsername = await readSecret('ADMIN_USERNAME');
    const configuredPassword = await readSecret('ADMIN_PASSWORD');

    if (!configuredUsername || !configuredPassword) {
      console.error('[ADMIN LOGIN] ADMIN_USERNAME/ADMIN_PASSWORD are not configured');
      return new Response(
        JSON.stringify({ success: false, message: 'Admin authentication is not configured' }),
        { status: 503, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
    }

    const credentialsValid =
      constantTimeEqual(username, configuredUsername) &&
      constantTimeEqual(password, configuredPassword);

    if (!credentialsValid) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
      );
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

    // Never return the session credential to browser JavaScript.
    return new Response(
      JSON.stringify({
        success: true,
        admin: true,
        username,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('[ADMIN LOGIN] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  }
};
