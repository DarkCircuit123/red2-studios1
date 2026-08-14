import React, { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { MemberActions, MemberContext, MemberState } from '.';
import { getCurrentMember } from '../service';
import type { Member } from '../types';

// Local storage key
const MEMBER_STORAGE_KEY = 'member-store';

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
      try {
        // Check if localStorage is accessible before attempting to use it
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
          const stored = localStorage.getItem(MEMBER_STORAGE_KEY);
          if (stored) {
             const parsedData = JSON.parse(stored);
             // Restore both member data and authentication status
             storedMemberData = parsedData.member || null;
             storedIsAuthenticated = parsedData.isAuthenticated || false;
             console.log('[MEMBER PROVIDER INIT] Restored from localStorage:', {
               isAuthenticated: storedIsAuthenticated,
               hasMember: !!storedMemberData,
             });
           }
         }
      } catch (error) {
        // Silently handle localStorage errors - this is expected in some contexts (e.g., cross-origin iframes)
        // Don't log as error to avoid console spam during hydration
        console.debug('[MEMBER PROVIDER INIT] localStorage unavailable:', error instanceof Error ? error.message : String(error));
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
      try {
        // Check if localStorage is accessible before attempting to use it
        if (typeof localStorage !== 'undefined' && localStorage !== null) {
          // Save both member data and authentication status for persistent login
          localStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify({
            member: state.member,
            isAuthenticated: state.isAuthenticated,
          }));
        }
      } catch (error) {
        // Silently handle localStorage errors - this is expected in some contexts
        console.debug('[MEMBER PROVIDER] localStorage save failed:', error instanceof Error ? error.message : String(error));
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
      
      // Clear localStorage IMMEDIATELY - BEFORE any async operations
      // This ensures that even if the page reloads during logout, we won't restore stale auth state
      if (typeof window !== 'undefined') {
        try {
          // Check if localStorage is accessible before attempting to use it
          if (typeof localStorage !== 'undefined' && localStorage !== null) {
            localStorage.removeItem(MEMBER_STORAGE_KEY);
            console.log('[LOGOUT] Cleared localStorage immediately');
          }
        } catch (error) {
          console.debug('[LOGOUT] Error clearing localStorage:', error instanceof Error ? error.message : String(error));
        }
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
      // The page reload will restore from localStorage (which is now empty)
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
    
    actions.loadCurrentMember();
  }, [actions]);

  return (
    <MemberContext.Provider value={{ ...state, actions }}>
      {children}
    </MemberContext.Provider>
  );
};
