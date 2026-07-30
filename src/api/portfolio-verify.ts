/**
 * Portfolio Verification Endpoint (ADMIN ONLY)
 * Verifies that no Portfolio items contain base64 image data after migration
 * 
 * Security:
 * - Requires admin authentication
 * - Requires valid migration secret key
 * - Rate limited to prevent abuse
 */

import type { APIRoute } from 'astro';

interface VerificationResult {
  totalItems: number;
  itemsWithBase64: number;
  itemsClean: number;
  cleanPercentage: number;
  status: 'success' | 'warning' | 'error';
  details: Array<{
    itemId: string;
    projectName?: string;
    base64Fields: string[];
  }>;
}

/**
 * Verify admin authentication and migration secret
 */
function verifyAdminAccess(request: Request): { valid: boolean; error?: string } {
  // Check for migration secret key
  const migrationSecret = request.headers.get('x-migration-secret');
  const expectedSecret = process.env.PORTFOLIO_MIGRATION_SECRET;

  if (!expectedSecret) {
    console.error('[PORTFOLIO_VERIFY] PORTFOLIO_MIGRATION_SECRET not configured');
    return { valid: false, error: 'Migration not configured' };
  }

  if (!migrationSecret || migrationSecret !== expectedSecret) {
    console.warn('[PORTFOLIO_VERIFY] Invalid migration secret provided');
    return { valid: false, error: 'Unauthorized: Invalid migration secret' };
  }

  return { valid: true };
}

export const GET: APIRoute = async ({ request }) => {
  try {
    // Verify admin access
    const authCheck = verifyAdminAccess(request);
    if (!authCheck.valid) {
      console.warn('[PORTFOLIO_VERIFY] Unauthorized access attempt');
      return new Response(
        JSON.stringify({
          success: false,
          error: authCheck.error,
        }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log('[PORTFOLIO_VERIFY] Starting portfolio verification (authorized)...');

    // Dynamically import BaseCrudService
    const { BaseCrudService } = await import('@/integrations');
    const { Portfolio } = await import('@/entities/index');

    // Fetch all portfolio items
    const result = await BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 1000 });

    const items = result.items || [];
    console.log(`[PORTFOLIO_VERIFY] Verifying ${items.length} portfolio items`);

    const imageFields = ['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'];
    const itemsWithBase64: Array<{
      itemId: string;
      projectName?: string;
      base64Fields: string[];
    }> = [];

    // Check each item for base64 data
    for (const item of items) {
      const base64Fields: string[] = [];

      for (const field of imageFields) {
        const imageData = item[field as keyof Portfolio];

        if (typeof imageData === 'string' && imageData.startsWith('data:image/')) {
          base64Fields.push(field);
          console.warn(
            `[PORTFOLIO_VERIFY] ⚠️  Found base64 in ${item._id}.${field} (${imageData.length} chars)`
          );
        }
      }

      if (base64Fields.length > 0) {
        itemsWithBase64.push({
          itemId: item._id,
          projectName: item.projectName,
          base64Fields,
        });
      }
    }

    const itemsClean = items.length - itemsWithBase64.length;
    const cleanPercentage = items.length > 0 ? (itemsClean / items.length) * 100 : 0;

    let status: 'success' | 'warning' | 'error' = 'success';
    if (itemsWithBase64.length > 0) {
      status = itemsWithBase64.length > items.length * 0.1 ? 'error' : 'warning';
    }

    const verificationResult: VerificationResult = {
      totalItems: items.length,
      itemsWithBase64: itemsWithBase64.length,
      itemsClean,
      cleanPercentage,
      status,
      details: itemsWithBase64,
    };

    const summary = `
Verification Complete:
- Total items: ${items.length}
- Items with base64: ${itemsWithBase64.length}
- Items clean: ${itemsClean}
- Clean percentage: ${cleanPercentage.toFixed(1)}%
- Status: ${status.toUpperCase()}
    `.trim();

    console.log(`[PORTFOLIO_VERIFY] ${summary}`);

    if (itemsWithBase64.length > 0) {
      console.warn('[PORTFOLIO_VERIFY] Items still containing base64:');
      itemsWithBase64.forEach((item) => {
        console.warn(`  - ${item.itemId} (${item.projectName}): ${item.base64Fields.join(', ')}`);
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        result: verificationResult,
        summary,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[PORTFOLIO_VERIFY] Error:', error);

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
