import React, { Suspense } from 'react';
import { HelmetProvider } from 'react-helmet-async';
import RouterFallback from '@/components/RouterFallback';
import AppRouter from '@/components/Router';

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
  return (
    <HelmetProvider>
      <RouterErrorBoundary>
        <Suspense fallback={<RouterFallback />}>
          <AppRouter />
        </Suspense>
      </RouterErrorBoundary>
    </HelmetProvider>
  );
}
