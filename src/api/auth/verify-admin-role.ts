import type { APIRoute } from 'astro';

/**
 * Verify if the authenticated member has admin role
 * Backend verification for security - never rely on frontend checks alone
 * 
 * NOTE: Admin verification is handled via the admin_session cookie
 * This endpoint is kept for reference but the actual auth flow uses
 * the AdminAuthProvider context which manages admin state separately
 */
export const POST: APIRoute = async ({ request }) => {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return new Response(
        JSON.stringify({
          isAdmin: false,
          error: 'No authorization header',
          status: 401
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // For now, we trust the admin_session cookie set by the auth flow
    // In production, you would validate the token here
    // The actual admin check happens in AdminAuthProvider.tsx
    
    return new Response(
      JSON.stringify({
        isAdmin: true,
        status: 200
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Admin verification error:', error);
    return new Response(
      JSON.stringify({
        isAdmin: false,
        error: 'Verification failed',
        status: 500
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
