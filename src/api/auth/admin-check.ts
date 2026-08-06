import type { APIRoute } from 'astro';
import { verifyAdminToken } from '@/lib/auth-security';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ authenticated: false }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verify the signed token
    const validation = await verifyAdminToken(sessionToken);
    
    if (!validation.valid) {
      return new Response(
        JSON.stringify({ authenticated: false }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Session token is valid
    return new Response(
      JSON.stringify({
        authenticated: true,
        username: validation.username,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ADMIN CHECK] Error:', error);
    return new Response(
      JSON.stringify({ authenticated: false }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
