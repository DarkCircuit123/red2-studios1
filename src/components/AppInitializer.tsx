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

    // Reset reload attempts on successful app load
    resetReloadAttempts();
  }, []);

  return null;
}
