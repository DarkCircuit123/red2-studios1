import { create } from 'zustand';

interface ClientSession {
  clientEmail: string;
  galleryId?: string;
  clientName: string;
  accountId?: string;
  isAccountLogin?: boolean;
  sessionId?: string;
  sessionExpiresAt?: number;
}

interface AdminSession {
  isAdmin: boolean;
}

interface AuthStore {
  clientSession: ClientSession | null;
  adminSession: AdminSession | null;
  setClientSession: (session: ClientSession | null) => void;
  setAdminSession: (session: AdminSession | null) => void;
  logout: () => void;
  isSessionValid: () => boolean;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  clientSession: (() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('clientSession');
      if (stored) {
        try {
          const session = JSON.parse(stored);
          // Validate session expiration
          if (session.sessionExpiresAt && session.sessionExpiresAt < Date.now()) {
            localStorage.removeItem('clientSession');
            return null;
          }
          return session;
        } catch {
          localStorage.removeItem('clientSession');
          return null;
        }
      }
    }
    return null;
  })(),
  adminSession: (() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('adminSession');
      return stored ? JSON.parse(stored) : null;
    }
    return null;
  })(),
  setClientSession: (session) => {
    if (session) {
      // Add session expiration (24 hours)
      const sessionWithExpiry = {
        ...session,
        sessionExpiresAt: Date.now() + 24 * 60 * 60 * 1000,
      };
      localStorage.setItem('clientSession', JSON.stringify(sessionWithExpiry));
    } else {
      localStorage.removeItem('clientSession');
      // Full logout cleanup: clear all session storage
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
    }
    set({ clientSession: session });
  },
  setAdminSession: (session) => {
    if (session) {
      localStorage.setItem('adminSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('adminSession');
      // Full logout cleanup: clear all session storage
      if (typeof window !== 'undefined') {
        sessionStorage.clear();
      }
    }
    set({ adminSession: session });
  },
  logout: () => {
    localStorage.removeItem('clientSession');
    localStorage.removeItem('adminSession');
    // Full logout cleanup: clear all session storage and sensitive data
    if (typeof window !== 'undefined') {
      sessionStorage.clear();
      // Clear any cached gallery data
      const keys = Object.keys(localStorage);
      keys.forEach(key => {
        if (key.includes('gallery') || key.includes('client')) {
          localStorage.removeItem(key);
        }
      });
    }
    set({ clientSession: null, adminSession: null });
  },
  isSessionValid: () => {
    const state = get();
    if (!state.clientSession) return false;
    if (state.clientSession.sessionExpiresAt && state.clientSession.sessionExpiresAt < Date.now()) {
      state.logout();
      return false;
    }
    return true;
  },
}));
