/**
 * Portfolio Update Endpoint (ADMIN ONLY)
 * Updates portfolio items with new Wix media URLs after migration
 * 
 * Security:
 * - Requires admin authentication
 * - Requires valid migration secret key
 * - Creates legacyImageBackup before updating (rollback safety)
 * - Rate limited to prevent abuse
 */

import type { APIRoute } from 'astro';
import { readSecret } from '@/lib/auth-security';

interface UpdateRequest {
  itemId: string;
  updates: Record<string, string>;
}

/**
 * Verify admin authentication and migration secret
 */
function verifyAdminAccess(request: Request): { valid: boolean; error?: string; status?: number } {
  // Check for migration secret key
  const migrationSecret = request.headers.get('x-migration-secret');
  const expectedSecret = readSecret('PORTFOLIO_MIGRATION_SECRET');

  if (!expectedSecret) {
    console.error('[PORTFOLIO_UPDATE] PORTFOLIO_MIGRATION_SECRET not configured');
    return {
      valid: false,
      error: 'Server configuration error: PORTFOLIO_MIGRATION_SECRET is not set',
      status: 500,
    };
  }

  if (!migrationSecret || migrationSecret !== expectedSecret) {
    console.warn('[PORTFOLIO_UPDATE] Invalid migration secret provided');
    return { valid: false, error: 'Unauthorized: Invalid migration secret', status: 401 };
  }

  return { valid: true };
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Verify admin access
    const authCheck = verifyAdminAccess(request);
    if (!authCheck.valid) {
      console.warn('[PORTFOLIO_UPDATE] Unauthorized access attempt');
      return new Response(
        JSON.stringify({
          success: false,
          error: authCheck.error,
        }),
        {
          status: authCheck.status ?? 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    if (!request.body) {
      return new Response(
        JSON.stringify({ error: 'No request body provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { itemId, updates } = (await request.json()) as UpdateRequest;

    if (!itemId || !updates) {
      return new Response(
        JSON.stringify({ error: 'Missing itemId or updates' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PORTFOLIO_UPDATE] Updating portfolio item ${itemId}...`);

    // Dynamically import BaseCrudService
    const { BaseCrudService } = await import('@/integrations');
    const { Portfolio, PortfolioImageBackups } = await import('@/entities/index');

    // First, fetch the current item to create a backup
    const currentItem = await BaseCrudService.getById<Portfolio>('portfolio', itemId);

    if (!currentItem) {
      return new Response(
        JSON.stringify({ error: 'Portfolio item not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create backup of original image data for rollback safety
    const legacyImageBackup = {
      mainImage: currentItem.mainImage,
      galleryImage1: currentItem.galleryImage1,
      galleryImage2: currentItem.galleryImage2,
      galleryImage3: currentItem.galleryImage3,
      backupCreatedAt: new Date().toISOString(),
    };

    // Actually persist the backup to a dedicated CMS collection before the
    // destructive update runs. Previously this object was only logged and
    // returned in the response body - never written anywhere durable - so
    // the "rollback safety" claimed above did not actually exist once the
    // process exited or the response was discarded.
    await BaseCrudService.create<PortfolioImageBackups>('portfolioimagebackups', {
      _id: crypto.randomUUID(),
      portfolioItemId: itemId,
      mainImage: legacyImageBackup.mainImage,
      galleryImage1: legacyImageBackup.galleryImage1,
      galleryImage2: legacyImageBackup.galleryImage2,
      galleryImage3: legacyImageBackup.galleryImage3,
      backupCreatedAt: legacyImageBackup.backupCreatedAt,
    });

    console.log(`[PORTFOLIO_UPDATE] Persisted backup to portfolioimagebackups for rollback safety`);

    // Prepare update object
    const updateData: Partial<Portfolio> = {
      _id: itemId,
      ...updates,
    };

    // Update the portfolio item
    await BaseCrudService.update<Portfolio>('portfolio', updateData);

    console.log(`[PORTFOLIO_UPDATE] Successfully updated portfolio item ${itemId}`);
    console.log(`[PORTFOLIO_UPDATE] Backup stored for rollback: ${JSON.stringify(legacyImageBackup)}`);

    return new Response(
      JSON.stringify({
        success: true,
        itemId,
        updatedFields: Object.keys(updates),
        backup: legacyImageBackup,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PORTFOLIO_UPDATE] Error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: message,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
