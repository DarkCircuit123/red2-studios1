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

  useEffect(() => {
    const checkSession = async () => {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 3000);
      try {
        const response = await fetch('/api/auth/admin-check', { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' }, signal: controller.signal });
        const data = await response.json().catch(() => null);
        if (response.ok && data?.authenticated === true) {
          setIsAuthenticated(true);
          setAdminUsername(typeof data.username === 'string' ? data.username : 'Admin');
        } else {
          setIsAuthenticated(false);
          setAdminUsername(null);
        }
      } catch (error) {
        console.warn('[AdminAuthProvider] Session check failed:', error instanceof Error ? error.message : String(error));
        setIsAuthenticated(false);
        setAdminUsername(null);
      } finally {
        window.clearTimeout(timeoutId);
        setIsLoading(false);
      }
    };
    void checkSession();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ username, password }), signal: controller.signal,
      });
      const data = await response.json().catch(() => null);
      if (!response.ok || data?.success !== true) throw new Error(typeof data?.message === 'string' ? data.message : 'Login failed');
      setIsAuthenticated(true);
      setAdminUsername(typeof data.username === 'string' ? data.username : username);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      setError(message);
      setIsAuthenticated(false);
      setAdminUsername(null);
      throw error;
    } finally {
      window.clearTimeout(timeoutId);
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 5000);
    try {
      await fetch('/api/auth/admin-logout', { method: 'POST', credentials: 'include', headers: { Accept: 'application/json' }, signal: controller.signal });
    } catch (error) {
      console.warn('[AdminAuthProvider] Logout failed:', error instanceof Error ? error.message : String(error));
    } finally {
      window.clearTimeout(timeoutId);
      setIsAuthenticated(false);
      setAdminUsername(null);
      setError(null);
      setIsLoading(false);
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  return <AdminAuthContext.Provider value={{ isAuthenticated, adminUsername, isLoading, error, login, logout, clearError }}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) throw new Error('useAdminAuth must be used within AdminAuthProvider');
  return context;
}
