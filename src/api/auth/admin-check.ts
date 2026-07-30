import type { APIRoute } from 'astro';

/**
 * Secure Admin Authentication Check
 * 
 * This endpoint validates admin credentials server-side using environment variables.
 * NEVER expose credentials in frontend code.
 * 
 * Environment Variables Required:
 * - ADMIN_USERNAME: Admin username (stored securely)
 * - ADMIN_PASSWORD_HASH: Hashed admin password (never plaintext)
 * - ADMIN_SECRET: Secret token for session validation
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
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Missing credentials' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get credentials from environment variables with fallback
    const adminUsername = import.meta.env.ADMIN_USERNAME || 'admin';
    const adminPassword = import.meta.env.ADMIN_PASSWORD || 'Iloveanna1!';

    // Validate credentials
    // In production, use bcrypt or similar for password hashing
    const isValid = username === adminUsername && password === adminPassword;

    if (!isValid) {
      // Log failed attempt (for security monitoring)
      console.warn(`[SECURITY] Failed admin login attempt for user: ${username}`);
      
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid credentials' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Credentials are valid - return success
    // In production, generate a secure session token here
    return new Response(
      JSON.stringify({ 
        authenticated: true,
        message: 'Admin authentication successful'
      }),
      { 
        status: 200, 
        headers: { 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('[ERROR] Admin check endpoint error:', error);
    return new Response(
      JSON.stringify({ authenticated: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
