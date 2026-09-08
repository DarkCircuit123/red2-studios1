/**
 * Admin Session Store - UI state only.
 * The authoritative session is the server-issued httpOnly cookie.
 * No session credential is stored in browser storage.
 */
import { create } from 'zustand';

export type AdminAuthState = 'idle' | 'loading' | 'authenticated' | 'failed' | 'expired';

interface AdminSessionStore {
  state: AdminAuthState;
  adminUsername: string | null;
  failedAttempts: number;
  error: string | null;
  lastActivityTime: number | null;
  setLoading: () => void;
  setAuthenticated: (username: string) => void;
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

export const useAdminSession = create<AdminSessionStore>()((set, get) => ({
  state: 'idle',
  adminUsername: null,
  failedAttempts: 0,
  error: null,
  lastActivityTime: null,

  setLoading: () => set({ state: 'loading', error: null }),
  setAuthenticated: (username) => set({
    state: 'authenticated', adminUsername: username, failedAttempts: 0,
    error: null, lastActivityTime: Date.now(),
  }),
  setFailed: (error) => set({ state: 'failed', error }),
  setExpired: () => set({ state: 'expired', error: 'Session expired. Please log in again.' }),
  reset: () => set({ state: 'idle', adminUsername: null, failedAttempts: 0, error: null, lastActivityTime: null }),
  recordFailedAttempt: () => set((s) => ({ failedAttempts: s.failedAttempts + 1, error: 'Login failed. Please try again.' })),
  recordSuccessfulAttempt: () => set({ failedAttempts: 0, error: null, lastActivityTime: Date.now() }),
  updateActivityTime: () => set({ lastActivityTime: Date.now() }),
  logout: () => set({ state: 'idle', adminUsername: null, failedAttempts: 0, error: null, lastActivityTime: null }),

  isAuthenticated: () => {
    const current = get();
    if (current.state !== 'authenticated') return false;
    if (current.lastActivityTime && Date.now() - current.lastActivityTime > SESSION_TIMEOUT_MS) {
      get().setExpired();
      return false;
    }
    return true;
  },
  isLoading: () => get().state === 'loading',
  isExpired: () => get().state === 'expired',
  // Brute-force protection is enforced server-side, never by this UI store.
  isLocked: () => false,
  canAttemptLogin: () => get().state !== 'loading',
}));
