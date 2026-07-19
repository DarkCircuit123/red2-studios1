import { create } from 'zustand';

interface ClientSession {
  clientEmail: string;
  clientName: string;
  accountId?: string;
  isAccountLogin?: boolean;
  galleryIds?: string[];
  sessionIssuedAt: number;
  sessionExpiresAt: number;
  sessionId: string;
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
    }
    set({ clientSession: session });
  },
  setAdminSession: (session) => {
    if (session) {
      localStorage.setItem('adminSession', JSON.stringify(session));
    } else {
      localStorage.removeItem('adminSession');
    }
    set({ adminSession: session });
  },
  logout: () => {
    localStorage.removeItem('clientSession');
    localStorage.removeItem('adminSession');
    sessionStorage.removeItem('galleryAccessCode');
    set({ clientSession: null, adminSession: null });
  },
}));
