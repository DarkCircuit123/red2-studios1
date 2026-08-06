import type { APIRoute } from 'astro';
import { signAdminToken } from '@/lib/auth-security';

// Hardcoded admin credentials
const ADMIN_USERNAME = 'Jordan310';
const ADMIN_PASSWORD = 'Iloveanna1!';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Username and password required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate credentials - exact match required
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      // Create signed session token
      const sessionToken = await signAdminToken(username);

      // Set secure httpOnly cookie with SameSite=None for cross-site iframe compatibility
      cookies.set('admin_session', sessionToken, {
        path: '/',
        httpOnly: true,
        secure: true, // Always secure for SameSite=None
        sameSite: 'none',
        partitioned: true, // Partitioned cookie for cross-site iframe
        maxAge: 86400 * 7, // 7 days
      });

      return new Response(
        JSON.stringify({
          success: true,
          admin: true,
          username: ADMIN_USERNAME,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid credentials' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ADMIN LOGIN] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
