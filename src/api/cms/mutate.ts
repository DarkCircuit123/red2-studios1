import { auth } from 'wix-sdk';
import { items } from 'wix-data';

interface MutationRequest {
  action: 'create' | 'update' | 'delete' | 'addReferences' | 'removeReferences';
  collectionId: string;
  itemData?: Record<string, any>;
  itemId?: string;
  multiRefs?: Record<string, string[]>;
}

interface MutationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function mutate(request: MutationRequest): Promise<MutationResponse> {
  try {
    // Elevate to admin context for server-side mutations
    const elevatedAuth = auth.elevate();

    switch (request.action) {
      case 'create': {
        if (!request.itemData || !request.collectionId) {
          return { success: false, error: 'Missing itemData or collectionId' };
        }
        const result = await items.insertItem(
          request.collectionId,
          request.itemData,
          { suppressAuth: false }
        );
        return { success: true, data: result };
      }

      case 'update': {
        if (!request.itemData || !request.collectionId) {
          return { success: false, error: 'Missing itemData or collectionId' };
        }
        const result = await items.updateItem(
          request.collectionId,
          request.itemData,
          { suppressAuth: false }
        );
        return { success: true, data: result };
      }

      case 'delete': {
        if (!request.itemId || !request.collectionId) {
          return { success: false, error: 'Missing itemId or collectionId' };
        }
        const result = await items.removeItem(
          request.collectionId,
          request.itemId,
          { suppressAuth: false }
        );
        return { success: true, data: result };
      }

      case 'addReferences': {
        if (!request.itemId || !request.collectionId || !request.multiRefs) {
          return { success: false, error: 'Missing itemId, collectionId, or multiRefs' };
        }
        // Add references by updating the item with the multi-ref fields
        const updateData: Record<string, any> = { _id: request.itemId };
        Object.entries(request.multiRefs).forEach(([field, refs]) => {
          updateData[field] = refs;
        });
        const result = await items.updateItem(
          request.collectionId,
          updateData,
          { suppressAuth: false }
        );
        return { success: true, data: result };
      }

      case 'removeReferences': {
        if (!request.itemId || !request.collectionId || !request.multiRefs) {
          return { success: false, error: 'Missing itemId, collectionId, or multiRefs' };
        }
        // Remove references by updating the item with empty arrays
        const updateData: Record<string, any> = { _id: request.itemId };
        Object.entries(request.multiRefs).forEach(([field]) => {
          updateData[field] = [];
        });
        const result = await items.updateItem(
          request.collectionId,
          updateData,
          { suppressAuth: false }
        );
        return { success: true, data: result };
      }

      default:
        return { success: false, error: 'Unknown action' };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}
