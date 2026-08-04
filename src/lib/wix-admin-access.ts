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

/**
 * Wix Members-based admin access verification
 * Uses backend verification for security
 * Only Wix Members with admin role can access the admin panel
 */
export const useWixAdminAccess = create<AdminAccessState>((set) => ({
  isAdmin: false,
  isLoading: false,
  error: null,
  memberId: null,
  memberEmail: null,

  checkAdminAccess: async (memberId: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await fetch('/api/auth/verify-admin-role', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${memberId}`,
        },
        body: JSON.stringify({ memberId }),
      });

      const data = await response.json();

      if (data.isAdmin) {
        set({
          isAdmin: true,
          isLoading: false,
          memberId,
          memberEmail: data.memberEmail,
          error: null,
        });
        return true;
      } else {
        set({
          isAdmin: false,
          isLoading: false,
          error: 'You do not have admin permissions',
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify admin access';
      set({
        isAdmin: false,
        isLoading: false,
        error: errorMessage,
      });
      return false;
    }
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      isAdmin: false,
      isLoading: false,
      error: null,
      memberId: null,
      memberEmail: null,
    });
  },
}));
