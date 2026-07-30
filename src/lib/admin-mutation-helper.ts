/**
 * Admin Mutation Helper
 * 
 * Wrapper for all admin-mutating functions
 * Ensures server-side session verification before mutations
 */

import { safeJson } from './safeJson';

interface MutationOptions {
  sessionToken: string;
  action: string;
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE';
  body?: Record<string, any>;
}

/**
 * Verify admin session before mutation
 */
async function verifyMutationAuth(sessionToken: string, action: string): Promise<boolean> {
  try {
    const response = await fetch('/api/auth/admin-mutation-verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ sessionToken, action }),
    });

    const data = await safeJson(response);
    return data.authorized === true;
  } catch (error) {
    console.error('[ADMIN MUTATION] Verification error:', error);
    return false;
  }
}

/**
 * Execute admin mutation with server-side verification
 */
export async function executeAdminMutation<T>(options: MutationOptions): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    // Verify session first
    const authorized = await verifyMutationAuth(options.sessionToken, options.action);
    
    if (!authorized) {
      console.error(`[ADMIN MUTATION] Unauthorized mutation attempt: ${options.action}`);
      return {
        success: false,
        error: 'Unauthorized. Session may have expired.',
      };
    }

    // Perform mutation
    const response = await fetch(options.endpoint, {
      method: options.method,
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    const data = await safeJson(response);

    if (!response.ok) {
      return {
        success: false,
        error: data.error || 'Mutation failed',
      };
    }

    console.log(`[ADMIN MUTATION] Success: ${options.action}`);
    return {
      success: true,
      data: data as T,
    };
  } catch (error) {
    console.error(`[ADMIN MUTATION] Error executing ${options.action}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Example usage in admin functions:
 * 
 * const { sessionToken } = useAdminAuth();
 * 
 * const result = await executeAdminMutation({
 *   sessionToken,
 *   action: 'update-booking',
 *   endpoint: '/api/booking-availability/update',
 *   method: 'PUT',
 *   body: { id: '123', isAvailable: true }
 * });
 * 
 * if (result.success) {
 *   console.log('Mutation successful:', result.data);
 * } else {
 *   console.error('Mutation failed:', result.error);
 * }
 */
