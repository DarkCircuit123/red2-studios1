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

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function loadModuleWithRetry<T = any>(
  importFn: () => Promise<T>,
  moduleName: string,
  config: Partial<RetryConfig> = {}
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  
  if (moduleCache[moduleName]) {
    return moduleCache[moduleName];
  }

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
          `Attempt ${attempt + 1}/${finalConfig.maxRetries + 1} failed for ${moduleName}. Retrying in ${delay}ms...`,
          lastError.message
        );
        await sleep(delay);
        delay *= finalConfig.backoffMultiplier;
      }
    }
  }

  failedModules.add(moduleName);
  delete moduleCache[moduleName];
  
  throw new Error(
    `Failed to load module ${moduleName} after ${finalConfig.maxRetries + 1} attempts: ${lastError?.message}`
  );
}

export async function preloadModules(
  modules: Array<{ importFn: () => Promise<any>; name: string }>
): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  
  const promises = modules.map(async ({ importFn, name }) => {
    try {
      const module = await loadModuleWithRetry(importFn, name);
      results.set(name, module);
    } catch (error) {
      console.error(`Failed to preload ${name}:`, error);
      results.set(name, null);
    }
  });

  await Promise.all(promises);
  return results;
}

export function clearModuleCache(): void {
  Object.keys(moduleCache).forEach(key => delete moduleCache[key]);
  failedModules.clear();
}

export function getModuleLoaderStats() {
  return {
    cachedModules: Object.keys(moduleCache).length,
    failedModules: failedModules.size,
    totalAttempts: Object.keys(moduleCache).length + failedModules.size,
  };
}
