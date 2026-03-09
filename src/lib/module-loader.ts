/**
 * Advanced Module Loader with Retry Mechanism
 * Handles dynamic imports with automatic retry, caching, and fallback strategies
 */

interface ModuleCache {
  [key: string]: Promise<any>;
}

interface RetryConfig {
  maxRetries: number;
  delayMs: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  delayMs: 1000,
  backoffMultiplier: 2,
};

const moduleCache: ModuleCache = {};
const failedModules = new Set<string>();

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Load a module with retry mechanism
 */
export async function loadModuleWithRetry<T = any>(
  importFn: () => Promise<T>,
  moduleName: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  // Check cache first
  if (moduleCache[moduleName]) {
    return moduleCache[moduleName];
  }

  // If module previously failed, use cached failure
  if (failedModules.has(moduleName)) {
    throw new Error(`Module ${moduleName} has failed to load previously`);
  }

  let lastError: Error | null = null;
  let delay = finalConfig.delayMs;

  for (let attempt = 0; attempt <= finalConfig.maxRetries; attempt++) {
    try {
      const modulePromise = importFn();
      moduleCache[moduleName] = modulePromise;
      const result = await modulePromise;
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < finalConfig.maxRetries) {
        console.warn(
          `[ModuleLoader] Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} failed for ${moduleName}. Retrying in ${delay}ms...`,
          lastError.message
        );
        await sleep(delay);
        delay *= finalConfig.backoffMultiplier;
      }
    }
  }

  // Mark module as failed
  failedModules.add(moduleName);
  delete moduleCache[moduleName];
  
  throw new Error(
    `Failed to load module ${moduleName} after ${finalConfig.maxRetries + 1} attempts: ${lastError?.message}`
  );
}

/**
 * Preload multiple modules in parallel
 */
export async function preloadModules(
  modules: Array<{ importFn: () => Promise<any>; name: string }>
): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  
  const promises = modules.map(async ({ importFn, name }) => {
    try {
      const module = await loadModuleWithRetry(importFn, name);
      results.set(name, module);
    } catch (error) {
      console.error(`[ModuleLoader] Failed to preload ${name}:`, error);
      results.set(name, null);
    }
  });

  await Promise.all(promises);
  return results;
}

/**
 * Clear module cache (useful for testing or manual reset)
 */
export function clearModuleCache(): void {
  Object.keys(moduleCache).forEach(key => delete moduleCache[key]);
  failedModules.clear();
}

/**
 * Get cache statistics
 */
export function getModuleLoaderStats() {
  return {
    cachedModules: Object.keys(moduleCache).length,
    failedModules: failedModules.size,
    totalAttempts: Object.keys(moduleCache).length + failedModules.size,
  };
}
