/**
 * Admin CMS utility for server-side mutations
 * Uses the /api/cms/mutate endpoint with auth.elevate() for secure writes
 */

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

async function callMutateAPI(request: MutationRequest): Promise<MutationResponse> {
  try {
    const response = await fetch('/api/cms/mutate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

export const adminCms = {
  async create(collectionId: string, itemData: Record<string, any>) {
    return callMutateAPI({
      action: 'create',
      collectionId,
      itemData,
    });
  },

  async update(collectionId: string, itemData: Record<string, any>) {
    return callMutateAPI({
      action: 'update',
      collectionId,
      itemData,
    });
  },

  async delete(collectionId: string, itemId: string) {
    return callMutateAPI({
      action: 'delete',
      collectionId,
      itemId,
    });
  },

  async addReferences(
    collectionId: string,
    itemId: string,
    multiRefs: Record<string, string[]>
  ) {
    return callMutateAPI({
      action: 'addReferences',
      collectionId,
      itemId,
      multiRefs,
    });
  },

  async removeReferences(
    collectionId: string,
    itemId: string,
    multiRefs: Record<string, string[]>
  ) {
    return callMutateAPI({
      action: 'removeReferences',
      collectionId,
      itemId,
      multiRefs,
    });
  },
};
