import React, { useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { MemberActions, MemberContext, MemberState } from './MemberContext';
import { getCurrentMember } from '../service';
import type { Member } from '../types';

const MEMBER_STORAGE_KEY = 'member-store';

const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined' || localStorage === null) return null;
      return localStorage.getItem(key);
    } catch (error) {
      console.debug('[STORAGE] getItem failed:', error instanceof Error ? error.message : String(error));
      return null;
    }
  },
  setItem: (key: string, value: string): boolean => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined' || localStorage === null) return false;
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      console.debug('[STORAGE] setItem failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  },
  removeItem: (key: string): boolean => {
    try {
      if (typeof window === 'undefined' || typeof localStorage === 'undefined' || localStorage === null) return false;
      localStorage.removeItem(key);
      return true;
    } catch (error) {
      console.debug('[STORAGE] removeItem failed:', error instanceof Error ? error.message : String(error));
      return false;
    }
  },
};

const sanitizeMemberForStorage = (member: Member | null): Record<string, any> | null => {
  if (!member) return null;
  try {
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

interface MemberProviderProps { children: ReactNode; }

const loadMemberWithTimeout = async (timeoutMs = 2000): Promise<Member | null> => {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    const timeoutPromise = new Promise<null>((resolve) => {
      timeoutId = setTimeout(() => resolve(null), timeoutMs);
    });
    return await Promise.race([getCurrentMember(), timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};

export const MemberProvider: React.FC<MemberProviderProps> = ({ children }) => {
  const memberLoadInitiatedRef = useRef(false);

  const [state, setState] = useState<MemberState>(() => {
    let storedMemberData: Member | null = null;
    if (typeof window !== 'undefined') {
      const stored = safeStorage.getItem(MEMBER_STORAGE_KEY);
      if (stored) {
        try {
          const parsedData = JSON.parse(stored);
          storedMemberData = parsedData.member || null;
        } catch (error) {
          console.debug('[MEMBER PROVIDER INIT] Failed to parse stored data:', error instanceof Error ? error.message : String(error));
        }
      }
    }
    return {
      member: storedMemberData,
      isAuthenticated: false,
      isLoading: true,
      error: null,
    };
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const sanitizedMember = sanitizeMemberForStorage(state.member);
      try {
        safeStorage.setItem(MEMBER_STORAGE_KEY, JSON.stringify({
          member: sanitizedMember,
          isAuthenticated: state.isAuthenticated,
        }));
      } catch (error) {
        console.debug('[MEMBER PROVIDER] Failed to serialize state:', error instanceof Error ? error.message : String(error));
      }
    }
  }, [state.member, state.isAuthenticated]);

  const updateState = useCallback((updates: Partial<MemberState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const actions: MemberActions = {
    loadCurrentMember: useCallback(async () => {
      try {
        updateState({ isLoading: true, error: null });
        const member = await loadMemberWithTimeout();
        if (member) {
          updateState({ member, isAuthenticated: true, isLoading: false });
        } else {
          updateState({ member: null, isAuthenticated: false, isLoading: false });
        }
      } catch (err) {
        console.error('[MEMBER PROVIDER] Unexpected error:', err);
        updateState({ member: null, isAuthenticated: false, isLoading: false });
      }
    }, [updateState]),

    login: useCallback(() => {
      const returnUrl = encodeURIComponent(window.location.pathname);
      const loginUrl = `/api/auth/login?returnToUrl=${returnUrl}`;
      const insideIframe = window.self !== window.top;
      if (!insideIframe) {
        window.location.href = loginUrl;
        return;
      }
      document.hasStorageAccess()
        .catch(() => false)
        .then(hasAccess => {
          if (hasAccess) return true;
          document.cookie = 'wixSession=; max-age=0; Secure; SameSite=None; Partitioned';
          document.cookie = 'XSRF-TOKEN=; max-age=0; Secure; SameSite=None; Partitioned';
          return document.requestStorageAccess();
        })
        .then(() => { window.location.href = loginUrl; })
        .catch(() => { window.location.href = loginUrl; });
    }, []),

    logout: useCallback(async () => {
      if (typeof window !== 'undefined') safeStorage.removeItem(MEMBER_STORAGE_KEY);
      updateState({ member: null, isAuthenticated: false, error: null });
      try {
        const response = await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        if (!response.ok) console.warn('[LOGOUT] Logout API returned non-200 status:', response.status);
      } catch (error) {
        console.error('[LOGOUT] Logout API error:', error);
      }
      window.location.href = '/';
    }, [updateState]),

    clearMember: useCallback(() => {
      updateState({ member: null, isAuthenticated: false, error: null });
    }, [updateState]),
  };

  useEffect(() => {
    if (memberLoadInitiatedRef.current) return;
    memberLoadInitiatedRef.current = true;
    let isMounted = true;

    (async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));
        const member = await loadMemberWithTimeout();
        if (!isMounted) return;
        setState(prev => ({
          ...prev,
          member: member || null,
          isAuthenticated: !!member,
          isLoading: false,
        }));
      } catch (err) {
        if (!isMounted) return;
        console.error('[MEMBER PROVIDER] Unexpected error:', err);
        setState(prev => ({ ...prev, member: null, isAuthenticated: false, isLoading: false }));
      }
    })();

    return () => { isMounted = false; };
  }, []);

  return (
    <MemberContext.Provider value={{ ...state, actions }}>
      {children}
    </MemberContext.Provider>
  );
};
