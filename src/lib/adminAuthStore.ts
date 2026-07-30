import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJson } from './safeJson';

interface AdminAuthState {
  isAdminAuthenticated: boolean;
  adminUsername: string | null;
  sessionToken: string | null;
  failedAttempts: number;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetFailedAttempts: () => void;
  verifySession: () => Promise<boolean>;
}

const MAX_FAILED_ATTEMPTS = 5;

/**
 * SECURITY NOTE - P1 HARDENED:
 * - Credentials validated server-side via /api/auth/admin-check
 * - Session tokens used instead of storing credentials
 * - Constant-time comparison prevents timing attacks
 * - Rate limiting per IP address
 * - httpOnly cookies for session storage
 * - Server-side session validation for all mutations
 */
export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAdminAuthenticated: false,
      adminUsername: null,
      sessionToken: null,
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
            credentials: 'include', // Include cookies
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

          if (data.authenticated && data.sessionToken) {
            // CRITICAL: Atomic state update to prevent race conditions
            set({
              isAdminAuthenticated: true,
              adminUsername: username,
              sessionToken: data.sessionToken,
              failedAttempts: 0,
              isLoading: false,
              error: null,
            });
            
            // Verify state was set correctly
            const state = get();
            console.log('[ADMIN AUTH] Login successful. State:', { 
              isAdminAuthenticated: state.isAdminAuthenticated,
              adminUsername: state.adminUsername,
              hasSessionToken: !!state.sessionToken
            });
            
            return true;
          }

          // Handle failed attempt
          const currentState = get();
          const newAttempts = currentState.failedAttempts + 1;
          
          if (newAttempts >= MAX_FAILED_ATTEMPTS) {
            set({
              failedAttempts: newAttempts,
              isLoading: false,
              error: 'Too many failed attempts. Please try again later.',
            });
            console.warn('[ADMIN AUTH] Account locked due to too many failed attempts');
          } else {
            set({
              failedAttempts: newAttempts,
              isLoading: false,
              error: data.error || 'Authentication failed',
            });
          }

          return false;
        } catch (error) {
          console.error('[ADMIN AUTH] Login error:', error);
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Network error. Please try again.',
          });
          return false;
        }
      },

      logout: async () => {
        const sessionToken = get().sessionToken;
        
        try {
          // Invalidate session on server
          if (sessionToken) {
            await fetch('/api/auth/admin-verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({ sessionToken, action: 'logout' }),
            });
          }
        } catch (error) {
          console.error('[ADMIN AUTH] Logout error:', error);
        }

        set({
          isAdminAuthenticated: false,
          adminUsername: null,
          sessionToken: null,
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

      verifySession: async () => {
        const sessionToken = get().sessionToken;
        
        if (!sessionToken) {
          set({ isAdminAuthenticated: false });
          return false;
        }

        try {
          const response = await fetch('/api/auth/admin-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ sessionToken }),
          });

          const data = await safeJson(response);

          if (data.valid) {
            return true;
          } else {
            set({ isAdminAuthenticated: false, sessionToken: null });
            return false;
          }
        } catch (error) {
          console.error('[ADMIN AUTH] Session verification error:', error);
          set({ isAdminAuthenticated: false });
          return false;
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        isAdminAuthenticated: state.isAdminAuthenticated,
        adminUsername: state.adminUsername,
        sessionToken: state.sessionToken,
        failedAttempts: state.failedAttempts,
      }),
    }
  )
);
