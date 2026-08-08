import React, { Suspense, useState, useEffect } from 'react';
import AppRouter from '@/components/Router';
import RouterFallback from '@/components/RouterFallback';
import SplashScreen from '@/components/SplashScreen';
import LogoSplash from '@/components/LogoSplash';
import { AdminAuthProvider } from '@/components/AdminAuthProvider';
import { MemberProvider } from '@/integrations/members/providers';
import { useAdminAuth } from '@/lib/adminAuthStore';

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
  const { checkSession } = useAdminAuth();

  // Check if splash was already shown in this session and verify admin session
  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashScreenShown') === 'true';
    if (splashShown) {
      setSplashComplete(true);
      return;
    }
    
    // Check admin session on app load
    checkSession();
    
    // CRITICAL: Fallback timeout to prevent infinite loading
    // If splash doesn't complete within 5 seconds, force it to complete
    const fallbackTimer = setTimeout(() => {
      setSplashComplete(true);
      sessionStorage.setItem('splashScreenShown', 'true');
    }, 5000);
    
    return () => clearTimeout(fallbackTimer);
  }, [checkSession]);

  const handleSplashComplete = () => {
    setSplashComplete(true);
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
