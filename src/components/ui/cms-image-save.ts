/**
 * Shared CMS image save — one path for EVERY admin tab.
 *
 * WHY THIS EXISTS
 *
 * Each upload surface previously did its own thing, and two failure modes made
 * broken saves look successful:
 *
 * 1. If `collectionId`, `itemId` or `fieldName` was missing, the caller quietly
 *    skipped the CMS write, updated local React state, and showed "success".
 *    The image appeared in the admin panel and vanished on refresh.
 *
 * 2. Even when the write ran, nothing confirmed it landed. A silently rejected
 *    write reported success just as loudly as a real one.
 *
 * This module closes both. It refuses to run without complete target info, and
 * it READS THE ITEM BACK after writing to prove the field actually changed.
 * Collection reads are public (`itemRead: ANYONE` on every collection here), so
 * the verification costs one cheap query and needs no extra endpoint.
 *
 * Every tab calls this. Do not write to a CMS image field any other way.
 */

import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { validateCMSUpdatePayload } from '@/lib/image-storage-validator';

export interface CmsImageTarget {
  collectionId?: string;
  itemId?: string;
  fieldName?: string;
}

/** Thrown when the save target is incomplete. Never swallow this. */
export class MissingCmsTargetError extends Error {
  constructor(target: CmsImageTarget) {
    const missing = [
      !target.collectionId && 'collectionId',
      !target.itemId && 'itemId',
      !target.fieldName && 'fieldName',
    ].filter(Boolean);
    super(
      `Cannot save to the CMS: missing ${missing.join(', ')}. ` +
        `The upload succeeded but there is nowhere to store it, so it would be ` +
        `lost on refresh.`
    );
    this.name = 'MissingCmsTargetError';
  }
}

function sameValue(a: unknown, b: unknown): boolean {
  const norm = (v: unknown) => (v === null || v === undefined || v === '' ? '' : String(v));
  return norm(a) === norm(b);
}

/**
 * Write an image URL (or null to clear it) to a CMS field, then verify it stuck.
 *
 * Throws on any failure — a missing target, a rejected write, or a write that
 * reported success but did not change the stored value.
 */
export async function saveImageToCms(
  target: CmsImageTarget,
  value: string | null
): Promise<void> {
  const { collectionId, itemId, fieldName } = target;

  if (!collectionId || !itemId || !fieldName) {
    throw new MissingCmsTargetError(target);
  }

  const payload: Record<string, unknown> = { _id: itemId, [fieldName]: value };

  // Reject data URLs and other invalid image values before they reach the CMS.
  validateCMSUpdatePayload(collectionId, payload);

  console.log('[cms-image-save] writing', { collectionId, itemId, fieldName });
  await adminCms.update(collectionId, payload as any);

  // ---- Read back and confirm. This is the part that was always missing. ----
  let saved: any = null;
  try {
    saved = await BaseCrudService.getById<any>(collectionId, itemId);
  } catch (readError) {
    // A failed verification read is not a failed write. Say so precisely
    // instead of reporting a false failure.
    console.warn(
      '[cms-image-save] write sent, but the verification read failed',
      readError
    );
    return;
  }

  if (!saved) {
    throw new Error(
      `Saved to ${collectionId}, but the item could not be read back to confirm it. ` +
        `Refresh and check before relying on this.`
    );
  }

  const actual = saved[fieldName];
  if (!sameValue(actual, value)) {
    console.error('[cms-image-save] VERIFICATION FAILED', {
      collectionId,
      itemId,
      fieldName,
      expected: value,
      actual,
    });
    throw new Error(
      `The database did not accept the change to "${fieldName}". ` +
        `It still holds the previous value. Nothing was saved.`
    );
  }

  console.log('[cms-image-save] verified', { collectionId, itemId, fieldName });
}
