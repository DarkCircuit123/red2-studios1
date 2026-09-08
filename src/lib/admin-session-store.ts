/**
 * Admin Session Store - Robust State Machine
 *
 * Client-side UI state only. The authoritative admin session is the
 * server-issued httpOnly cookie; session credentials are never persisted.
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AdminAuthState =
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'failed'
  | 'expired';

interface AdminSessionStore {
  state: AdminAuthState;
  adminUsername: string | null;
  sessionToken: string | null;
  failedAttempts: number;
  error: string | null;
  lastActivityTime: number | null;

  setLoading: () => void;
  setAuthenticated: (username: string, sessionToken?: string | null) => void;
  setFailed: (error: string) => void;
  setExpired: () => void;
  reset: () => void;
  recordFailedAttempt: () => void;
  recordSuccessfulAttempt: () => void;
  updateActivityTime: () => void;
  logout: () => void;

  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  isLocked: () => boolean;
  isExpired: () => boolean;
  canAttemptLogin: () => boolean;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000;

export const useAdminSession = create<AdminSessionStore>()(
  persist(
    (set, get) => ({
      state: 'idle',
      adminUsername: null,
      sessionToken: null,
      failedAttempts: 0,
      error: null,
      lastActivityTime: null,

      setLoading: () => {
        set({ state: 'loading', error: null });
      },

      setAuthenticated: (username: string, sessionToken: string | null = null) => {
        set({
          state: 'authenticated',
          adminUsername: username,
          sessionToken,
          failedAttempts: 0,
          error: null,
          lastActivityTime: Date.now(),
        });
      },

      setFailed: (error: string) => {
        set({
          state: 'failed',
          error,
        });
      },

      setExpired: () => {
        set({
          state: 'expired',
          sessionToken: null,
          error: 'Session expired. Please log in again.',
        });
      },

      reset: () => {
        set({
          state: 'idle',
          adminUsername: null,
          sessionToken: null,
          failedAttempts: 0,
          error: null,
          lastActivityTime: null,
        });
      },

      recordFailedAttempt: () => {
        set((current) => ({
          failedAttempts: current.failedAttempts + 1,
          error: 'Login failed. Please try again.',
        }));
      },

      recordSuccessfulAttempt: () => {
        set({
          failedAttempts: 0,
          error: null,
          lastActivityTime: Date.now(),
        });
      },

      updateActivityTime: () => {
        set({ lastActivityTime: Date.now() });
      },

      logout: () => {
        set({
          state: 'idle',
          adminUsername: null,
          sessionToken: null,
          failedAttempts: 0,
          error: null,
          lastActivityTime: null,
        });
      },

      isAuthenticated: () => {
        const current = get();
        if (current.state !== 'authenticated') return false;

        if (current.lastActivityTime) {
          const elapsed = Date.now() - current.lastActivityTime;
          if (elapsed > SESSION_TIMEOUT_MS) {
            get().setExpired();
            return false;
          }
        }

        return true;
      },

      isLoading: () => get().state === 'loading',
      isExpired: () => get().state === 'expired',

      // Lockout is enforced server-side. This store must never be the source
      // of truth for authentication or brute-force protection.
      isLocked: () => false,

      canAttemptLogin: () => get().state !== 'loading',
    }),
    {
      name: 'admin-session-storage',
      // Never persist the session credential. Authentication remains server-side.
      partialize: (state) => ({
        adminUsername: state.adminUsername,
        failedAttempts: state.failedAttempts,
        lastActivityTime: state.lastActivityTime,
      }),
    }
  )
);
