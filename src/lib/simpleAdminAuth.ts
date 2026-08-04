import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Simple hardcoded credentials for admin access
const ADMIN_USERNAME = 'Jordan310';
const ADMIN_PASSWORD = 'Iloveanna1!';

interface SimpleAdminAuthState {
  isAdminAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

/**
 * Simple admin authentication store
 * Uses hardcoded credentials for easy access
 * Session persists in localStorage
 */
export const useSimpleAdminAuth = create<SimpleAdminAuthState>()(
  persist(
    (set) => ({
      isAdminAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        // Simulate a small delay for better UX
        await new Promise(resolve => setTimeout(resolve, 300));

        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          set({
            isAdminAuthenticated: true,
            isLoading: false,
            error: null,
          });
          return true;
        }

        set({
          isLoading: false,
          error: 'Invalid username or password',
        });
        return false;
      },

      logout: () => {
        set({
          isAdminAuthenticated: false,
          error: null,
        });
      },

      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'simple-admin-auth',
    }
  )
);
