import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Clear admin session cookie with cross-site compatibility flags
    cookies.delete('admin_session', {
      path: '/',
      secure: true,
      sameSite: 'none',
      partitioned: true,
    });

    return new Response(
      JSON.stringify({ success: true, message: 'Logged out' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ADMIN LOGOUT] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Logout failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
