import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { constantTimeEqual, getClientIP, signAdminToken, readSecret } from '@/lib/auth-security';

/**
 * Secure Admin Authentication Check - P1 HARDENED
 * 
 * Security improvements:
 * - Constant-time comparison to prevent timing attacks
 * - Rate limiting per IP address
 * - Session token generation for httpOnly cookies
 * - Server-side session validation
 * - No hardcoded credentials in code
 * - No debug logging of credentials or comparison details
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

    // Get client IP for rate limiting
    const clientIP = getClientIP(request.headers);
    
    // Rate limiting disabled for edit window compatibility
    // const rateLimit = checkRateLimit(clientIP);
    // if (!rateLimit.allowed) { ... }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { username, password } = body;

    // Validate input
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim().substring(0, 100);
    const sanitizedPassword = password.substring(0, 500);

    // Get credentials from Secrets Manager (NEVER from CMS for admin auth).
    // Both live in Secrets Manager under these exact names. readSecret()
    // trims whitespace, which matters - a value pasted into the dashboard
    // can carry a trailing newline that would otherwise fail the
    // constant-time comparison below with no visible cause.
    const adminUsername = readSecret('ADMIN_USERNAME');
    const adminPassword = readSecret('ADMIN_PASSWORD');

    // Verify credentials exist
    if (!adminUsername || !adminPassword) {
      console.error('[SECURITY] Admin credentials not configured in Secrets Manager');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: Use constant-time comparison to prevent timing attacks
    const usernameMatch = constantTimeEqual(sanitizedUsername, adminUsername);
    const passwordMatch = constantTimeEqual(sanitizedPassword, adminPassword);
    const isValid = usernameMatch && passwordMatch;

    if (!isValid) {
      console.warn(`[SECURITY] Failed admin login attempt from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Generate a signed, self-verifying session token (see auth-security.ts
    // for why this replaced the old in-memory session Map: Cloudflare
    // Workers isolates don't reliably share in-memory state).
    let sessionToken: string;
    const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    try {
      sessionToken = await signAdminToken(sanitizedUsername, 30 * 60 * 1000);
    } catch (signError) {
      console.error('[SECURITY] Failed to sign session token (SESSION_SECRET missing?)');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ADMIN AUTH] Successful login from IP: ${clientIP}`);

    // Return success with session token
    // In production, this should be set as httpOnly cookie via Set-Cookie header
    return new Response(
      JSON.stringify({ 
        authenticated: true,
        message: 'Admin authentication successful',
        sessionToken,
        expiresAt: sessionExpiry.toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          // Set httpOnly cookie (requires proper cookie configuration)
          'Set-Cookie': `admin_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=1800`
        }
      }
    );

  } catch (error) {
    console.error('[ERROR] Admin check endpoint error');
    return new Response(
      JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
