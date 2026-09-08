import type { APIRoute } from 'astro';
import { constantTimeEqual, signAdminToken, readSecret } from '@/lib/auth-security';

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    if (typeof username !== 'string' || typeof password !== 'string' || !username || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Username and password required' }),
        { status: 400, headers: JSON_HEADERS }
      );
    }

    // Read credentials from environment
    const adminUsername = await readSecret('ADMIN_USERNAME');
    const adminPassword = await readSecret('ADMIN_PASSWORD');

    if (!adminUsername || !adminPassword) {
      console.error('[ADMIN LOGIN] Admin credentials not configured in environment');
      return new Response(
        JSON.stringify({ success: false, message: 'Server configuration error' }),
        { status: 500, headers: JSON_HEADERS }
      );
    }

    // Validate credentials using constant-time comparison for both fields.
    const usernameMatches = constantTimeEqual(username, adminUsername);
    const passwordMatches = constantTimeEqual(password, adminPassword);

    if (usernameMatches && passwordMatches) {
      try {
        // Create signed session token (30-minute TTL)
        const sessionToken = await signAdminToken(adminUsername, 30 * 60 * 1000);

        // Set secure httpOnly cookie
        cookies.set('admin_session', sessionToken, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 30 * 60, // 30 minutes
        });

        console.log('[ADMIN LOGIN] Successful login');

        return new Response(
          JSON.stringify({
            success: true,
            admin: true,
            username: adminUsername,
          }),
          { status: 200, headers: JSON_HEADERS }
        );
      } catch (tokenError) {
        console.error('[ADMIN LOGIN] Token signing failed:', tokenError);
        return new Response(
          JSON.stringify({ success: false, message: 'Token generation failed' }),
          { status: 500, headers: JSON_HEADERS }
        );
      }
    }

    // Do not echo the attempted username into server logs.
    console.warn('[ADMIN LOGIN] Invalid credentials attempt');
    return new Response(
      JSON.stringify({ success: false, message: 'Invalid credentials' }),
      { status: 401, headers: JSON_HEADERS }
    );
  } catch (error) {
    console.error('[ADMIN LOGIN] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers: JSON_HEADERS }
    );
  }
};
