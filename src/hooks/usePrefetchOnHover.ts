import { useCallback } from 'react';
import { codeSpittingStrategy } from '@/lib/bundle-analyzer';

/**
 * Returns a callback that triggers a dynamic import for a given route when
 * invoked.  Useful for prefetching chunk code on hover or focus of a link.
 */
export function usePrefetchOnHover(
  route: keyof typeof codeSpittingStrategy.routes
) {
  return useCallback(() => {
    const loader = codeSpittingStrategy.routes[route];
    if (loader) {
      // start loading but don't await
      loader();
    }
  }, [route]);
}
