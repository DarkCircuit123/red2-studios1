import { create } from 'zustand';

interface AdminAuthState {
  isAuthenticated: boolean;
  adminUsername: string | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  clearError: () => void;
}

export const useAdminAuth = create<AdminAuthState>((set) => ({
  isAuthenticated: false,
  adminUsername: null,
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || 'Login failed');
      }

      const data = await response.json();
      set({
        isAuthenticated: true,
        adminUsername: data.username,
        error: null,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      set({ error: message, isAuthenticated: false, adminUsername: null });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await fetch('/api/auth/admin-logout', {
        method: 'POST',
        credentials: 'include',
      });
    } finally {
      set({
        isAuthenticated: false,
        adminUsername: null,
        isLoading: false,
        error: null,
      });
    }
  },

  checkSession: async () => {
    set({ isLoading: true });
    try {
      const response = await fetch('/api/auth/admin-check', {
        method: 'GET',
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        set({
          isAuthenticated: true,
          adminUsername: data.username,
        });
      } else {
        set({
          isAuthenticated: false,
          adminUsername: null,
        });
      }
    } catch (error) {
      set({
        isAuthenticated: false,
        adminUsername: null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
