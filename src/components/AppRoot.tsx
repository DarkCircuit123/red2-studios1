import React, { Suspense, lazy, useEffect, useState } from 'react';
import RouterFallback from '@/components/RouterFallback';
import DiagnosticWrapper from '@/components/DiagnosticWrapper';
import IntegrationTest from '@/components/IntegrationTest';

// Lazy load the router to prevent circular dependencies
const AppRouter = lazy(() => 
  import('@/components/Router').catch(err => {
    console.error('[AppRoot] Failed to load Router:', err);
    throw err;
  })
);

// Lazy load MemberProvider to prevent circular dependencies
const MemberProvider = lazy(() =>
  import('@/integrations').then(mod => ({ default: mod.MemberProvider })).catch(err => {
    console.error('[AppRoot] Failed to load MemberProvider:', err);
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
  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    // Minimal initialization - just set ready immediately
    console.log('[AppRoot] Initialization complete');
  }, []);

  if (!isReady) {
    return <RouterFallback />;
  }

  return (
    <Suspense fallback={<RouterFallback />}>
      <MemberProvider>
        <RouterErrorBoundary>
          <Suspense fallback={<RouterFallback />}>
            <AppRouter />
          </Suspense>
        </RouterErrorBoundary>
      </MemberProvider>
    </Suspense>
  );
}

export default function AppRoot() {
  return (
    <DiagnosticWrapper>
      <IntegrationTest />
      <AppRootContent />
    </DiagnosticWrapper>
  );
}
