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

// Re-export BaseCrudService for direct use (server-side only)
export const BaseCrudService = WixBaseCrudService;

export const cmsService = {
  /**
   * Get all items from a collection
   * SERVER-SIDE ONLY - Do not call from client components
   */
  getAll: async <T>(
    collectionId: string,
    refs?: { singleRef?: string[]; multiRef?: string[] },
    options?: { limit?: number; skip?: number; suppressAuth?: boolean }
  ) => {
    try {
      // Ensure refs is always an object, never undefined
      const refsParam = refs || {};
      const optionsParam = options || { limit: 50 };
      return await WixBaseCrudService.getAll<T>(collectionId, refsParam, optionsParam);
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
