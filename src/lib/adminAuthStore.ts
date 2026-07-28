import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AdminAuthState {
  isAdminAuthenticated: boolean;
  adminUsername: string | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

// Hardcoded credentials
const ADMIN_USERNAME = 'Jordan310';
const ADMIN_PASSWORD = 'Iloveanna1!';

export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set) => ({
      isAdminAuthenticated: false,
      adminUsername: null,
      login: (username: string, password: string) => {
        if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
          set({
            isAdminAuthenticated: true,
            adminUsername: username,
          });
          return true;
        }
        return false;
      },
      logout: () => {
        set({
          isAdminAuthenticated: false,
          adminUsername: null,
        });
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        isAdminAuthenticated: state.isAdminAuthenticated,
        adminUsername: state.adminUsername,
      }),
    }
  )
);
