import React, { Suspense, ComponentType, ReactNode } from 'react';
import ModuleErrorBoundary from './ModuleErrorBoundary';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SafeLazyComponentProps {
  fallback?: ReactNode;
  moduleName?: string;
  errorFallback?: ReactNode;
}

export function withSafeLazy<P extends object>(
  LazyComponent: React.LazyExoticComponent<ComponentType<P>>,
  options: SafeLazyComponentProps = {}
) {
  const {
    fallback = <LoadingSpinner />,
    moduleName = 'Unknown Module',
    errorFallback,
  } = options;

  const SafeComponent = (props: P) => (
    <ModuleErrorBoundary moduleName={moduleName} fallback={errorFallback}>
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    </ModuleErrorBoundary>
  );

  SafeComponent.displayName = `SafeLazy(${moduleName})`;

  return SafeComponent;
}

export function SafeLazyWrapper({
  children,
  moduleName = 'Module',
  fallback = <LoadingSpinner />,
}: {
  children: ReactNode;
  moduleName?: string;
  fallback?: ReactNode;
}) {
  return (
    <ModuleErrorBoundary moduleName={moduleName}>
      <Suspense fallback={fallback}>
        {children}
      </Suspense>
    </ModuleErrorBoundary>
  );
}
