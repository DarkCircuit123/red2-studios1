/**
 * Portfolio Update Endpoint
 * Updates portfolio items with new Wix media URLs after migration
 */

import type { APIRoute } from 'astro';

interface UpdateRequest {
  itemId: string;
  updates: Record<string, string>;
}

export const POST: APIRoute = async ({ request }) => {
  try {
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
    const { Portfolio } = await import('@/entities/index');

    // Prepare update object
    const updateData: Partial<Portfolio> = {
      _id: itemId,
      ...updates,
    };

    // Update the portfolio item
    await BaseCrudService.update<Portfolio>('portfolio', updateData);

    console.log(`[PORTFOLIO_UPDATE] Successfully updated portfolio item ${itemId}`);

    return new Response(
      JSON.stringify({
        success: true,
        itemId,
        updatedFields: Object.keys(updates),
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
