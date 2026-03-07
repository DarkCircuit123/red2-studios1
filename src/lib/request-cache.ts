/**
 * Smart request caching layer with automatic invalidation
 * Integrates with BaseCrudService for optimal performance
 */

import { requestDeduplicator, multiLevelCache, cacheInvalidationManager } from '@/lib/caching';

interface CacheConfig {
  ttl?: number;
  deduplicate?: boolean;
  invalidateOn?: string[];
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  deduplicate: true,
  invalidateOn: [],
};

/**
 * Cached request wrapper for BaseCrudService
 */
export class CachedRequestService {
  private config: CacheConfig;

  constructor(config: Partial<CacheConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Execute a request with caching
   */
  async execute<T>(
    key: string,
    request: () => Promise<T>,
    config?: Partial<CacheConfig>
  ): Promise<T> {
    const finalConfig = { ...this.config, ...config };

    // Check cache first
    const cached = multiLevelCache.get(key);
    if (cached !== null) {
      return cached as T;
    }

    // Execute request with deduplication
    const execute = async () => {
      const result = await request();
      multiLevelCache.set(key, result);
      return result;
    };

    if (finalConfig.deduplicate) {
      return requestDeduplicator.execute(key, execute);
    } else {
      return execute();
    }
  }

  /**
   * Invalidate cache entry
   */
  invalidate(key: string): void {
    multiLevelCache.get(key); // Trigger expiration check
    cacheInvalidationManager.invalidate(key);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    multiLevelCache.clear();
    requestDeduplicator.clear();
    cacheInvalidationManager.clear();
  }

  /**
   * Register cache dependencies for automatic invalidation
   */
  registerDependency(key: string, dependsOn: string[]): void {
    cacheInvalidationManager.registerDependency(key, dependsOn);
  }

  /**
   * Listen for cache invalidation
   */
  onInvalidate(key: string, callback: () => void): void {
    cacheInvalidationManager.onInvalidate(key, callback);
  }
}

// Global cached request service
export const cachedRequestService = new CachedRequestService();

/**
 * Hook-friendly cached request helper
 */
export async function cachedRequest<T>(
  key: string,
  request: () => Promise<T>,
  options?: Partial<CacheConfig>
): Promise<T> {
  return cachedRequestService.execute(key, request, options);
}

/**
 * Batch cache invalidation
 */
export function invalidateCache(keys: string[]): void {
  keys.forEach((key) => cachedRequestService.invalidate(key));
}
