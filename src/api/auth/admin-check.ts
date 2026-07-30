import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { constantTimeEqual, checkRateLimit, recordFailedAttempt, getClientIP, signAdminToken, readSecret } from '@/lib/auth-security';

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
    
    // Check rate limit
    const rateLimit = checkRateLimit(clientIP);
    if (!rateLimit.allowed) {
      console.warn(`[SECURITY] Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          authenticated: false, 
          error: 'Too many attempts. Please try again later.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        }),
        { 
          status: 429, 
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((rateLimit.resetTime - Date.now()) / 1000).toString()
          }
        }
      );
    }

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
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid credentials format' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize inputs
    const sanitizedUsername = username.trim().substring(0, 100);
    const sanitizedPassword = password.substring(0, 500);

    // Get credentials from environment (NEVER from CMS for admin auth).
    //
    // The 'Claude' / 'Claude2' fallbacks are load-bearing, do not remove
    // them: production and the Vibe editor/preview runtime do NOT expose
    // the same environment. Production resolves ADMIN_USERNAME /
    // ADMIN_PASSWORD directly (login works live), but the preview runtime
    // at *.remote-machine.wix-code.com only sees the Secrets Manager
    // entries, which on this site are literally named 'Claude' and
    // 'Claude2' and hold values in "KEY = value" form. Checking the
    // correct names first and falling back keeps BOTH environments
    // working, and costs nothing once the secrets are renamed properly.
    const adminUsername = readSecret('ADMIN_USERNAME', 'Claude');
    const adminPassword = readSecret('ADMIN_PASSWORD', 'Claude2');

    // Verify credentials exist
    if (!adminUsername || !adminPassword) {
      console.error('[SECURITY] Admin credentials not configured in Secrets Manager');
      recordFailedAttempt(clientIP);
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Server configuration error' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // CRITICAL: Use constant-time comparison to prevent timing attacks
    const usernameMatch = constantTimeEqual(sanitizedUsername, adminUsername);
    const passwordMatch = constantTimeEqual(sanitizedPassword, adminPassword);
    const isValid = usernameMatch && passwordMatch;

    if (!isValid) {
      recordFailedAttempt(clientIP);
      console.warn(`[SECURITY] Failed admin login attempt from IP: ${clientIP}`);
      
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
