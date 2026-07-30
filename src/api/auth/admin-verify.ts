/**
 * Admin Session Verification Endpoint
 * 
 * Verifies that the admin session is still valid before allowing mutations
 * Called by all admin-mutating functions to ensure server-side validation
 */

import type { APIRoute } from 'astro';
import { isValidSessionToken, getClientIP } from '@/lib/auth-security';

// In-memory session store (in production, use Redis or database)
const activeSessions = new Map<string, {
  username: string;
  createdAt: number;
  lastActivity: number;
  ip: string;
}>();

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes

export function createAdminSession(username: string, sessionToken: string, ip: string): void {
  activeSessions.set(sessionToken, {
    username,
    createdAt: Date.now(),
    lastActivity: Date.now(),
    ip,
  });
  console.log(`[ADMIN SESSION] Created session for ${username}`);
}

export function validateAdminSession(sessionToken: string, ip: string): { valid: boolean; username?: string } {
  if (!isValidSessionToken(sessionToken)) {
    return { valid: false };
  }

  const session = activeSessions.get(sessionToken);
  if (!session) {
    return { valid: false };
  }

  // Check IP match (prevent session hijacking)
  if (session.ip !== ip) {
    console.warn(`[SECURITY] Session IP mismatch: expected ${session.ip}, got ${ip}`);
    activeSessions.delete(sessionToken);
    return { valid: false };
  }

  // Check timeout
  const elapsed = Date.now() - session.lastActivity;
  if (elapsed > SESSION_TIMEOUT_MS) {
    console.warn(`[SECURITY] Session timeout for ${session.username}`);
    activeSessions.delete(sessionToken);
    return { valid: false };
  }

  // Update last activity
  session.lastActivity = Date.now();
  return { valid: true, username: session.username };
}

export function invalidateAdminSession(sessionToken: string): void {
  activeSessions.delete(sessionToken);
  console.log('[ADMIN SESSION] Session invalidated');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(
        JSON.stringify({ valid: false, error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const body = await request.json();
    const { sessionToken } = body;

    if (!sessionToken) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Missing session token' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const clientIP = getClientIP(request.headers);
    const validation = validateAdminSession(sessionToken, clientIP);

    if (!validation.valid) {
      return new Response(
        JSON.stringify({ valid: false, error: 'Invalid or expired session' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ 
        valid: true, 
        username: validation.username,
        message: 'Session is valid'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('[ERROR] Admin verify endpoint error:', error);
    return new Response(
      JSON.stringify({ valid: false, error: 'Server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
