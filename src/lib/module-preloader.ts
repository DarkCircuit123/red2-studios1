import { loadModuleWithRetry } from './module-loader';
import { logger } from './debug-logger';

interface PreloadConfig {
  critical: Array<{ importFn: () => Promise<any>; name: string }>;
  deferred: Array<{ importFn: () => Promise<any>; name: string }>;
}

let preloadInitialized = false;

export async function initializeModulePreloading(config: PreloadConfig) {
  if (preloadInitialized) return;
  preloadInitialized = true;

  logger.debug('Loading critical modules...', {}, { module: 'ModulePreloader' });
  const criticalPromises = config.critical.map(({ importFn, name }) =>
    loadModuleWithRetry(importFn, name)
      .catch(err => logger.warn(`Failed to preload critical module ${name}:`, err, { module: 'ModulePreloader' }))
  );

  await Promise.all(criticalPromises);

  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      logger.debug('Loading deferred modules...', {}, { module: 'ModulePreloader' });
      config.deferred.forEach(({ importFn, name }) => {
        loadModuleWithRetry(importFn, name)
          .catch(err => logger.warn(`Failed to preload deferred module ${name}:`, err, { module: 'ModulePreloader' }));
      });
    });
  } else {
    setTimeout(() => {
      logger.debug('Loading deferred modules (fallback)...', {}, { module: 'ModulePreloader' });
      config.deferred.forEach(({ importFn, name }) => {
        loadModuleWithRetry(importFn, name)
          .catch(err => logger.warn(`Failed to preload deferred module ${name}:`, err, { module: 'ModulePreloader' }));
      });
    }, 2000);
  }
}
