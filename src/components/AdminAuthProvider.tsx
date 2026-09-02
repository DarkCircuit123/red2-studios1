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

  // Check session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        console.log('[AdminAuthProvider] Starting session check...');
        // Add timeout to prevent hanging if endpoint is unreachable
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
          console.log('[AdminAuthProvider] Session check timeout');
          controller.abort();
        }, 3000); // 3 second timeout (reduced from 5)
        
        const response = await fetch('/api/auth/admin-verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ action: 'verify' }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        console.log('[AdminAuthProvider] Session check response:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('[AdminAuthProvider] Session check data:', data);
          if (data.valid) {
            console.log('[AdminAuthProvider] Session is valid, setting authenticated');
            setIsAuthenticated(true);
            setAdminUsername(data.username || 'Admin');
          } else {
            console.log('[AdminAuthProvider] Session is not valid');
            setIsAuthenticated(false);
            setAdminUsername(null);
          }
        } else {
          console.log('[AdminAuthProvider] Session check failed with status:', response.status);
          setIsAuthenticated(false);
          setAdminUsername(null);
        }
      } catch (err) {
        // Handle network errors gracefully - don't crash the app
        if (err instanceof Error && err.name === 'AbortError') {
          console.warn('[AdminAuthProvider] Session check timeout');
        } else {
          console.warn('[AdminAuthProvider] Session check error:', err instanceof Error ? err.message : String(err));
        }
        // Fail safely - treat as unauthenticated
        setIsAuthenticated(false);
        setAdminUsername(null);
      } finally {
        console.log('[AdminAuthProvider] Session check complete, setting isLoading to false');
        setIsLoading(false);
      }
    };

    checkSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      console.log('[AdminAuthProvider] Attempting login for:', username);
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('[AdminAuthProvider] Login response status:', response.status);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        console.error('[AdminAuthProvider] Login failed:', data);
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      console.log('[AdminAuthProvider] Login successful, setting authenticated state');
      
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
      console.log('[AdminAuthProvider] Authentication state updated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      console.error('[AdminAuthProvider] Login error:', message);
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ action: 'logout' }),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
    } catch (err) {
      console.warn('[AdminAuthProvider] Logout error:', err instanceof Error ? err.message : String(err));
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
