import { useEffect } from 'react';
import { initializeGlobalErrorHandlers } from '@/lib/global-error-handler';
import { initializeChunkErrorRecovery, resetReloadAttempts } from '@/lib/chunk-error-recovery';
import { initializeErrorSuppression } from '@/lib/error-suppression';

export function AppInitializer() {
  useEffect(() => {
    initializeErrorSuppression();
    initializeChunkErrorRecovery({
      maxReloadAttempts: 3,
      reloadDelay: 1000,
    });
    initializeGlobalErrorHandlers();
    resetReloadAttempts();
  }, []);

  return null;
}
