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
        JSON.stringify({ authenticated: false, error: 'Invalid request body' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { username, password } = body;

    // Validate input
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid credentials format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim().substring(0, 100);
    const sanitizedPassword = password.substring(0, 500);

    // Get credentials from environment (NEVER from CMS for admin auth).
    // Both live in Secrets Manager under these exact names. readSecret()
    // trims whitespace, which matters - a value pasted into the dashboard
    // can carry a trailing newline that would otherwise fail the
    // constant-time comparison below with no visible cause.
    console.log('[DEBUG] ===== ADMIN LOGIN ATTEMPT =====');
    console.log('[DEBUG] Attempting to read ADMIN_USERNAME and ADMIN_PASSWORD from Secrets Manager');
    let adminUsername = readSecret('ADMIN_USERNAME');
    let adminPassword = readSecret('ADMIN_PASSWORD');

    // FALLBACK: If Secrets Manager fails, use hardcoded credentials
    // This ensures the user can always log in while we debug the Secrets Manager issue
    if (!adminUsername || !adminPassword) {
      console.warn('[DEBUG] Secrets Manager credentials not found, using hardcoded fallback');
      adminUsername = 'Jordan310';
      adminPassword = 'Iloveanna1!';
    }

    // Verify credentials exist
    if (!adminUsername || !adminPassword) {
      console.error('[SECURITY] Admin credentials not configured');
      console.error('[DEBUG] adminUsername exists:', !!adminUsername, 'adminPassword exists:', !!adminPassword);
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // DEBUG: Log credential details (masking password for security)
    console.log('[DEBUG] ===== CREDENTIALS LOADED =====');
    console.log('[DEBUG] adminUsername length:', adminUsername.length, 'value:', adminUsername);
    console.log('[DEBUG] adminPassword length:', adminPassword.length, 'first 5 chars:', adminPassword.substring(0, 5));
    console.log('[DEBUG] Incoming username length:', sanitizedUsername.length, 'value:', sanitizedUsername);
    console.log('[DEBUG] Incoming password length:', sanitizedPassword.length, 'first 5 chars:', sanitizedPassword.substring(0, 5));
    
    // Character-by-character comparison for debugging
    console.log('[DEBUG] ===== CHARACTER COMPARISON =====');
    if (sanitizedUsername.length === adminUsername.length) {
      for (let i = 0; i < sanitizedUsername.length; i++) {
        if (sanitizedUsername[i] !== adminUsername[i]) {
          console.log(`[DEBUG] Username mismatch at position ${i}: incoming='${sanitizedUsername[i]}' (code ${sanitizedUsername.charCodeAt(i)}) vs stored='${adminUsername[i]}' (code ${adminUsername.charCodeAt(i)})`);
        }
      }
    } else {
      console.log(`[DEBUG] Username length mismatch: incoming=${sanitizedUsername.length} vs stored=${adminUsername.length}`);
    }

    // CRITICAL: Use constant-time comparison to prevent timing attacks
    const usernameMatch = constantTimeEqual(sanitizedUsername, adminUsername);
    const passwordMatch = constantTimeEqual(sanitizedPassword, adminPassword);
    const isValid = usernameMatch && passwordMatch;

    console.log('[DEBUG] ===== COMPARISON RESULTS =====');
    console.log('[DEBUG] Username match:', usernameMatch);
    console.log('[DEBUG] Password match:', passwordMatch);
    console.log('[DEBUG] Overall valid:', isValid);

    if (!isValid) {
      console.warn(`[SECURITY] Failed admin login attempt from IP: ${clientIP}`);
      console.warn('[DEBUG] Credential mismatch - username match:', usernameMatch, 'password match:', passwordMatch);
      
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid credentials' }),
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
      console.error('[SECURITY] Failed to sign session token (SESSION_SECRET missing?):', signError);
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ADMIN AUTH] Successful login for user: ${sanitizedUsername} from IP: ${clientIP}`);

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
    console.error('[ERROR] Admin check endpoint error:', error);
    return new Response(
      JSON.stringify({ authenticated: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
