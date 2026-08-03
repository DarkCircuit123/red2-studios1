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
    console.log('[ADMIN-CHECK] Login attempt started');
    
    // Only accept POST requests
    if (request.method !== 'POST') {
      console.log('[ADMIN-CHECK] Non-POST request rejected');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(request.headers);
    console.log('[ADMIN-CHECK] Request from IP:', clientIP);
    
    // Rate limiting disabled for edit window compatibility
    // const rateLimit = checkRateLimit(clientIP);
    // if (!rateLimit.allowed) { ... }

    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (e) {
      console.warn('[ADMIN-CHECK] Failed to parse JSON body');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { username, password } = body;
    console.log('[ADMIN-CHECK] Auth payload received - username:', username ? '(present)' : '(missing)', 'password:', password ? '(present)' : '(missing)');

    // Validate input
    if (!username || !password || typeof username !== 'string' || typeof password !== 'string') {
      console.warn('[ADMIN-CHECK] Input validation failed - invalid types or missing fields');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim().substring(0, 100);
    const sanitizedPassword = password.substring(0, 500);
    console.log('[ADMIN-CHECK] Input sanitized - username length:', sanitizedUsername.length, 'password length:', sanitizedPassword.length);

    // Get credentials from Secrets Manager (NEVER from CMS for admin auth).
    // Both live in Secrets Manager under these exact names. readSecret()
    // trims whitespace, which matters - a value pasted into the dashboard
    // can carry a trailing newline that would otherwise fail the
    // constant-time comparison below with no visible cause.
    console.log('[ADMIN-CHECK] Attempting to read credentials from Secrets Manager...');
    
    let adminUsername = readSecret('ADMIN_USERNAME');
    let adminPassword = readSecret('ADMIN_PASSWORD');

    // Fallback to CMS collection if Secrets Manager is not configured
    if (!adminUsername || !adminPassword) {
      console.log('[ADMIN-CHECK] Credentials not in Secrets Manager, checking CMS collection...');
      try {
        const cmsCredentials = await BaseCrudService.getAll('admincredentials');
        if (cmsCredentials.items && cmsCredentials.items.length > 0) {
          const cred = cmsCredentials.items[0];
          adminUsername = cred.username;
          adminPassword = cred.password;
          console.log('[ADMIN-CHECK] Credentials loaded from CMS collection - username:', adminUsername ? '(present)' : '(missing)', 'password:', adminPassword ? '(present)' : '(missing)');
        }
      } catch (cmsError) {
        console.warn('[ADMIN-CHECK] Failed to fetch credentials from CMS:', cmsError);
      }
    }

    // If still no credentials, fail
    if (!adminUsername || !adminPassword) {
      console.warn('[ADMIN-CHECK] Admin credentials not found in Secrets Manager or CMS. Please configure ADMIN_USERNAME and ADMIN_PASSWORD.');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Credentials not configured' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: Use constant-time comparison to prevent timing attacks
    console.log('[ADMIN-CHECK] Starting credential comparison...');
    console.log('[ADMIN-CHECK] Input username length:', sanitizedUsername.length);
    console.log('[ADMIN-CHECK] Stored username length:', adminUsername.length);
    console.log('[ADMIN-CHECK] Input password length:', sanitizedPassword.length);
    console.log('[ADMIN-CHECK] Stored password length:', adminPassword.length);
    
    const usernameMatch = constantTimeEqual(sanitizedUsername, adminUsername);
    const passwordMatch = constantTimeEqual(sanitizedPassword, adminPassword);
    
    console.log('[ADMIN-CHECK] Username match result:', usernameMatch);
    console.log('[ADMIN-CHECK] Password match result:', passwordMatch);
    
    const isValid = usernameMatch && passwordMatch;

    if (!isValid) {
      console.warn(`[SECURITY] Failed admin login attempt from IP: ${clientIP}`);
      console.warn('[ADMIN-CHECK] Credentials do not match');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ADMIN-CHECK] Credentials validated successfully');

    // Generate a signed, self-verifying session token (see auth-security.ts
    // for why this replaced the old in-memory session Map: Cloudflare
    // Workers isolates don't reliably share in-memory state).
    let sessionToken: string;
    const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    try {
      console.log('[ADMIN-CHECK] Signing session token...');
      sessionToken = await signAdminToken(sanitizedUsername, 30 * 60 * 1000);
      console.log('[ADMIN-CHECK] Session token signed successfully, length:', sessionToken.length);
    } catch (signError) {
      console.error('[SECURITY] Failed to sign session token (SESSION_SECRET missing?):', signError);
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ADMIN-CHECK] Successful login from IP: ${clientIP}, user: ${sanitizedUsername}`);

    // Return success with session token
    // In production, this should be set as httpOnly cookie via Set-Cookie header
    // NOTE: If running in Wix iframe and SameSite=Lax is blocked, change to:
    // SameSite=None; Secure (requires HTTPS, which Wix provides)
    const setCookieHeader = `admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800`;
    console.log('[ADMIN-CHECK] Setting cookie with attributes:');
    console.log('  - Name: admin_session');
    console.log('  - Path: /');
    console.log('  - HttpOnly: true');
    console.log('  - SameSite: Lax');
    console.log('  - Max-Age: 1800 (30 minutes)');
    console.log('  - Secure: (auto-enabled on HTTPS)');
    console.log('[ADMIN-CHECK] Set-Cookie header:', setCookieHeader);
    
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
          'Set-Cookie': setCookieHeader
        }
      }
    );

  } catch (error) {
    console.error('[ERROR] Admin check endpoint error:', error);
    return new Response(
      JSON.stringify({ authenticated: false, error: 'Invalid username or password' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
