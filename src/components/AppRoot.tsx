import React, { Suspense, useState, useEffect } from 'react';
import AppRouter from '@/components/Router';
import RouterFallback from '@/components/RouterFallback';

/**
 * Error boundary for Router loading failures
 * Catches errors and provides fallback UI
 */
class RouterErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.error('Router failed to load:', error);
  }

  render() {
    if (this.state.hasError) {
      return <RouterFallback />;
    }
    return this.props.children;
  }
}

export default function AppRoot() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Small delay to ensure Router is properly initialized
    const timer = setTimeout(() => setIsReady(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady) {
    return <RouterFallback />;
  }

  return (
    <RouterErrorBoundary>
      <Suspense fallback={<RouterFallback />}>
        <AppRouter />
      </Suspense>
    </RouterErrorBoundary>
  );
}
