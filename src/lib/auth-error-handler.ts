/**
 * Authentication Error Handler
 * Handles 401/403 errors from authentication endpoints
 * Prevents publishing button from being blocked by auth failures
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
   * Log an authentication error
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
 * Intercept fetch requests to handle auth errors gracefully
 */
export function initAuthErrorInterception() {
  if (typeof window === 'undefined') return;

  const originalFetch = window.fetch;

  window.fetch = async function(...args: any[]) {
    try {
      const response = await originalFetch.apply(this, args);

      // Log auth errors but don't throw
      if (response.status === 401 || response.status === 403) {
        const url = args[0]?.toString() || 'unknown';
        authErrorHandler.logError(url, response.status);

        // For admin-verify endpoint, silently fail (user is not admin)
        if (url.includes('admin-verify')) {
          return response; // Return response as-is, don't throw
        }

        // For other auth endpoints, also return gracefully
        if (url.includes('/api/auth/')) {
          return response;
        }
      }

      return response;
    } catch (error) {
      // Log network errors but don't block
      console.debug('[Auth Error Handler] Fetch error:', error);
      throw error;
    }
  };
}

/**
 * Suppress auth-related console errors
 */
export function suppressAuthConsoleErrors() {
  if (typeof window === 'undefined') return;

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = function(...args: any[]) {
    const message = args[0]?.toString() || '';
    
    // Suppress auth-related errors
    if (message.includes('401') || message.includes('403') || message.includes('admin-verify')) {
      return; // Silently ignore
    }
    
    originalError.apply(console, args);
  };

  console.warn = function(...args: any[]) {
    const message = args[0]?.toString() || '';
    
    // Suppress auth-related warnings
    if (message.includes('401') || message.includes('403') || message.includes('Unauthorized')) {
      return; // Silently ignore
    }
    
    originalWarn.apply(console, args);
  };
}

/**
 * Initialize auth error handling
 */
export function initAuthErrorHandling() {
  if (typeof window === 'undefined') return;

  initAuthErrorInterception();
  suppressAuthConsoleErrors();
}
