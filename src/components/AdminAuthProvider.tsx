import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useMember } from '@/integrations';

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
  const { member, isAuthenticated: isMemberAuthenticated, actions: memberActions } = useMember();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminUsername, setAdminUsername] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync with Wix Member authentication status
  useEffect(() => {
    if (isMemberAuthenticated && member) {
      setIsAuthenticated(true);
      setAdminUsername(member.profile?.nickname || member.loginEmail || 'Admin');
    } else {
      setIsAuthenticated(false);
      setAdminUsername(null);
    }
  }, [isMemberAuthenticated, member]);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      // Redirect to Wix login
      await memberActions.login();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Login failed';
      setError(message);
      setIsAuthenticated(false);
      setAdminUsername(null);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [memberActions]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await memberActions.logout();
    } catch (err) {
      console.error('[AdminAuthProvider] Logout error:', err);
    } finally {
      setIsAuthenticated(false);
      setAdminUsername(null);
      setError(null);
      setIsLoading(false);
    }
  }, [memberActions]);

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
