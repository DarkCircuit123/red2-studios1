/**
 * Admin Mutation Verification Middleware
 * 
 * All admin-mutating functions MUST call this endpoint first
 * to verify the session server-side before performing any mutations
 */

import type { APIRoute } from 'astro';
import { validateAdminSession, getClientIP } from '@/lib/auth-security';

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ authorized: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { sessionToken, action } = body;

    if (!sessionToken || !action) {
      return new Response(
        JSON.stringify({ authorized: false, error: 'Missing required fields' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientIP = getClientIP(request.headers);
    
    // Validate session
    const validation = validateAdminSession(sessionToken, clientIP);

    if (!validation.valid) {
      console.warn(`[SECURITY] Unauthorized mutation attempt from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ authorized: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Log authorized mutation
    console.log(`[ADMIN MUTATION] Authorized action '${action}' by ${validation.username} from IP: ${clientIP}`);

    return new Response(
      JSON.stringify({ 
        authorized: true, 
        username: validation.username,
        message: 'Mutation authorized'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERROR] Admin mutation verify endpoint error:', error);
    return new Response(
      JSON.stringify({ authorized: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
