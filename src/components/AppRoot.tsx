import React, { Suspense, useState, useEffect } from 'react';
import AppRouter from '@/components/Router';
import RouterFallback from '@/components/RouterFallback';
import SplashScreen from '@/components/SplashScreen';
import { AdminAuthProvider, useAdminAuth } from '@/components/AdminAuthProvider';
import { MemberProvider } from '@/integrations/members/providers';

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

// Detect if we're in preview/development environment
function isPreviewEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  // Check for Framewire preview environment
  const url = new URL(window.location.href);
  const isFramewire = url.searchParams.has('framewire') || url.searchParams.has('preview');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isFramewire || isLocalhost;
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

// Inner component that uses useAdminAuth hook (must be inside AdminAuthProvider)
function AppRootContent() {
  const [splashComplete, setSplashComplete] = useState(false);
  const { isLoading } = useAdminAuth();

  // Check if splash was already shown in this session
  useEffect(() => {
    const splashShown = sessionStorage.getItem('splashScreenShown') === 'true';
    
    // In preview environment, skip splash entirely
    const inPreview = isPreviewEnvironment();
    
    if (splashShown || inPreview) {
      setSplashComplete(true);
      sessionStorage.setItem('splashScreenShown', 'true');
      return;
    }
    
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
    <MemberProvider>
      {!splashComplete && <SplashScreen onComplete={handleSplashComplete} />}
      {splashComplete && (
        <RouterErrorBoundary>
          <Suspense fallback={<RouterFallback />}>
            <AppRouter />
          </Suspense>
        </RouterErrorBoundary>
      )}
    </MemberProvider>
  );
}

export default function AppRoot() {
  return (
    <AdminAuthProvider>
      <AppRootContent />
    </AdminAuthProvider>
  );
}
