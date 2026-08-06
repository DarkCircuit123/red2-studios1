/**
 * Session Diagnostics Endpoint
 * 
 * Provides detailed information about the current admin session state.
 * Useful for debugging authentication issues.
 * 
 * Returns:
 * - Cookie presence and metadata
 * - Token validity and expiry
 * - Session age
 * - Environment configuration status
 */

import type { APIRoute } from 'astro';
import { verifyAdminToken, readSecret, getClientIP } from '@/lib/auth-security';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const clientIP = getClientIP(request.headers);
    const diagnostics: Record<string, any> = {
      timestamp: new Date().toISOString(),
      clientIP,
      cookies: {
        admin_session: {
          present: !!cookies.get('admin_session'),
          value: cookies.get('admin_session')?.value ? '(present, length: ' + cookies.get('admin_session')!.value!.length + ')' : '(missing)',
        },
      },
      environment: {
        SESSION_SECRET_configured: !!(await readSecret('SESSION_SECRET')),
        ADMIN_USERNAME_configured: !!(await readSecret('ADMIN_USERNAME')),
        ADMIN_PASSWORD_configured: !!(await readSecret('ADMIN_PASSWORD')),
      },
      token: {
        valid: false,
        username: null,
        expiresIn: null,
        error: null,
      },
    };

    const sessionToken = cookies.get('admin_session')?.value;
    
    if (sessionToken) {
      try {
        const validation = await verifyAdminToken(sessionToken);
        diagnostics.token.valid = validation.valid;
        diagnostics.token.username = validation.username || null;
        
        if (!validation.valid) {
          diagnostics.token.error = 'Token verification failed - may be expired, tampered, or signed with wrong secret';
        }
      } catch (error) {
        diagnostics.token.error = error instanceof Error ? error.message : 'Unknown error';
      }
    } else {
      diagnostics.token.error = 'No session token in cookie';
    }

    return new Response(
      JSON.stringify(diagnostics, null, 2),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[SESSION-DIAGNOSTICS] Error:', error);
    return new Response(
      JSON.stringify({
        error: 'Diagnostics failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
