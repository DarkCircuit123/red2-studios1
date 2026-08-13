'use client';

import React, { Suspense, useState, useEffect } from 'react';
import AppRouter from '@/components/Router';
import RouterFallback from '@/components/RouterFallback';
import SplashScreen from '@/components/SplashScreen';
import LogoSplash from '@/components/LogoSplash';
import { AdminAuthProvider } from '@/components/AdminAuthProvider';
import { MemberProvider } from '@/integrations/members/providers';
import { initCSPFixes } from '@/lib/csp-headers-fix';
import { initAuthErrorHandling } from '@/lib/auth-error-handler';

// DEV ONLY. Lets Vite's dependency scanner find every third-party package in
// its initial crawl so it pre-bundles them in one pass. Without this, packages
// are discovered lazily, each discovery re-optimizes and rewrites the dep
// chunks with a new hash, and the already-loaded page 404s on the old chunk
// URLs - the "Loading failed for the module .../deps/xxx.js?v=<hash>" errors
// and astro-island hydration failures. Tree-shaken out of production builds.
// See src/lib/vite-dep-preload.ts.
if (import.meta.env.DEV) {
  import('@/lib/vite-dep-preload');
}

// Initialize security and error handling on app load
if (typeof window !== 'undefined') {
  initCSPFixes();
  initAuthErrorHandling();
}

class RouterErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[AppRoot] Router error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppRoot] Error caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <RouterFallback />;
    }
    return this.props.children;
  }
}

export default function AppRoot() {
  const [splashComplete, setSplashComplete] = useState(false);
  const adminCheckInitiatedRef = React.useRef(false);

  // Check if splash was already shown in this session
  // DO NOT call checkSession() on app load - it causes ERR_NETWORK errors
  // because /api/auth/admin-check tries to verify tokens on every page load
  // even when there's no admin session. Only check admin session when explicitly needed.
  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashScreenShown') === 'true';
    if (splashShown) {
      setSplashComplete(true);
      return;
    }
    
    // Guard against duplicate checks in React Strict Mode
    if (adminCheckInitiatedRef.current) {
      return;
    }
    adminCheckInitiatedRef.current = true;
    
    // CRITICAL: Fallback timeout to prevent infinite loading
    // If splash doesn't complete within 3 seconds, force it to complete
    const fallbackTimer = setTimeout(() => {
      setSplashComplete(true);
      sessionStorage.setItem('splashScreenShown', 'true');
    }, 3000);
    
    return () => clearTimeout(fallbackTimer);
  }, []);

  const handleSplashComplete = () => {
    setSplashComplete(true);
    sessionStorage.setItem('splashScreenShown', 'true');
  };

  return (
    <AdminAuthProvider>
      <MemberProvider>
        <LogoSplash />
        {!splashComplete && <SplashScreen onComplete={handleSplashComplete} />}
        {splashComplete && (
          <RouterErrorBoundary>
            <Suspense fallback={<RouterFallback />}>
              <AppRouter />
            </Suspense>
          </RouterErrorBoundary>
        )}
      </MemberProvider>
    </AdminAuthProvider>
  );
}
