import type { APIRoute } from 'astro';
import { verifyMemberToken } from '@/lib/auth-security';

/**
 * Admin Authentication Check - Wix Members Based
 * 
 * Replaces custom username/password authentication with Wix Members.
 * Verifies that the logged-in member has admin role/permissions.
 * 
 * Security:
 * - Uses Wix Members authentication (OAuth-backed)
 * - Admin status verified via member role/custom field
 * - Session token from Wix Members API
 * - No custom credentials needed
 */

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    console.log('[ADMIN-CHECK] Wix Members-based admin check started');
    
    if (request.method !== 'POST') {
      console.log('[ADMIN-CHECK] Non-POST request rejected');
      return new Response(
        JSON.stringify({ authenticated: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the Wix member session from cookies
    const wixSession = cookies.get('wix_session')?.value;
    
    console.log('[ADMIN-CHECK] Wix session cookie check:', wixSession ? 'present' : 'missing');
    
    if (!wixSession) {
      console.log('[ADMIN-CHECK] DIAGNOSTIC: member ID detected: no');
      console.log('[ADMIN-CHECK] DIAGNOSTIC: member logged in: no');
      console.log('[ADMIN-CHECK] DIAGNOSTIC: admin permission matched: no');
      console.log('[ADMIN-CHECK] No Wix session found - user not logged in');
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
    const isAdmin = memberInfo.role === 'admin' || memberInfo.isAdmin === true;
    
    console.log('[ADMIN-CHECK] DIAGNOSTIC: admin permission matched:', isAdmin ? 'yes' : 'no');
    
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
