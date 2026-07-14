import React, { Suspense, lazy, useEffect, useState } from 'react';
import RouterFallback from '@/components/RouterFallback';
import { initializeApp } from '@/lib/app-initialization';

// Lazy load the router to prevent circular dependencies
const AppRouter = lazy(() => 
  import('@/components/Router').catch(err => {
    console.error('[AppRoot] Failed to load Router:', err);
    throw err;
  })
);

class RouterErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorMessage: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error: Error) {
    console.error('[AppRoot] Router error:', error);
    return { 
      hasError: true,
      errorMessage: error?.message || 'Unknown error'
    };
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

function AppRootContent() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Initialize critical systems
    const init = async () => {
      try {
        const status = await initializeApp();
        console.log('[AppRoot] Initialization status:', status);
        setIsReady(true);
      } catch (err) {
        console.warn('[AppRoot] Initialization error:', err);
        setIsReady(true); // Continue anyway
      }
    };

    init();
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

export default function AppRoot() {
  return <AppRootContent />;
}
