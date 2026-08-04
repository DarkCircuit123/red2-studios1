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
 * Admin access verification - Hardcoded credentials
 * Temporary implementation using hardcoded admin credentials.
 * Email: jordanzuniga@gmail.com
 * Password: Iloveanna1!
 */
export const useWixAdminAccess = create<AdminAccessState>((set) => ({
  isAdmin: false,
  isLoading: false,
  error: null,
  memberId: null,
  memberEmail: null,

  checkAdminAccess: async (memberId: string) => {
    console.log('[ADMIN-ACCESS] Checking admin access for member:', memberId);
    set({ isLoading: true, error: null });

    try {
      // Use the admin-check endpoint which verifies admin session
      console.log('[ADMIN-ACCESS] Calling /api/auth/admin-check...');
      const response = await fetch('/api/auth/admin-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for admin session verification
      });

      const data = await response.json();
      console.log('[ADMIN-ACCESS] Response:', { status: response.status, data });

      // Check if the response indicates admin status
      if (response.ok && data.authenticated) {
        console.log('[ADMIN-ACCESS] Admin access granted for member:', memberId);
        set({
          isAdmin: true,
          isLoading: false,
          memberId,
          error: null,
        });
        return true;
      } else {
        // Not admin or authentication failed
        console.log('[ADMIN-ACCESS] Admin access denied:', data.error);
        set({
          isAdmin: false,
          isLoading: false,
          error: data.error || 'You do not have admin permissions',
        });
        return false;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to verify admin access';
      console.error('[ADMIN-ACCESS] Error:', errorMessage);
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
