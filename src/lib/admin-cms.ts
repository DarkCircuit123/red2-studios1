/**
 * Admin CMS utility for server-side mutations
 * Uses the /api/cms/mutate endpoint with auth.elevate() for secure writes
 */

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

/**
 * These calls THROW on failure, matching BaseCrudService's contract.
 *
 * The previous version caught its own throw and returned {success:false}.
 * Callers do `await adminCms.update(...)` inside a try/catch and treat a
 * non-throwing return as success, so every failed write was reported to the
 * user as "upload complete" while nothing was saved.
 */
async function callMutateAPI(request: MutationRequest): Promise<any> {
  const response = await fetch('/api/cms/mutate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    // The admin_session cookie must ride along or the endpoint returns 401.
    credentials: 'include',
    body: JSON.stringify(request),
  });

  const result = (await response.json().catch(() => ({}))) as MutationResponse;

  if (!response.ok || !result.success) {
    throw new Error(
      result.error || `CMS ${request.action} failed: HTTP ${response.status}`
    );
  }

  return result.data;
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
    if (!itemData?._id) {
      throw new Error(`${collectionId} _id is required for update`);
    }
    return callMutateAPI({
      action: 'update',
      collectionId,
      itemId: itemData._id,
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
};
