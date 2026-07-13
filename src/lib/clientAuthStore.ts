import { create } from 'zustand';

interface ClientSession {
  clientEmail: string;
  galleryId?: string;
  clientName: string;
  accountId?: string;
  isAccountLogin?: boolean;
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
}

export const useAuthStore = create<AuthStore>((set) => ({
  clientSession: (() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('clientSession');
      return stored ? JSON.parse(stored) : null;
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
      localStorage.setItem('clientSession', JSON.stringify(session));
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
}));
