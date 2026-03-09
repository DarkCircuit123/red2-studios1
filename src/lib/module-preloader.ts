import { loadModuleWithRetry } from './module-loader';

interface PreloadConfig {
  critical: Array<{ importFn: () => Promise<any>; name: string }>;
  deferred: Array<{ importFn: () => Promise<any>; name: string }>;
}

let preloadInitialized = false;

export async function initializeModulePreloading(config: PreloadConfig) {
  if (preloadInitialized) return;
  preloadInitialized = true;

  console.log('Loading critical modules...');
  const criticalPromises = config.critical.map(({ importFn, name }) =>
    loadModuleWithRetry(importFn, name)
      .catch(err => console.warn(`Failed to preload critical module ${name}:`, err))
  );

  await Promise.all(criticalPromises);

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      console.log('Loading deferred modules...');
      config.deferred.forEach(({ importFn, name }) => {
        loadModuleWithRetry(importFn, name)
          .catch(err => console.warn(`Failed to preload deferred module ${name}:`, err));
      });
    });
  } else {
    setTimeout(() => {
      console.log('Loading deferred modules (fallback)...');
      config.deferred.forEach(({ importFn, name }) => {
        loadModuleWithRetry(importFn, name)
          .catch(err => console.warn(`Failed to preload deferred module ${name}:`, err));
      });
    }, 2000);
  }
}
