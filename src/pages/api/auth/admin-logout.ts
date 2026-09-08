import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Match the attributes used when the session cookie is created so the
    // browser actually removes the same cookie.
    cookies.delete('admin_session', {
      path: '/',
      secure: true,
      sameSite: 'none',
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Logged out' }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  } catch (error) {
    console.error('[ADMIN LOGOUT] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Logout failed' }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
};
