import { auth } from '@wix/essentials';
import { items } from '@wix/data';

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
        console.log('[CMS_MUTATE] Creating item in collection:', {
          collectionId: request.collectionId,
          itemDataKeys: Object.keys(request.itemData),
          audio: request.itemData.audio,
          audioLength: request.itemData.audio?.length,
          audioIsHttps: request.itemData.audio?.startsWith('https://')
        });
        const result = await elevatedInsert(
          request.collectionId,
          request.itemData
        );
        console.log('[CMS_MUTATE] Create result:', {
          _id: result._id,
          audio: result.audio,
          audioLength: result.audio?.length,
          audioIsHttps: result.audio?.startsWith('https://')
        });
        return { success: true, data: result };
      }

      case 'update': {
        if (!request.itemData || !request.collectionId) {
          return { success: false, error: 'Missing itemData or collectionId' };
        }

        const itemId = request.itemId ?? request.itemData._id;
        if (!itemId) {
          return { success: false, error: 'Missing itemId' };
        }

        // items.update REPLACES the item. Passing a partial payload straight
        // through blanks every field the caller did not send - updating a
        // sponsor's logo would wipe its name. Read the current item and merge,
        // which is what BaseCrudService.update did client side.
        const elevatedGet = auth.elevate(items.get);
        const current = await elevatedGet(request.collectionId, itemId);
        if (!current) {
          return { success: false, error: 'Item not found' };
        }

        console.log('[CMS_MUTATE] Updating item in collection:', {
          collectionId: request.collectionId,
          itemId,
          currentAudio: current.audio,
          currentAudioLength: current.audio?.length,
          incomingAudio: request.itemData.audio,
          incomingAudioLength: request.itemData.audio?.length,
          incomingAudioIsHttps: request.itemData.audio?.startsWith('https://')
        });

        const merged = { ...current, ...request.itemData, _id: itemId };
        console.log('[CMS_MUTATE] Merged payload:', {
          audio: merged.audio,
          audioLength: merged.audio?.length,
          audioIsHttps: merged.audio?.startsWith('https://')
        });
        
        const result = await elevatedUpdate(request.collectionId, merged);
        console.log('[CMS_MUTATE] Update result:', {
          _id: result._id,
          audio: result.audio,
          audioLength: result.audio?.length,
          audioIsHttps: result.audio?.startsWith('https://')
        });
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
