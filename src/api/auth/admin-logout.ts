import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  try {
    // Clear admin session cookie with explicit expiration
    cookies.set('admin_session', '', {
      path: '/',
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 0, // Immediate expiration
    });

    console.log('[ADMIN LOGOUT] Session cleared');

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
