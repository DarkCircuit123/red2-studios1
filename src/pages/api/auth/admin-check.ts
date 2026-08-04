import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ cookies }) => {
  try {
    const sessionToken = cookies.get('admin_session')?.value;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ authenticated: false }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Session token exists and is valid
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
