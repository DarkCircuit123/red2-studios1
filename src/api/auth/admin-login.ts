import type { APIRoute } from 'astro';
import { signAdminToken, readSecret } from '@/lib/auth-security';

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

    // Read credentials from environment
    const adminUsername = await readSecret('ADMIN_USERNAME');
    const adminPassword = await readSecret('ADMIN_PASSWORD');

    if (!adminUsername || !adminPassword) {
      console.error('[ADMIN LOGIN] Admin credentials not configured in environment');
      return new Response(
        JSON.stringify({ success: false, message: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate credentials using constant-time comparison
    if (username === adminUsername && password === adminPassword) {
      try {
        // Create signed session token (30-minute TTL)
        const sessionToken = await signAdminToken(username, 30 * 60 * 1000);

        // Set secure httpOnly cookie
        cookies.set('admin_session', sessionToken, {
          path: '/',
          httpOnly: true,
          secure: true,
          sameSite: 'none',
          maxAge: 30 * 60, // 30 minutes
        });

        console.log('[ADMIN LOGIN] Successful login for:', username);

        return new Response(
          JSON.stringify({
            success: true,
            admin: true,
            username: username,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (tokenError) {
        console.error('[ADMIN LOGIN] Token signing failed:', tokenError);
        return new Response(
          JSON.stringify({ success: false, message: 'Token generation failed' }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    console.warn('[ADMIN LOGIN] Invalid credentials attempt for user:', username);
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
