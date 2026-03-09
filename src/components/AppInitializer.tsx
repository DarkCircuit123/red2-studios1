/**
 * App Initializer Component
 * Initializes global error handlers and module preloading on app startup
 */

import { useEffect } from 'react';
import { initializeGlobalErrorHandlers } from '@/lib/global-error-handler';
import { initializeModulePreloading } from '@/lib/module-preloader';
import { initializeChunkErrorRecovery, resetReloadAttempts } from '@/lib/chunk-error-recovery';

export function AppInitializer() {
  useEffect(() => {
    // Initialize chunk error recovery first (catches errors early)
    initializeChunkErrorRecovery({
      maxReloadAttempts: 3,
      reloadDelay: 1000,
    });

    // Initialize global error handlers
    initializeGlobalErrorHandlers();

    // Initialize module preloading with critical and deferred modules
    initializeModulePreloading({
      critical: [
        // HomePage is critical - preload immediately
        {
          importFn: () => import('./pages/HomePage'),
          name: 'HomePage',
        },
      ],
      deferred: [
        // Other pages can be preloaded when browser is idle
        {
          importFn: () => import('./pages/PortfolioPage'),
          name: 'PortfolioPage',
        },
        {
          importFn: () => import('./pages/BlogPage'),
          name: 'BlogPage',
        },
        {
          importFn: () => import('./pages/BookingPage'),
          name: 'BookingPage',
        },
      ],
    });

    // Reset reload attempts on successful app load
    resetReloadAttempts();
  }, []);

  return null;
}
