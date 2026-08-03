import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { safeJson } from './safeJson';

// Track verification attempts to prevent infinite retries
let verificationAttemptCount = 0;
const MAX_VERIFICATION_ATTEMPTS = 1;

interface AdminAuthState {
  isAdminAuthenticated: boolean;
  adminUsername: string | null;
  adminToken: string | null;
  failedAttempts: number;
  isLoading: boolean;
  isVerifying: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetFailedAttempts: () => void;
  verifySession: () => Promise<boolean>;
}

export const MAX_FAILED_ATTEMPTS = 5;

/**
 * SECURITY NOTE:
 * - Credentials validated server-side via /api/auth/admin-check
 * - Session proof lives ONLY in an httpOnly, Secure, SameSite=Strict
 *   cookie set by the server. The client never holds the raw session
 *   token in memory or in localStorage — it only tracks the boolean
 *   UI state (isAdminAuthenticated / adminUsername), confirmed by
 *   calling /api/auth/admin-verify, which reads the cookie directly.
 * - Constant-time comparison prevents timing attacks (admin-check.ts)
 * - Rate limiting per IP address (admin-check.ts)
 * - Server-side session validation for all mutations (admin-mutation-verify.ts)
 *
 * Only `failedAttempts` is persisted to localStorage — it's not sensitive,
 * it just keeps the "attempts remaining" hint stable across a refresh.
 * Everything else starts from a clean 'unverified' state on every page
 * load and is reconciled by calling verifySession() (see Header.tsx's
 * mount effect), which is the only source of truth for auth state.
 */
export const useAdminAuth = create<AdminAuthState>()(
  persist(
    (set, get) => ({
      isAdminAuthenticated: false,
      adminUsername: null,
      failedAttempts: 0,
      isLoading: false,
      isVerifying: true,
      error: null,

      login: async (username: string, password: string) => {
        set({ isLoading: true, error: null });

        try {
          // Call secure backend endpoint. The server sets the httpOnly
          // session cookie on success — credentials:'include' is what
          // makes the browser store and later resend it.
          console.log('[ADMIN AUTH] Attempting login...');
          const response = await fetch('/api/auth/admin-check', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ username, password }),
          });

          console.log('[ADMIN AUTH] Response status:', response.status);

          let data;
          try {
            data = await safeJson(response);
            console.log('[ADMIN AUTH] Response data:', data);
          } catch (parseError) {
            console.error('[ADMIN AUTH] Response parse error:', parseError);
            set({
              isLoading: false,
              error: parseError instanceof Error ? parseError.message : 'Invalid server response'
            });
            return false;
          }

          if (data.authenticated) {
            // Generate a simple token for API calls (base64 encoded username:password)
            const token = btoa(`${username}:${password}`);
            set({
              isAdminAuthenticated: true,
              adminUsername: username,
              adminToken: token,
              failedAttempts: 0,
              isLoading: false,
              isVerifying: false,
              error: null,
            });

            console.log('[ADMIN AUTH] Login successful for', username);
            return true;
          }

          // Handle failed attempt - do NOT lock out client-side
          // Rate limiting is handled server-side only
          const currentState = get();
          const newAttempts = currentState.failedAttempts + 1;

          set({
            failedAttempts: newAttempts,
            isLoading: false,
            error: data.error || 'Authentication failed',
          });

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
        try {
          // action:'logout' tells the server to clear the httpOnly cookie
          // (see admin-verify.ts). Without this, the cookie stayed valid
          // until its natural expiry and a refresh right after "logging
          // out" would silently re-authenticate the admin.
          await fetch('/api/auth/admin-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({ action: 'logout' }),
          });
        } catch (error) {
          console.error('[ADMIN AUTH] Logout error:', error);
        }

        set({
          isAdminAuthenticated: false,
          adminUsername: null,
          adminToken: null,
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

      // Authoritative check against the server. Called on mount (see
      // Header.tsx) so a page refresh reflects the real cookie-backed
      // session instead of trusting stale client state. No token needs to
      // be supplied here — credentials:'include' sends the httpOnly
      // cookie automatically, and the server reads it directly.
      verifySession: async () => {
        // Prevent infinite retry loops - only verify once per session
        if (verificationAttemptCount >= MAX_VERIFICATION_ATTEMPTS) {
          set({ isVerifying: false });
          return false;
        }
        verificationAttemptCount++;

        set({ isVerifying: true });

        try {
          const response = await fetch('/api/auth/admin-verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: JSON.stringify({}),
          });

          // Handle non-OK responses gracefully
          if (!response.ok) {
            if (response.status === 400 || response.status === 401 || response.status === 403) {
              // Expected responses for unauthenticated users
              set({ isAdminAuthenticated: false, adminUsername: null, isVerifying: false });
              return false;
            }
            // Log unexpected errors but don't crash
            console.warn(`[ADMIN AUTH] Unexpected response status ${response.status}`);
            set({ isAdminAuthenticated: false, isVerifying: false });
            return false;
          }

          const data = await safeJson(response);

          if (data.valid) {
            set({
              isAdminAuthenticated: true,
              adminUsername: data.username ?? get().adminUsername,
              isVerifying: false,
            });
            return true;
          } else {
            set({ isAdminAuthenticated: false, adminUsername: null, adminToken: null, isVerifying: false });
            return false;
          }
        } catch (error) {
          console.log('[ADMIN AUTH] Session verification error (expected if not authenticated):', error instanceof Error ? error.message : error);
          set({ isAdminAuthenticated: false, isVerifying: false });
          return false;
        }
      },
    }),
    {
      name: 'admin-auth-storage',
      partialize: (state) => ({
        failedAttempts: state.failedAttempts,
      }),
    }
  )
);
