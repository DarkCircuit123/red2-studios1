import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

/**
 * PORTFOLIO SLOT UPSERT API
 * 
 * Implements the critical upsert logic for 90-slot gallery:
 * 1. Query portfolioimages collection by displayOrder (slot number)
 * 2. If record exists → UPDATE with new image URL
 * 3. If no record exists → INSERT new record with displayOrder
 * 
 * This ensures empty slots can create their first CMS record without requiring an _id.
 * 
 * Request body:
 * {
 *   displayOrder: number,        // Slot number (1-90)
 *   image: string,               // Wix Media URL
 *   caption?: string,            // Optional caption
 *   altText?: string,            // Optional alt text
 *   portfolioItemId?: string     // Optional portfolio item ID
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   itemId: string,              // The _id of the created/updated record
 *   action: 'created' | 'updated',
 *   displayOrder: number
 * }
 */

interface UpsertRequest {
  displayOrder: number;
  image: string;
  caption?: string;
  altText?: string;
  portfolioItemId?: string;
}

interface UpsertResponse {
  success: true;
  itemId: string;
  action: 'created' | 'updated';
  displayOrder: number;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export const POST: APIRoute = async (context) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Check admin authentication
    const denied = await requireAdmin(context.cookies, context.request, 'portfolio-upsert');
    if (denied) return denied;

    console.log(`[PORTFOLIO_UPSERT] Request ${requestId} started`, {
      timestamp: new Date().toISOString(),
    });

    // Parse request body
    let body: UpsertRequest;
    try {
      body = await context.request.json();
    } catch (parseError) {
      console.warn(`[PORTFOLIO_UPSERT] Request ${requestId} invalid JSON`, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid request body',
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate required fields
    if (!body.displayOrder || !body.image) {
      console.warn(`[PORTFOLIO_UPSERT] Request ${requestId} missing required fields`, {
        displayOrder: body.displayOrder,
        hasImage: !!body.image,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: displayOrder, image',
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate displayOrder is in valid range (1-90)
    if (body.displayOrder < 1 || body.displayOrder > 90) {
      console.warn(`[PORTFOLIO_UPSERT] Request ${requestId} invalid displayOrder`, {
        displayOrder: body.displayOrder,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: `Invalid displayOrder: must be between 1 and 90, received ${body.displayOrder}`,
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[PORTFOLIO_UPSERT] Request ${requestId} validated`, {
      displayOrder: body.displayOrder,
      imageLength: body.image.length,
      hasCaption: !!body.caption,
      hasAltText: !!body.altText,
      timestamp: new Date().toISOString(),
    });

    // CRITICAL: Query by displayOrder to find existing record
    console.log(`[PORTFOLIO_UPSERT] Request ${requestId} querying for existing record`, {
      displayOrder: body.displayOrder,
      timestamp: new Date().toISOString(),
    });

    let existingRecord: Portfolio | undefined;
    try {
      const result = await BaseCrudService.getAll<Portfolio>(
        'portfolioimages',
        {},
        { limit: 1000 }
      );
      
      existingRecord = result.items?.find(item => item.displayOrder === body.displayOrder);
      
      console.log(`[PORTFOLIO_UPSERT] Request ${requestId} query completed`, {
        totalRecords: result.items?.length || 0,
        foundExisting: !!existingRecord,
        existingId: existingRecord?._id,
        timestamp: new Date().toISOString(),
      });
    } catch (queryError) {
      console.error(`[PORTFOLIO_UPSERT] Request ${requestId} query failed`, {
        error: queryError instanceof Error ? queryError.message : String(queryError),
        timestamp: new Date().toISOString(),
      });
      throw queryError;
    }

    let itemId: string;
    let action: 'created' | 'updated';

    if (existingRecord && existingRecord._id) {
      // PATH B: OCCUPIED SLOT - UPDATE existing record
      console.log(`[PORTFOLIO_UPSERT] Request ${requestId} PATH B: updating existing record`, {
        itemId: existingRecord._id,
        displayOrder: body.displayOrder,
        timestamp: new Date().toISOString(),
      });

      try {
        await BaseCrudService.update<Portfolio>('portfolioimages', {
          _id: existingRecord._id,
          image: body.image,
          caption: body.caption || existingRecord.caption || '',
          altText: body.altText || existingRecord.altText || '',
          displayOrder: body.displayOrder,
          portfolioItemId: body.portfolioItemId || existingRecord.portfolioItemId || '',
        });

        itemId = existingRecord._id;
        action = 'updated';

        console.log(`[PORTFOLIO_UPSERT] Request ${requestId} update successful`, {
          itemId,
          displayOrder: body.displayOrder,
          timestamp: new Date().toISOString(),
        });
      } catch (updateError) {
        console.error(`[PORTFOLIO_UPSERT] Request ${requestId} update failed`, {
          itemId: existingRecord._id,
          error: updateError instanceof Error ? updateError.message : String(updateError),
          timestamp: new Date().toISOString(),
        });
        throw updateError;
      }
    } else {
      // PATH A: EMPTY SLOT - CREATE new record
      console.log(`[PORTFOLIO_UPSERT] Request ${requestId} PATH A: creating new record`, {
        displayOrder: body.displayOrder,
        timestamp: new Date().toISOString(),
      });

      itemId = crypto.randomUUID();

      const newRecord: Portfolio = {
        _id: itemId,
        displayOrder: body.displayOrder,
        image: body.image,
        caption: body.caption || '',
        altText: body.altText || '',
        portfolioItemId: body.portfolioItemId || 'work-gallery',
      };

      try {
        await BaseCrudService.create('portfolioimages', newRecord);
        action = 'created';

        console.log(`[PORTFOLIO_UPSERT] Request ${requestId} create successful`, {
          itemId,
          displayOrder: body.displayOrder,
          timestamp: new Date().toISOString(),
        });
      } catch (createError) {
        console.error(`[PORTFOLIO_UPSERT] Request ${requestId} create failed`, {
          itemId,
          error: createError instanceof Error ? createError.message : String(createError),
          timestamp: new Date().toISOString(),
        });
        throw createError;
      }
    }

    const duration = Date.now() - startTime;

    console.log(`[PORTFOLIO_UPSERT] Request ${requestId} completed successfully`, {
      itemId,
      action,
      displayOrder: body.displayOrder,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        itemId,
        action,
        displayOrder: body.displayOrder,
      } as UpsertResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    console.error(`[PORTFOLIO_UPSERT] Request ${requestId} failed`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    const errorMessage = error instanceof Error ? error.message : 'Upsert failed';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
