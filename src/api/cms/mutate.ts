import { auth } from 'wix-sdk';
import { items } from 'wix-data';

interface MutationRequest {
  action: 'create' | 'update' | 'delete';
  collectionId: string;
  itemData?: Record<string, any>;
  itemId?: string;
}

interface MutationResponse {
  success: boolean;
  data?: any;
  error?: string;
}

export async function mutate(request: MutationRequest): Promise<MutationResponse> {
  try {
    // Elevate to admin context for server-side mutations
    const elevatedInsert = auth.elevate(items.insert);
    const elevatedUpdate = auth.elevate(items.update);
    const elevatedRemove = auth.elevate(items.remove);

    switch (request.action) {
      case 'create': {
        if (!request.itemData || !request.collectionId) {
          return { success: false, error: 'Missing itemData or collectionId' };
        }
        const result = await elevatedInsert(
          request.collectionId,
          request.itemData
        );
        return { success: true, data: result };
      }

      case 'update': {
        if (!request.itemData || !request.collectionId) {
          return { success: false, error: 'Missing itemData or collectionId' };
        }
        const result = await elevatedUpdate(
          request.collectionId,
          request.itemData
        );
        return { success: true, data: result };
      }

      case 'delete': {
        if (!request.itemId || !request.collectionId) {
          return { success: false, error: 'Missing itemId or collectionId' };
        }
        const result = await elevatedRemove(
          request.collectionId,
          request.itemId
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
