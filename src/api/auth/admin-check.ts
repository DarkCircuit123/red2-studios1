import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

/**
 * Secure Admin Authentication Check
 * 
 * This endpoint validates admin credentials server-side.
 * Credentials can be stored in CMS (adminCredentials collection) or environment variables.
 * NEVER expose credentials in frontend code.
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

    // Try to get credentials from CMS first
    let adminUsername = '';
    let adminPassword = '';
    
    try {
      const credentialsResult = await BaseCrudService.getAll('admincredentials', {}, { limit: 1 });
      if (credentialsResult?.items && credentialsResult.items.length > 0) {
        const creds = credentialsResult.items[0] as any;
        adminUsername = creds.username || '';
        adminPassword = creds.password || '';
        console.log('[ADMIN AUTH] Loaded credentials from CMS');
      }
    } catch (cmsError) {
      console.warn('[ADMIN AUTH] CMS credentials not available, falling back to env vars');
    }

    // Fallback to environment variables if CMS credentials not found
    if (!adminUsername || !adminPassword) {
      adminUsername = import.meta.env.ADMIN_USERNAME || 'admin';
      adminPassword = import.meta.env.ADMIN_PASSWORD || 'Iloveanna1!';
      console.log('[ADMIN AUTH] Using environment variable credentials');
    }

    // Validate credentials
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
    console.log(`[ADMIN AUTH] Successful login for user: ${username}`);
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
