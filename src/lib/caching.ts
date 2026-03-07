/**
 * Advanced caching strategies for optimal performance
 * Implements LRU cache, request deduplication, and cache invalidation
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

/**
 * LRU (Least Recently Used) Cache implementation
 * Automatically evicts least recently used items when capacity is reached
 */
export class LRUCache<K, V> {
  private cache: Map<K, CacheEntry<V>> = new Map();
  private maxSize: number;
  private defaultTTL: number;

  constructor(maxSize = 100, defaultTTL = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL;
  }

  set(key: K, value: V, ttl = this.defaultTTL): void {
    // Remove existing entry to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Add new entry
    this.cache.set(key, {
      data: value,
      timestamp: Date.now(),
      ttl,
    });

    // Evict oldest entry if cache is full
    if (this.cache.size > this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
  }

  get(key: K): V | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check if entry has expired
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.data;
  }

  has(key: K): boolean {
    return this.get(key) !== null;
  }

  delete(key: K): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size;
  }
}

/**
 * Request deduplication cache
 * Prevents duplicate API calls for the same resource
 */
export class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  async execute<T>(
    key: string,
    request: () => Promise<T>
  ): Promise<T> {
    // Return existing pending request if available
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)!;
    }

    // Create new request
    const promise = request()
      .then((result) => {
        this.pendingRequests.delete(key);
        return result;
      })
      .catch((error) => {
        this.pendingRequests.delete(key);
        throw error;
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  clear(): void {
    this.pendingRequests.clear();
  }
}

/**
 * Multi-level cache with fallback strategy
 */
export class MultiLevelCache<K, V> {
  private l1Cache: LRUCache<K, V>; // Memory cache
  private l2Cache: Map<string, V> = new Map(); // LocalStorage cache
  private l1Size: number;
  private l1TTL: number;

  constructor(l1Size = 50, l1TTL = 5 * 60 * 1000) {
    this.l1Cache = new LRUCache(l1Size, l1TTL);
    this.l1Size = l1Size;
    this.l1TTL = l1TTL;
  }

  set(key: K, value: V): void {
    const keyStr = String(key);

    // Set in L1 cache
    this.l1Cache.set(key, value, this.l1TTL);

    // Set in L2 cache (localStorage)
    try {
      this.l2Cache.set(keyStr, value);
      localStorage.setItem(`cache_${keyStr}`, JSON.stringify(value));
    } catch (error) {
      console.warn('Failed to set L2 cache:', error);
    }
  }

  get(key: K): V | null {
    const keyStr = String(key);

    // Try L1 cache first
    const l1Result = this.l1Cache.get(key);
    if (l1Result !== null) {
      return l1Result;
    }

    // Try L2 cache
    try {
      const l2Result = this.l2Cache.get(keyStr);
      if (l2Result !== undefined) {
        // Restore to L1 cache
        this.l1Cache.set(key, l2Result, this.l1TTL);
        return l2Result;
      }

      // Try localStorage
      const stored = localStorage.getItem(`cache_${keyStr}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.l1Cache.set(key, parsed, this.l1TTL);
        this.l2Cache.set(keyStr, parsed);
        return parsed;
      }
    } catch (error) {
      console.warn('Failed to get L2 cache:', error);
    }

    return null;
  }

  clear(): void {
    this.l1Cache.clear();
    this.l2Cache.clear();
    try {
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith('cache_')) {
          localStorage.removeItem(key);
        }
      });
    } catch (error) {
      console.warn('Failed to clear L2 cache:', error);
    }
  }
}

/**
 * Cache invalidation manager
 */
export class CacheInvalidationManager {
  private dependencies: Map<string, Set<string>> = new Map();
  private invalidationCallbacks: Map<string, Set<() => void>> = new Map();

  registerDependency(key: string, dependsOn: string[]): void {
    dependsOn.forEach((dep) => {
      if (!this.dependencies.has(dep)) {
        this.dependencies.set(dep, new Set());
      }
      this.dependencies.get(dep)!.add(key);
    });
  }

  onInvalidate(key: string, callback: () => void): void {
    if (!this.invalidationCallbacks.has(key)) {
      this.invalidationCallbacks.set(key, new Set());
    }
    this.invalidationCallbacks.get(key)!.add(callback);
  }

  invalidate(key: string): void {
    // Call callbacks for this key
    const callbacks = this.invalidationCallbacks.get(key);
    if (callbacks) {
      callbacks.forEach((cb) => cb());
    }

    // Invalidate dependent keys
    const dependents = this.dependencies.get(key);
    if (dependents) {
      dependents.forEach((dep) => this.invalidate(dep));
    }
  }

  clear(): void {
    this.dependencies.clear();
    this.invalidationCallbacks.clear();
  }
}

// Global cache instances
export const globalCache = new LRUCache(100, 5 * 60 * 1000);
export const requestDeduplicator = new RequestDeduplicator();
export const multiLevelCache = new MultiLevelCache(50, 5 * 60 * 1000);
export const cacheInvalidationManager = new CacheInvalidationManager();
