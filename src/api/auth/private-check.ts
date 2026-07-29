import type { APIRoute } from 'astro';

/**
 * Secure Private Page Authentication Check
 * 
 * This endpoint validates access to private/classified content server-side.
 * NEVER expose credentials in frontend code.
 * 
 * Environment Variables Required:
 * - PRIVATE_PAGE_PASSWORD: Password for private page access (stored securely)
 */

export const POST: APIRoute = async ({ request }) => {
  try {
    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body = await request.json();
    const { password } = body;

    // Validate input
    if (!password) {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Missing password' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get password from environment variables (NEVER hardcode)
    const privatePagePassword = import.meta.env.PRIVATE_PAGE_PASSWORD;

    // Validate password
    // In production, use bcrypt or similar for password hashing
    const isValid = password === privatePagePassword;

    if (!isValid) {
      // Log failed attempt (for security monitoring)
      console.warn(`[SECURITY] Failed private page access attempt`);
      
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Password is valid - return success
    return new Response(
      JSON.stringify({ 
        authenticated: true,
        message: 'Access granted'
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[ERROR] Private check endpoint error:', error);
    return new Response(
      JSON.stringify({ authenticated: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
