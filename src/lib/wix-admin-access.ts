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
      // Use the admin-check endpoint which verifies via Wix Members
      const response = await fetch('/api/auth/admin-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for Wix session verification
      });

      const data = await response.json();

      // Check if the response indicates admin status
      if (response.ok && data.authenticated) {
        set({
          isAdmin: true,
          isLoading: false,
          memberId,
          error: null,
        });
        return true;
      } else {
        // Not admin or authentication failed
        set({
          isAdmin: false,
          isLoading: false,
          error: data.error || 'You do not have admin permissions',
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
