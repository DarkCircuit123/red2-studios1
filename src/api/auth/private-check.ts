import type { APIRoute } from 'astro';
import { readSecret, constantTimeEqual } from '@/lib/auth-security';

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

    // Get password from environment variables (NEVER hardcode).
    // readSecret() also tolerates a "KEY = value" string pasted into the
    // secret's value field, same as the admin login secrets.
    const privatePagePassword = readSecret('PRIVATE_PAGE_PASSWORD');

    if (!privatePagePassword) {
      // Distinguish "nothing is configured" from "wrong password" - this
      // was previously silently falling through to compare against
      // `undefined` and returning a generic "Invalid credentials", which
      // permanently locks the page with no signal as to why.
      console.error('[SECURITY] PRIVATE_PAGE_PASSWORD is not configured');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Constant-time comparison to prevent timing attacks (same as admin-check.ts)
    const isValid = constantTimeEqual(password, privatePagePassword);

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
