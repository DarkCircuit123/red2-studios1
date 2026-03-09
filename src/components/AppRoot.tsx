import React, { Suspense } from 'react';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

// Lazy load Router with explicit error boundary
const AppRouter = React.lazy(() => 
  import('@/components/Router').catch(err => {
    console.error('Failed to load Router:', err);
    // Retry once
    return new Promise((resolve) => {
      setTimeout(() => {
        import('@/components/Router')
          .then(resolve)
          .catch(() => {
            // If retry fails, reload page
            window.location.reload();
          });
      }, 1000);
    });
  })
);

export default function AppRoot() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <AppRouter />
    </Suspense>
  );
}
