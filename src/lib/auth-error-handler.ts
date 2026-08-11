/**
 * Authentication Error Handler
 * Handles 401/403 errors from authentication endpoints gracefully
 * 
 * CRITICAL: This handler is for LOGGING ONLY - it does NOT suppress errors
 * or prevent proper error handling. It simply tracks auth errors for debugging.
 * 
 * Expected behavior:
 * - Anonymous users: 403 from getCurrentMember() is EXPECTED and NORMAL
 * - Admin checks: 401 from admin-check is EXPECTED for non-admin users
 * - These errors are handled gracefully in the service layer, not here
 */

export interface AuthErrorContext {
  endpoint: string;
  status: number;
  error?: string;
  timestamp: number;
}

class AuthErrorHandler {
  private errors: Map<string, AuthErrorContext> = new Map();
  private maxErrors = 10;

  /**
   * Log an authentication error for debugging
   */
  logError(endpoint: string, status: number, error?: string) {
    const context: AuthErrorContext = {
      endpoint,
      status,
      error,
      timestamp: Date.now()
    };

    const key = `${endpoint}-${status}`;
    this.errors.set(key, context);

    // Keep only recent errors
    if (this.errors.size > this.maxErrors) {
      const oldestKey = Array.from(this.errors.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)[0][0];
      this.errors.delete(oldestKey);
    }
  }

  /**
   * Check if an endpoint is experiencing auth issues
   */
  hasAuthIssues(endpoint: string): boolean {
    return Array.from(this.errors.values()).some(
      err => err.endpoint === endpoint && (err.status === 401 || err.status === 403)
    );
  }

  /**
   * Get all logged errors
   */
  getErrors(): AuthErrorContext[] {
    return Array.from(this.errors.values());
  }

  /**
   * Clear errors
   */
  clearErrors() {
    this.errors.clear();
  }
}

export const authErrorHandler = new AuthErrorHandler();

/**
 * Initialize auth error handling
 * ONLY logs errors - does NOT suppress them
 */
export function initAuthErrorHandling() {
  if (typeof window === 'undefined') return;

  // Just initialize the handler - no fetch interception or console suppression
  // Auth errors are handled properly in the service layer
  console.debug('[Auth Error Handler] Initialized (logging only)');
}
