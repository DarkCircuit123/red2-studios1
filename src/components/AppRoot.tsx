import React, { Suspense } from 'react';
import { MemberProvider } from '@/integrations';
import AppRouter from '@/components/Router';
import RouterFallback from '@/components/RouterFallback';

export default function AppRoot() {
  return (
    <Suspense fallback={<RouterFallback />}>
      <MemberProvider>
        <AppRouter />
      </MemberProvider>
    </Suspense>
  );
}
