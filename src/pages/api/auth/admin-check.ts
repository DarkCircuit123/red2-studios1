import type { APIRoute } from 'astro';
import { readSecret, constantTimeEqual } from '@/lib/auth-security';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ authenticated: false }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the token against the stored secret
    const expectedToken = readSecret('ADMIN_SESSION_TOKEN');
    if (!expectedToken) {
      console.error('[ADMIN CHECK] ADMIN_SESSION_TOKEN not configured');
      return new Response(
        JSON.stringify({ authenticated: false }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Use constant-time comparison to prevent timing attacks
    const isValid = constantTimeEqual(sessionToken, expectedToken);
    if (!isValid) {
      console.warn('[SECURITY] Invalid admin session token');
      return new Response(
        JSON.stringify({ authenticated: false }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Session token is valid
    return new Response(
      JSON.stringify({
        authenticated: true,
        username: 'Jordan310',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ADMIN CHECK] Error:', error);
    return new Response(
      JSON.stringify({ authenticated: false }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
