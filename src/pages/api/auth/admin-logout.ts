import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Match the attributes used when the session cookie is created so the
    // partitioned cookie is actually removed by the browser.
    cookies.delete('admin_session', {
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Logged out' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[ADMIN LOGOUT] Error:', error instanceof Error ? error.message : String(error));
    return new Response(
      JSON.stringify({ success: false, message: 'Logout failed' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
};
