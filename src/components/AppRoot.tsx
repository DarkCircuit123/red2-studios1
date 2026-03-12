import React, { Suspense, lazy, useState } from 'react';
import RouterFallback from '@/components/RouterFallback';
import SplashScreen from '@/components/SplashScreen';

// Lazy load Router with error handling
const AppRouter = lazy(() => 
  import('@/components/Router').catch(err => {
    return { default: RouterFallback };
  })
);

class RouterErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; errorCount: number }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    this.setState(prev => ({ errorCount: prev.errorCount + 1 }));
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

  return (
    <>
      {/* Top-level splash screen - shown once per session */}
      <SplashScreen onComplete={() => setSplashComplete(true)} />
      
      {/* Main app router */}
      <RouterErrorBoundary>
        <Suspense fallback={<RouterFallback />}>
          <AppRouter />
        </Suspense>
      </RouterErrorBoundary>
    </>
  );
}
