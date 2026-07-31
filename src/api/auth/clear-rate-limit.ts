/**
 * Emergency Rate Limit Clear Endpoint
 * 
 * This endpoint allows clearing the rate limit for a specific IP address.
 * It requires a valid admin session token to prevent abuse.
 * 
 * TEMPORARY: This is for debugging purposes only. Remove in production.
 */

import type { APIRoute } from 'astro';
import { resetRateLimit, getClientIP, verifyAdminToken } from '@/lib/auth-security';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ success: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get the client IP to clear
    const clientIP = getClientIP(request.headers);
    
    // Clear the rate limit for this IP
    resetRateLimit(clientIP);
    
    console.log(`[DEBUG] Rate limit cleared for IP: ${clientIP}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Rate limit cleared for IP: ${clientIP}`,
        timestamp: new Date().toISOString()
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERROR] Clear rate limit endpoint error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
