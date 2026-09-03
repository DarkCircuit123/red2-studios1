import React, { Suspense, useState, useEffect } from 'react';
import AppRouter from '@/components/Router';
import RouterFallback from '@/components/RouterFallback';
import SplashScreen from '@/components/SplashScreen';
import { AdminAuthProvider } from '@/components/AdminAuthProvider';
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

// AppRoot with integrated splash screen
export default function AppRoot() {
  const [splashComplete, setSplashComplete] = useState(false);

  // Force black background on mount
  useEffect(() => {
    if (typeof document === 'undefined') return;
    
    document.documentElement.style.backgroundColor = '#000000';
    document.documentElement.style.display = 'block';
    document.documentElement.style.visibility = 'visible';
    document.documentElement.style.opacity = '1';
    
    document.body.style.backgroundColor = '#000000';
    document.body.style.display = 'block';
    document.body.style.visibility = 'visible';
    document.body.style.opacity = '1';
    document.body.style.margin = '0';
    document.body.style.padding = '0';
    
    const root = document.getElementById('root');
    if (root) {
      root.style.backgroundColor = '#000000';
      root.style.display = 'block';
      root.style.visibility = 'visible';
      root.style.opacity = '1';
    }
  }, []);

  const handleSplashComplete = () => {
    console.log('[AppRoot] Splash screen complete');
    setSplashComplete(true);
    
    // Reset background to white for main app
    if (typeof document !== 'undefined') {
      document.documentElement.style.backgroundColor = '#ffffff';
      document.body.style.backgroundColor = '#ffffff';
    }
  };

  return (
    <AdminAuthProvider>
      <MemberProvider>
        <RouterErrorBoundary>
          {/* Show splash screen until complete */}
          {!splashComplete && (
            <SplashScreen onComplete={handleSplashComplete} />
          )}
          
          {/* Show app content after splash completes */}
          {splashComplete && (
            <Suspense fallback={<RouterFallback />}>
              <AppRouter />
            </Suspense>
          )}
        </RouterErrorBoundary>
      </MemberProvider>
    </AdminAuthProvider>
  );
}
