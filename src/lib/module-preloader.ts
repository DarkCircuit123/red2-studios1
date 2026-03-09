/**
 * Module Preloader
 * Preloads critical modules on app initialization to prevent loading delays
 */

import { loadModuleWithRetry } from './module-loader';

interface PreloadConfig {
  critical: Array<{ importFn: () => Promise<any>; name: string }>;
  deferred: Array<{ importFn: () => Promise<any>; name: string }>;
}

let preloadInitialized = false;

/**
 * Initialize module preloading
 */
export async function initializeModulePreloading(config: PreloadConfig) {
  if (preloadInitialized) return;
  preloadInitialized = true;

  // Preload critical modules immediately
  console.log('[ModulePreloader] Loading critical modules...');
  const criticalPromises = config.critical.map(({ importFn, name }) =>
    loadModuleWithRetry(importFn, name)
      .catch(err => console.warn(`[ModulePreloader] Failed to preload critical module ${name}:`, err))
  );

  await Promise.all(criticalPromises);

  // Defer non-critical modules to idle time
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      console.log('[ModulePreloader] Loading deferred modules...');
      config.deferred.forEach(({ importFn, name }) => {
        loadModuleWithRetry(importFn, name)
          .catch(err => console.warn(`[ModulePreloader] Failed to preload deferred module ${name}:`, err));
      });
    });
  } else {
    // Fallback for browsers without requestIdleCallback
    setTimeout(() => {
      console.log('[ModulePreloader] Loading deferred modules (fallback)...');
      config.deferred.forEach(({ importFn, name }) => {
        loadModuleWithRetry(importFn, name)
          .catch(err => console.warn(`[ModulePreloader] Failed to preload deferred module ${name}:`, err));
      });
    }, 2000);
  }
}
