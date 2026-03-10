import React, { Suspense } from 'react';
import AppRouter from '@/components/Router';
import RouterFallback from '@/components/RouterFallback';

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
  return (
    <RouterErrorBoundary>
      <Suspense fallback={<RouterFallback />}>
        <AppRouter />
      </Suspense>
    </RouterErrorBoundary>
  );
}
