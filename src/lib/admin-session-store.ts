/**
 * Admin Session Store - Robust State Machine
 * Fixes race conditions and implements proper session management
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AdminAuthState = 
  | 'idle'
  | 'loading'
  | 'authenticated'
  | 'failed'
  | 'locked'
  | 'expired';

interface AdminSessionStore {
  // State
  state: AdminAuthState;
  adminUsername: string | null;
  sessionToken: string | null;
  failedAttempts: number;
  error: string | null;
  lastActivityTime: number | null;
  
  // Actions
  setLoading: () => void;
  setAuthenticated: (username: string, sessionToken: string) => void;
  setFailed: (error: string) => void;
  setLocked: () => void;
  setExpired: () => void;
  reset: () => void;
  recordFailedAttempt: () => void;
  recordSuccessfulAttempt: () => void;
  updateActivityTime: () => void;
  logout: () => void;
  
  // Queries
  isAuthenticated: () => boolean;
  isLoading: () => boolean;
  isLocked: () => boolean;
  isExpired: () => boolean;
  canAttemptLogin: () => boolean;
}

const SESSION_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const MAX_FAILED_ATTEMPTS = 5;

export const useAdminSession = create<AdminSessionStore>()(
  persist(
    (set, get) => ({
      // Initial state
      state: 'idle',
      adminUsername: null,
      sessionToken: null,
      failedAttempts: 0,
      error: null,
      lastActivityTime: null,

      // State transitions
      setLoading: () => {
        set({ state: 'loading', error: null });
      },

      setAuthenticated: (username: string, sessionToken: string) => {
        set({
          state: 'authenticated',
          adminUsername: username,
          sessionToken,
          failedAttempts: 0,
          error: null,
          lastActivityTime: Date.now(),
        });
        console.log('[ADMIN SESSION] Authenticated:', username);
      },

      setFailed: (error: string) => {
        const current = get();
        const newAttempts = current.failedAttempts + 1;
        
        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          set({
            state: 'locked',
            failedAttempts: newAttempts,
            error: 'Too many failed attempts. Please try again later.',
          });
          console.warn('[ADMIN SESSION] Account locked due to failed attempts');
        } else {
          set({
            state: 'failed',
            failedAttempts: newAttempts,
            error,
          });
          console.warn(`[ADMIN SESSION] Login failed: ${error} (${newAttempts}/${MAX_FAILED_ATTEMPTS})`);
        }
      },

      setLocked: () => {
        set({
          state: 'locked',
          error: 'Account is locked. Please try again later.',
        });
        console.warn('[ADMIN SESSION] Account locked');
      },

      setExpired: () => {
        set({
          state: 'expired',
          error: 'Session expired. Please log in again.',
        });
        console.warn('[ADMIN SESSION] Session expired');
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
        console.log('[ADMIN SESSION] Reset to idle state');
      },

      recordFailedAttempt: () => {
        const current = get();
        const newAttempts = current.failedAttempts + 1;
        
        if (newAttempts >= MAX_FAILED_ATTEMPTS) {
          set({
            failedAttempts: newAttempts,
            state: 'locked',
            error: 'Too many failed attempts. Account locked.',
          });
        } else {
          set({
            failedAttempts: newAttempts,
            error: `Failed attempt ${newAttempts}/${MAX_FAILED_ATTEMPTS}`,
          });
        }
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
          error: null,
          lastActivityTime: null,
        });
        console.log('[ADMIN SESSION] Logged out');
      },

      // Query methods
      isAuthenticated: () => {
        const current = get();
        if (current.state !== 'authenticated') return false;
        
        // Check session timeout
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
      isLocked: () => get().state === 'locked',
      isExpired: () => get().state === 'expired',

      canAttemptLogin: () => {
        const current = get();
        return current.state !== 'loading' && current.state !== 'locked';
      },
    }),
    {
      name: 'admin-session-storage',
      partialize: (state) => ({
        adminUsername: state.adminUsername,
        sessionToken: state.sessionToken,
        failedAttempts: state.failedAttempts,
        lastActivityTime: state.lastActivityTime,
      }),
    }
  )
);
