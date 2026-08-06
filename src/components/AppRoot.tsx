import React, { Suspense, useState, useEffect } from 'react';
import AppRouter from '@/components/Router';
import RouterFallback from '@/components/RouterFallback';
import SplashScreen from '@/components/SplashScreen';
import LogoSplash from '@/components/LogoSplash';
import { AdminAuthProvider } from '@/components/AdminAuthProvider';
import { MemberProvider } from '@/integrations/members/providers';
import { useAdminAuth } from '@/lib/adminAuthStore';

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
    }
    
    // Check admin session on app load
    checkSession();
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
