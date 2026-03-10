/**
 * App Initializer Component
 * Initializes global error handlers, module preloading, and error suppression on app startup
 */

import { useEffect } from 'react';
import { initializeGlobalErrorHandlers } from '@/lib/global-error-handler';
import { initializeModulePreloading } from '@/lib/module-preloader';
import { initializeChunkErrorRecovery, resetReloadAttempts } from '@/lib/chunk-error-recovery';
import { initializeErrorSuppression } from '@/lib/error-suppression';

export function AppInitializer() {
  useEffect(() => {
    // Initialize error suppression first to prevent repeated fetch attempts
    initializeErrorSuppression();

    // Initialize chunk error recovery (catches errors early)
    initializeChunkErrorRecovery({
      maxReloadAttempts: 3,
      reloadDelay: 1000,
    });

    // Initialize global error handlers
    initializeGlobalErrorHandlers();

    // Reset reload attempts on successful app load
    resetReloadAttempts();
  }, []);

  return null;
}
