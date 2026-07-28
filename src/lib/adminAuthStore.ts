import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminAuthState {
  isAdminAuthenticated: boolean;
  adminUsername: string | null;
  failedAttempts: number;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  resetFailedAttempts: () => void;
}

// Hardcoded credentials
const ADMIN_USERNAME = 'Jordan310';
const ADMIN_PASSWORD = 'Iloveanna1!';
const MAX_FAILED_ATTEMPTS = 3;

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAdminAuthenticated: false,
      adminUsername: null,
      failedAttempts: 0,
      login: (username: string, password: string) => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          set({
            isAdminAuthenticated: true,
            adminUsername: username,
            failedAttempts: 0,
          });
          return true;
        }
        
        // Increment failed attempts
        set((state) => ({
          failedAttempts: state.failedAttempts + 1,
        }));
        
        // Check if max attempts reached
        const state = useAdminAuth.getState();
        if (state.failedAttempts >= MAX_FAILED_ATTEMPTS) {
          // Redirect to CIA website
          window.location.href = 'https://www.cia.gov';
        }
        
        return false;
      },
      logout: () => {
        set({
          isAdminAuthenticated: false,
          adminUsername: null,
        });
      },
      resetFailedAttempts: () => {
        set({
          failedAttempts: 0,
        });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        isAdminAuthenticated: state.isAdminAuthenticated,
        adminUsername: state.adminUsername,
        failedAttempts: state.failedAttempts,
      }),
    }
  )
);
