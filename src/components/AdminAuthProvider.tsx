import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface AdminAuthContextType {
  isAuthenticated: boolean;
  adminUsername: string | null;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize loading state to false on mount
  // DO NOT check admin session on mount - it causes ERR_NETWORK errors
  // because /api/auth/admin-verify tries to verify tokens on every page load
  // even when there's no admin session. Only check admin session when explicitly needed.
  useEffect(() => {
    setIsLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        
        // Handle specific error types
        if (data.error === 'SESSION_SECRET_MISSING') {
          throw new Error(
            'Server configuration error: SESSION_SECRET is not configured in Wix Secrets Manager. ' +
            'Please contact the administrator to configure this secret.'
          );
        }
        
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      
      // Store the token from response for header-based fallback
      if (data.token) {
        try {
          if (typeof sessionStorage !== 'undefined') {
            sessionStorage.setItem('admin_session_token', data.token);
          }
        } catch (e) {
          // sessionStorage may be blocked
        }
        // Also store in memory
        (window as any).__adminToken = data.token;
      }
      
      setIsAuthenticated(true);
      setAdminUsername(data.username);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setIsAuthenticated(false);
      setAdminUsername(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' }),
      });
    } catch (err) {
      console.error('[AdminAuthProvider] Logout error:', err);
    } finally {
      // Clear stored token
      try {
        if (typeof sessionStorage !== 'undefined') {
          sessionStorage.removeItem('admin_session_token');
        }
      } catch (e) {
        // sessionStorage may be blocked
      }
      delete (window as any).__adminToken;
      
      setIsAuthenticated(false);
      setAdminUsername(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        adminUsername,
        isLoading,
        error,
        login,
        logout,
        clearError,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within AdminAuthProvider');
  }
  return context;
}
