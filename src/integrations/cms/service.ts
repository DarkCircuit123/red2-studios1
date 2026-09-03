import { BaseCrudService as WixBaseCrudService } from '@wix/codegen-framework-packages';

/**
 * CMS Service - Wrapper around BaseCrudService for type-safe operations
 * 
 * CRITICAL: BaseCrudService is SERVER-SIDE ONLY
 * Client-side calls will fail with WDE0053
 * Use this service only in:
 * - API routes (src/api/*)
 * - Server-side functions
 * - Backend operations
 * 
 * For client-side CMS access, use fetch() to call API endpoints
 */

// Request deduplication and caching layer
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

// Separate caches for server and client to prevent data leakage
const serverRequestCache = new Map<string, Promise<any>>();
const serverResultCache = new Map<string, CacheEntry<any>>();
const clientRequestCache = new Map<string, Promise<any>>();
const clientResultCache = new Map<string, CacheEntry<any>>();

const CACHE_TTL_MS = 300000; // 5 minutes (increased from 60s)
const REQUEST_TIMEOUT_MS = 30000; // 30 second timeout for requests
const isBrowser = typeof window !== 'undefined';

function getCacheKey(
  collectionId: string,
  refs?: { singleRef?: string[]; multiRef?: string[] },
  options?: { limit?: number; skip?: number; suppressAuth?: boolean }
): string {
  return JSON.stringify({ collectionId, refs, options });
}

function isCacheValid<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL_MS;
}

// Wrap the original BaseCrudService.getAll with deduplication and caching
const originalGetAll = WixBaseCrudService.getAll.bind(WixBaseCrudService);

const dedupedGetAll = async function<T>(
  collectionId: string,
  refs?: { singleRef?: string[]; multiRef?: string[] },
  options?: { limit?: number; skip?: number; suppressAuth?: boolean }
) {
  // On the server, skip caching entirely to prevent cross-visitor data leakage
  if (!isBrowser) {
    return originalGetAll<T>(collectionId, refs || {}, options || { limit: 50 });
  }

  const cacheKey = getCacheKey(collectionId, refs, options);
  
  // Use client-side caches
  const requestCache = clientRequestCache;
  const resultCache = clientResultCache;

  // Check if we have a valid cached result
  const cachedResult = resultCache.get(cacheKey);
  if (cachedResult && isCacheValid(cachedResult)) {
    return cachedResult.data;
  }

  // Check if a request is already in flight for this key
  if (requestCache.has(cacheKey)) {
    return requestCache.get(cacheKey);
  }

  // Create a new request promise with timeout
  const requestPromise = (async () => {
    try {
      const refsParam = refs || {};
      const optionsParam = options || { limit: 50 };
      
      // Add timeout to prevent hanging requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('CMS request timeout')), REQUEST_TIMEOUT_MS)
      );
      
      const result = await Promise.race([
        originalGetAll<T>(collectionId, refsParam, optionsParam),
        timeoutPromise
      ]);
      
      // Cache the result
      resultCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });
      
      return result;
    } finally {
      // Remove from in-flight requests
      requestCache.delete(cacheKey);
    }
  })();

  // Store the in-flight promise
  requestCache.set(cacheKey, requestPromise);

  return requestPromise;
};

// Preserve every method on WixBaseCrudService (they live on its prototype,
// so object spread silently drops them) and override only getAll.
export const BaseCrudService = new Proxy(WixBaseCrudService as any, {
  get(target, prop, receiver) {
    if (prop === 'getAll') return dedupedGetAll;
    const value = Reflect.get(target, prop, receiver);
    return typeof value === 'function' ? value.bind(target) : value;
  },
}) as typeof WixBaseCrudService;

export const cmsService = {
  /**
   * Get all items from a collection
   * SERVER-SIDE ONLY - Do not call from client components
   * 
   * Includes automatic request deduplication and 60-second result caching.
   * Concurrent requests for the same collection+options will await the same promise.
   */
  getAll: async <T>(
    collectionId: string,
    refs?: { singleRef?: string[]; multiRef?: string[] },
    options?: { limit?: number; skip?: number; suppressAuth?: boolean }
  ) => {
    try {
      return await dedupedGetAll<T>(collectionId, refs, options);
    } catch (error) {
      console.error(`[CMS] Error fetching from ${collectionId}:`, error);
      throw error;
    }
  },

  /**
   * Get a single item by ID
   */
  getById: async <T>(
    collectionId: string,
    itemId: string,
    refs?: { singleRef?: string[]; multiRef?: string[] },
    options?: { suppressAuth?: boolean }
  ) => {
    try {
      return await WixBaseCrudService.getById<T>(collectionId, itemId, refs, options);
    } catch (error) {
      console.error(`[CMS] Error fetching ${itemId} from ${collectionId}:`, error);
      throw error;
    }
  },

  /**
   * Create a new item
   */
  create: async <T>(
    collectionId: string,
    itemData: T,
    multiRefs?: Record<string, string[]>,
    options?: { suppressAuth?: boolean }
  ) => {
    try {
      return await WixBaseCrudService.create(collectionId, itemData, multiRefs, options);
    } catch (error) {
      console.error(`[CMS] Error creating in ${collectionId}:`, error);
      throw error;
    }
  },

  /**
   * Update an item
   */
  update: async <T>(
    collectionId: string,
    itemData: Partial<T> & { _id: string },
    options?: { suppressAuth?: boolean }
  ) => {
    try {
      return await WixBaseCrudService.update(collectionId, itemData, options);
    } catch (error) {
      console.error(`[CMS] Error updating in ${collectionId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an item
   */
  delete: async (collectionId: string, itemId: string, options?: { suppressAuth?: boolean }) => {
    try {
      return await WixBaseCrudService.delete(collectionId, itemId, options);
    } catch (error) {
      console.error(`[CMS] Error deleting from ${collectionId}:`, error);
      throw error;
    }
  },

  /**
   * Add references to an item
   */
  addReferences: async (
    collectionId: string,
    itemId: string,
    refs: Record<string, string[]>,
    options?: { suppressAuth?: boolean }
  ) => {
    try {
      return await WixBaseCrudService.addReferences(collectionId, itemId, refs, options);
    } catch (error) {
      console.error(`[CMS] Error adding references in ${collectionId}:`, error);
      throw error;
    }
  },

  /**
   * Remove references from an item
   */
  removeReferences: async (
    collectionId: string,
    itemId: string,
    refs: Record<string, string[]>,
    options?: { suppressAuth?: boolean }
  ) => {
    try {
      return await WixBaseCrudService.removeReferences(collectionId, itemId, refs, options);
    } catch (error) {
      console.error(`[CMS] Error removing references in ${collectionId}:`, error);
      throw error;
    }
  },
};
