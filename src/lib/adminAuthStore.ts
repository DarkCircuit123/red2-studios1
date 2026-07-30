import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJson } from './safeJson';

interface AdminAuthState {
  isAdminAuthenticated: boolean;
  adminUsername: string | null;
  failedAttempts: number;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  resetFailedAttempts: () => void;
}

const MAX_FAILED_ATTEMPTS = 3;

/**
 * SECURITY NOTE: Credentials are now validated server-side via /api/auth/admin-check
 * Frontend never stores or compares passwords directly.
 * All authentication logic moved to backend for security.
 */
export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAdminAuthenticated: false,
      adminUsername: null,
      failedAttempts: 0,
      isLoading: false,
      error: null,
      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });
        
        try {
          // Call secure backend endpoint
          const response = await fetch('/api/auth/admin-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
          });

          let data;
           try {
             data = await safeJson(response);
           } catch (parseError) {
             console.error('[ADMIN AUTH] Response parse error:', parseError);
             set({ 
               isLoading: false, 
               error: parseError instanceof Error ? parseError.message : 'Invalid server response'
             });
             return false;
           }

          if (data.authenticated) {
            // CRITICAL: Ensure state is fully updated before returning
            set({
              isAdminAuthenticated: true,
              adminUsername: username,
              failedAttempts: 0,
              isLoading: false,
              error: null,
            });
            
            // Verify state was set
            const state = get();
            console.log('[ADMIN AUTH] Login successful. State:', { 
              isAdminAuthenticated: state.isAdminAuthenticated,
              adminUsername: state.adminUsername 
            });
            
            return true;
          }

          // Handle failed attempt
          set((state) => {
            const newAttempts = state.failedAttempts + 1;
            
            // Check if max attempts reached
            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
              // Security: Redirect to safe page after max attempts
              setTimeout(() => {
                window.location.href = '/';
              }, 1000);
            }

            return {
              failedAttempts: newAttempts,
              isLoading: false,
              error: data.error || 'Authentication failed',
            };
          });

          return false;
        } catch (error) {
          console.error('[ADMIN AUTH] Login error:', error);
          set({
            isLoading: false,
            error: 'Network error. Please try again.',
          });
          return false;
        }
      },
      logout: () => {
        set({
          isAdminAuthenticated: false,
          adminUsername: null,
          error: null,
        });
        console.log('[ADMIN AUTH] Logout successful');
      },
      resetFailedAttempts: () => {
        set({
          failedAttempts: 0,
          error: null,
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
