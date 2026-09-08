import React, { Suspense } from 'react';
import AppRouter from '@/components/Router';
import RouterFallback from '@/components/RouterFallback';
import { AdminAuthProvider } from '@/components/AdminAuthProvider';
import { MemberProvider } from '@/integrations/members/providers';

// DEV ONLY. Lets Vite's dependency scanner find every third-party package in
// its initial crawl so it pre-bundles them in one pass. Without this, packages
// are discovered lazily, each discovery re-optimizes and rewrites the dep
// chunks with a new hash, and the already-loaded page 404s on the old chunk
// URLs - the "Loading failed for the module .../deps/xxx.js?v=<hash>" errors
// and astro-island hydration failures.
if (import.meta.env.DEV) {
  void import('@/lib/vite-dep-preload');
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[AppRoot] Fatal application error:', error);
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[AppRoot] Fatal error details:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <RouterFallback />;
    }
    return this.props.children;
  }
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
  // The fatal boundary intentionally wraps the provider tree. Previously the
  // RouterErrorBoundary sat INSIDE AdminAuthProvider/MemberProvider, so an
  // exception thrown while either provider rendered could bypass every React
  // error boundary and collapse the whole hydrated application. That is a
  // particularly bad failure mode for the Wix-hosted shell because it can
  // present as a brief page flash followed by the platform error page.
  return (
    <AppErrorBoundary>
      <AdminAuthProvider>
        <MemberProvider>
          <RouterErrorBoundary>
            <Suspense fallback={<RouterFallback />}>
              <AppRouter />
            </Suspense>
          </RouterErrorBoundary>
        </MemberProvider>
      </AdminAuthProvider>
    </AppErrorBoundary>
  );
}
