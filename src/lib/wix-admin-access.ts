import { create } from 'zustand';

interface AdminAccessState {
  isAdmin: boolean;
  isLoading: boolean;
  error: string | null;
  memberId: string | null;
  memberEmail: string | null;
  checkAdminAccess: (memberId: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

export const useWixAdminAccess = create<AdminAccessState>((set) => ({
  isAdmin: false,
  isLoading: false,
  error: null,
  memberId: null,
  memberEmail: null,

  checkAdminAccess: async (memberId: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await fetch('/api/auth/admin-check', { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
      const data = await response.json().catch(() => null);
      if (response.ok && data?.authenticated === true) {
        set({ isAdmin: true, isLoading: false, memberId, memberEmail: typeof data.username === 'string' ? data.username : null, error: null });
        return true;
      }
      set({ isAdmin: false, isLoading: false, error: data?.error || 'You do not have admin permissions' });
      return false;
    } catch (error) {
      set({ isAdmin: false, isLoading: false, error: error instanceof Error ? error.message : 'Failed to verify admin access' });
      return false;
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ isAdmin: false, isLoading: false, error: null, memberId: null, memberEmail: null }),
}));
