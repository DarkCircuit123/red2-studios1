import React, { Suspense, useEffect } from 'react';
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
  useEffect(() => {
    // Lazy load diagnostics after app is mounted
    const loadDiagnostics = async () => {
      try {
        await import('@/lib/performance-optimizer');
        await import('@/lib/accessibility-checker');
      } catch (err) {
        console.warn('Failed to load diagnostics:', err);
      }
    };
    loadDiagnostics();
  }, []);

  return (
    <RouterErrorBoundary>
      <Suspense fallback={<RouterFallback />}>
        <AppRouter />
      </Suspense>
    </RouterErrorBoundary>
  );
}
