import React, { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { MemberActions, MemberContext, MemberState } from '.';
import { getCurrentMember } from '../service';
import type { Member } from '../types';

// Local storage key
const MEMBER_STORAGE_KEY = 'member-store';

/**
 * Safe storage wrapper - handles localStorage unavailability gracefully
 */
const safeStorage = {
  isAvailable: (): boolean => {
    if (typeof window === 'undefined') return false;
    try {
      const test = '__storage_test__';
      localStorage.setItem(test, test);
      localStorage.removeItem(test);
      return true;
    } catch {
      return false;
    }
  },

  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined') return null;
      if (typeof localStorage === 'undefined' || localStorage === null) return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.debug('[STORAGE] getItem failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  },

  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      if (typeof localStorage === 'undefined' || localStorage === null) return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.debug('[STORAGE] setItem failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  },

  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined') return false;
      if (typeof localStorage === 'undefined' || localStorage === null) return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.debug('[STORAGE] removeItem failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  },
};

/**
 * Sanitize member data for storage - only persist primitive/plain data fields
 * NEVER persist raw Wix member objects, SDK clients, or circular references
 */
const sanitizeMemberForStorage = (member: Member | null): Record<string, any> | null => {
  if (!member) return null;
  
  try {
    // Only extract safe, serializable fields
    return {
      _id: member._id || undefined,
      loginEmail: member.loginEmail || undefined,
      loginEmailVerified: member.loginEmailVerified || undefined,
      status: member.status || undefined,
      contact: member.contact ? {
        firstName: member.contact.firstName || undefined,
        lastName: member.contact.lastName || undefined,
        phones: Array.isArray(member.contact.phones) ? member.contact.phones : undefined,
      } : undefined,
      profile: member.profile ? {
        nickname: member.profile.nickname || undefined,
        title: member.profile.title || undefined,
        // Note: photo URL is safe, but we exclude the full photo object to avoid circular refs
        photoUrl: member.profile.photo?.url || undefined,
      } : undefined,
      _createdDate: member._createdDate ? new Date(member._createdDate).toISOString() : undefined,
      _updatedDate: member._updatedDate ? new Date(member._updatedDate).toISOString() : undefined,
      lastLoginDate: member.lastLoginDate ? new Date(member.lastLoginDate).toISOString() : undefined,
    };
  } catch (error) {
    console.error('[MEMBER PROVIDER] Error sanitizing member:', error);
    return null;
  }
};

interface MemberProviderProps {
  children: ReactNode;
}

export const MemberProvider: React.FC<MemberProviderProps> = ({ children }) => {
  // Guard against duplicate calls in React Strict Mode
  const memberLoadInitiatedRef = useRef(false);

  // Initialize state from localStorage or defaults
  const [state, setState] = useState<MemberState>(() => {
    let storedMemberData: Member | null = null;
    let storedIsAuthenticated = false;

    if (typeof window !== 'undefined') {
      const stored = safeStorage.getItem(MEMBER_STORAGE_KEY);
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          // Restore both member data and authentication status
          storedMemberData = parsedData.member || null;
          storedIsAuthenticated = parsedData.isAuthenticated || false;
          console.log('[MEMBER PROVIDER INIT] Restored from storage:', {
            isAuthenticated: storedIsAuthenticated,
            hasMember: !!storedMemberData,
          });
        } catch (error) {
          console.debug('[MEMBER PROVIDER INIT] Failed to parse stored data:', error instanceof Error ? error.message : String(error));
        }
      }
    }

    // CRITICAL: Always start with isLoading: true to verify authentication with server
    // NEVER trust localStorage for authentication state - always verify with server
    const initialState = {
      member: storedMemberData,
      isAuthenticated: false, // ALWAYS start as false - will be verified by loadCurrentMember
      isLoading: true,
      error: null,
    };
    
    console.log('[MEMBER PROVIDER INIT] Initial state:', {
      isAuthenticated: initialState.isAuthenticated,
      isLoading: initialState.isLoading,
      hasMember: !!initialState.member,
    });
    
    return initialState;
  });

  // Save state to localStorage whenever it changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Sanitize member data before storage to avoid circular references
      const sanitizedMember = sanitizeMemberForStorage(state.member);
      
      const storageData = {
        member: sanitizedMember,
        isAuthenticated: state.isAuthenticated,
      };
      
      try {
        const serialized = JSON.stringify(storageData);
        safeStorage.setItem(MEMBER_STORAGE_KEY, serialized);
      } catch (error) {
        console.debug('[MEMBER PROVIDER] Failed to serialize state:', error instanceof Error ? error.message : String(error));
      }
    }
  }, [state.member, state.isAuthenticated]);

  // Update state helper
  const updateState = useCallback((updates: Partial<MemberState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Member actions
  const actions: MemberActions = {
    /**
     * Load current member from Wix
     */
    loadCurrentMember: useCallback(async () => {
      try {
        console.log('[MEMBER PROVIDER] Loading current member...');
        updateState({ isLoading: true, error: null });

        const member = await getCurrentMember();

        if (member) {
          console.log('[MEMBER PROVIDER] Member loaded:', member._id);
          updateState({
            member,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          // No member - this is normal for anonymous/unauthenticated users
          console.log('[MEMBER PROVIDER] No member found (anonymous user)');
          updateState({
            member: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (err) {
        // Silently handle errors - getCurrentMember already filters expected errors
        // This catch block should rarely be hit since the service handles errors gracefully
        console.error('[MEMBER PROVIDER] Unexpected error:', err);
        updateState({
          member: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    }, [updateState]),

    /**
     * Login redirect
     */
    login: useCallback(() => {
      const returnUrl = encodeURIComponent(window.location.pathname);
      const loginUrl = `/api/auth/login?returnToUrl=${returnUrl}`;

      const insideIframe = window.self !== window.top;
      if (!insideIframe) {
        // dev machine url has been opened outside the picasso iframe
        window.location.href = loginUrl;
        return;
      }

      // we are on a different domain, we need to ask for storage access,
      // otherwise we won't be able to access session cookie
      document
        .hasStorageAccess()
        .catch(() => false)
        .then(hasAccess => {
          if (hasAccess) {
            return true;
          }

          // in case access is not granted, we need to clear partitioned cookies
          // otherwise after storage access is granted, we will be getting duplicated cookies.
          document.cookie = "wixSession=; max-age=0; Secure; SameSite=None; Partitioned";
          document.cookie = "XSRF-TOKEN=; max-age=0; Secure; SameSite=None; Partitioned";

          return document.requestStorageAccess();
        })
        .then(() => {
          window.location.href = loginUrl;
        })
        .catch(() => {
          window.location.href = loginUrl;
        });
    }, []),

    /**
     * Logout
     */
    logout: useCallback(async () => {
      console.log('[LOGOUT] Starting logout process...');
      
      // Clear storage IMMEDIATELY - BEFORE any async operations
      // This ensures that even if the page reloads during logout, we won't restore stale auth state
      if (typeof window !== 'undefined') {
        safeStorage.removeItem(MEMBER_STORAGE_KEY);
        console.log('[LOGOUT] Cleared storage immediately');
      }

      // Clear all local state FIRST - before any async operations
      updateState({
        member: null,
        isAuthenticated: false,
        error: null,
      });

      try {
        // Call the logout API to clear server-side session
        console.log('[LOGOUT] Calling logout API...');
        const response = await fetch('/api/auth/logout', {
          method: 'POST',
          credentials: 'include',
        });
        
        if (response.ok) {
          console.log('[LOGOUT] Logout API succeeded');
        } else {
          console.warn('[LOGOUT] Logout API returned non-200 status:', response.status);
        }
      } catch (error) {
        console.error('[LOGOUT] Logout API error:', error);
      }

      // Redirect to home after state is cleared and API is called
      // The page reload will restore from storage (which is now empty)
      console.log('[LOGOUT] Redirecting to home...');
      window.location.href = '/';
    }, [updateState]),

    /**
     * Clear member data
     */
    clearMember: useCallback(() => {
      updateState({
        member: null,
        isAuthenticated: false,
        error: null,
      });
    }, [updateState]),
  };

  // Load member on mount - only once to prevent infinite loops
  useEffect(() => {
    // Guard against duplicate calls in React Strict Mode or accidental re-renders
    if (memberLoadInitiatedRef.current) {
      return;
    }
    memberLoadInitiatedRef.current = true;
    
    // Call loadCurrentMember directly instead of through actions to avoid dependency issues
    (async () => {
      try {
        console.log('[MEMBER PROVIDER] Loading current member on mount...');
        updateState({ isLoading: true, error: null });

        const member = await getCurrentMember();

        if (member) {
          console.log('[MEMBER PROVIDER] Member loaded:', member._id);
          updateState({
            member,
            isAuthenticated: true,
            isLoading: false,
          });
        } else {
          console.log('[MEMBER PROVIDER] No member found (anonymous user)');
          updateState({
            member: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } catch (err) {
        console.error('[MEMBER PROVIDER] Unexpected error:', err);
        updateState({
          member: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    })();
  }, [updateState]);

  return (
    <MemberContext.Provider value={{ ...state, actions }}>
      {children}
    </MemberContext.Provider>
  );
};
