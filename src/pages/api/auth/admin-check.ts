import type { APIRoute } from 'astro';
import { readAdminToken, verifyAdminToken } from '@/lib/auth-security';

const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  Pragma: 'no-cache',
};

export const GET: APIRoute = async ({ cookies, request }) => {
  try {
    const sessionToken = readAdminToken(cookies, request);

    if (!sessionToken) {
      return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers });
    }

    const validation = await verifyAdminToken(sessionToken);
    if (!validation.valid) {
      console.warn('[SECURITY] Invalid admin session token');
      return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers });
    }

    return new Response(
      JSON.stringify({ authenticated: true, username: validation.username }),
      { status: 200, headers }
    );
  } catch (error) {
    console.error('[ADMIN CHECK] Error:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ authenticated: false }), { status: 401, headers });
  }
};
