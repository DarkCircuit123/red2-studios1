import { BaseCrudService as WixBaseCrudService } from '@wix/codegen-framework-packages';

/**
 * CMS Service - Wrapper around BaseCrudService for type-safe operations
 */

// Re-export BaseCrudService for direct use
export const BaseCrudService = WixBaseCrudService;

export const cmsService = {
  /**
   * Get all items from a collection
   */
  getAll: async <T>(
    collectionId: string,
    refs?: { singleRef?: string[]; multiRef?: string[] },
    options?: { limit?: number; skip?: number }
  ) => {
    try {
      return await WixBaseCrudService.getAll<T>(collectionId, refs || {}, options);
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
    refs?: { singleRef?: string[]; multiRef?: string[] }
  ) => {
    try {
      return await WixBaseCrudService.getById<T>(collectionId, itemId, refs);
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
    multiRefs?: Record<string, string[]>
  ) => {
    try {
      return await WixBaseCrudService.create(collectionId, itemData, multiRefs);
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
    itemData: Partial<T> & { _id: string }
  ) => {
    try {
      return await WixBaseCrudService.update(collectionId, itemData);
    } catch (error) {
      console.error(`[CMS] Error updating in ${collectionId}:`, error);
      throw error;
    }
  },

  /**
   * Delete an item
   */
  delete: async (collectionId: string, itemId: string) => {
    try {
      return await WixBaseCrudService.delete(collectionId, itemId);
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
    refs: Record<string, string[]>
  ) => {
    try {
      return await WixBaseCrudService.addReferences(collectionId, itemId, refs);
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
    refs: Record<string, string[]>
  ) => {
    try {
      return await WixBaseCrudService.removeReferences(collectionId, itemId, refs);
    } catch (error) {
      console.error(`[CMS] Error removing references in ${collectionId}:`, error);
      throw error;
    }
  },
};
