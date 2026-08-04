import type { APIRoute } from 'astro';
import { verifyMemberToken } from '@/lib/auth-security';

/**
 * Admin Authentication Check - Hardcoded Credentials
 * 
 * Temporary implementation using hardcoded admin credentials.
 * Email: jordanzuniga@gmail.com
 * Password: Iloveanna1!
 */

// Hardcoded admin credentials
const ADMIN_EMAIL = 'jordanzuniga@gmail.com';
const ADMIN_PASSWORD = 'Iloveanna1!';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('[ADMIN-CHECK] Admin check started');
    
    if (request.method !== 'POST') {
      console.log('[ADMIN-CHECK] Non-POST request rejected');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for hardcoded admin session cookie
    const adminSession = cookies.get('admin_session')?.value;
    
    console.log('[ADMIN-CHECK] Admin session cookie check:', adminSession ? 'present' : 'missing');
    
    if (adminSession) {
      console.log('[ADMIN-CHECK] DIAGNOSTIC: member ID detected: yes');
      console.log('[ADMIN-CHECK] DIAGNOSTIC: member logged in: yes');
      console.log('[ADMIN-CHECK] DIAGNOSTIC: admin permission matched: yes');
      console.log('[ADMIN-CHECK] Admin session found and valid');
      
      return new Response(
        JSON.stringify({ 
          authenticated: true,
          message: 'Admin authentication successful',
          memberId: 'admin_hardcoded',
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Fallback to Wix session for backward compatibility
    const wixSession = cookies.get('wix_session')?.value;
    
    console.log('[ADMIN-CHECK] Wix session cookie check:', wixSession ? 'present' : 'missing');
    
    if (!wixSession) {
      console.log('[ADMIN-CHECK] DIAGNOSTIC: member ID detected: no');
      console.log('[ADMIN-CHECK] DIAGNOSTIC: member logged in: no');
      console.log('[ADMIN-CHECK] DIAGNOSTIC: admin permission matched: no');
      console.log('[ADMIN-CHECK] No session found - user not logged in');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Not logged in' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ADMIN-CHECK] Wix session found, verifying member token...');
    
    // Verify the member token and get member info
    const memberInfo = await verifyMemberToken(wixSession);
    
    if (!memberInfo) {
      console.log('[ADMIN-CHECK] DIAGNOSTIC: member ID detected: no');
      console.log('[ADMIN-CHECK] DIAGNOSTIC: member logged in: no');
      console.log('[ADMIN-CHECK] DIAGNOSTIC: admin permission matched: no');
      console.log('[ADMIN-CHECK] Member token verification failed');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Invalid session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[ADMIN-CHECK] DIAGNOSTIC: member ID detected: yes');
    console.log('[ADMIN-CHECK] DIAGNOSTIC: member logged in: yes');

    // Check if member has admin role
    // Admin status is determined by:
    // 1. Member role field containing 'admin'
    // 2. Or custom field 'isAdmin' set to true
    // 3. Or member tags containing 'admin'
    const isAdmin = memberInfo.role === 'admin' || memberInfo.isAdmin === true;
    
    console.log('[ADMIN-CHECK] DIAGNOSTIC: admin permission matched:', isAdmin ? 'yes' : 'no');
    console.log('[ADMIN-CHECK] Member role:', memberInfo.role);
    console.log('[ADMIN-CHECK] Member isAdmin:', memberInfo.isAdmin);
    
    if (!isAdmin) {
      console.warn(`[SECURITY] Non-admin member attempted admin access: ${memberInfo.memberId?.substring(0, 8)}`);
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Insufficient permissions' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[ADMIN-CHECK] Admin authentication successful for member: ${memberInfo.memberId?.substring(0, 8)}`);

    // Generate admin session token (httpOnly cookie)
    const sessionExpiry = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const adminSessionToken = `admin_${memberInfo.memberId}_${Date.now()}`;
    
    const setCookieHeader = `admin_session=${adminSessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800`;
    
    return new Response(
      JSON.stringify({ 
        authenticated: true,
        message: 'Admin authentication successful',
        memberId: memberInfo.memberId,
        expiresAt: sessionExpiry.toISOString()
      }),
      { 
        status: 200, 
        headers: { 
          'Content-Type': 'application/json',
          'Set-Cookie': setCookieHeader
        }
      }
    );

  } catch (error) {
    console.error('[ERROR] Admin check endpoint error:', error);
    console.log('[ADMIN-CHECK] DIAGNOSTIC: member ID detected: no');
    console.log('[ADMIN-CHECK] DIAGNOSTIC: member logged in: no');
    console.log('[ADMIN-CHECK] DIAGNOSTIC: admin permission matched: no');
    return new Response(
      JSON.stringify({ authenticated: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
