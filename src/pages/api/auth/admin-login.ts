import type { APIRoute } from 'astro';
import { signAdminToken, readSecret } from '@/lib/auth-security';

// Hardcoded admin credentials
const ADMIN_USERNAME = 'Jordan310';
const ADMIN_PASSWORD = 'Iloveanna1!';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json().catch(() => ({}));
    const { username, password } = body;

    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, message: 'Username and password required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate credentials - exact match required
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      try {
        // Pre-check SESSION_SECRET before attempting token signing
        console.log('[ADMIN LOGIN] Pre-checking SESSION_SECRET configuration...');
        const sessionSecret = await readSecret('SESSION_SECRET');
        
        if (!sessionSecret) {
          console.error('[ADMIN LOGIN] CRITICAL: SESSION_SECRET is not configured in Wix Secrets Manager');
          return new Response(
            JSON.stringify({ 
              success: false, 
              message: 'Server configuration error: SESSION_SECRET not configured',
              error: 'SESSION_SECRET_MISSING',
              details: 'The SESSION_SECRET environment variable must be configured in Wix Secrets Manager for admin authentication to work.'
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }

        console.log('[ADMIN LOGIN] SESSION_SECRET verified, creating session token...');
        
        // Create signed session token
        const sessionToken = await signAdminToken(username, 86400 * 7 * 1000);

        // Set secure httpOnly cookie with SameSite=None for cross-site iframe compatibility
        cookies.set('admin_session', sessionToken, {
          path: '/',
          httpOnly: true,
          secure: true, // Always secure for SameSite=None
          sameSite: 'none',
          partitioned: true, // Partitioned cookie for cross-site iframe
          maxAge: 86400 * 7, // 7 days
        });

        console.log('[ADMIN LOGIN] Admin login successful for user:', username);

        return new Response(
          JSON.stringify({
            success: true,
            admin: true,
            username: ADMIN_USERNAME,
            token: sessionToken,
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } }
        );
      } catch (tokenError) {
        const errorMessage = tokenError instanceof Error ? tokenError.message : 'Unknown error';
        console.error('[ADMIN LOGIN] Token signing failed:', errorMessage);
        
        // Provide more specific error information
        const isSecretError = errorMessage.includes('SESSION_SECRET');
        
        return new Response(
          JSON.stringify({ 
            success: false, 
            message: isSecretError 
              ? 'Server configuration error: SESSION_SECRET not configured' 
              : 'Failed to create session token',
            error: isSecretError ? 'SESSION_SECRET_MISSING' : 'TOKEN_SIGNING_FAILED',
            details: isSecretError 
              ? 'The SESSION_SECRET environment variable must be configured in Wix Secrets Manager'
              : errorMessage
          }),
          { status: 500, headers: { 'Content-Type': 'application/json' } }
        );
      }
    }

    return new Response(
      JSON.stringify({ success: false, message: 'Invalid credentials' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[ADMIN LOGIN] Error:', error);
    return new Response(
      JSON.stringify({ success: false, message: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
