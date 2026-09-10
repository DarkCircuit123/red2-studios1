import { BaseCrudService } from '@/integrations';

/**
 * POST /api/admin/blog-delete-media
 * 
 * Deletes blog media (photos, videos, music) from their respective collections.
 * 
 * REQUEST BODY:
 * {
 *   "mediaType": "photo" | "video" | "music",
 *   "mediaId": "the-media-_id"
 * }
 * 
 * SUCCESS RESPONSE (200):
 * {
 *   "success": true,
 *   "deleted": 1,
 *   "id": "THE_DELETED_ID"
 * }
 * 
 * FAILURE RESPONSE (400/404/500):
 * {
 *   "success": false,
 *   "deleted": 0,
 *   "id": "THE_ID",
 *   "error": "ACTUAL_ERROR_MESSAGE"
 * }
 */

export async function POST({ request }: { request: Request }) {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    console.log(`[BLOG-DELETE-MEDIA:${requestId}] ===== DELETE MEDIA REQUEST RECEIVED =====`);
    
    // Parse request body
    let body: any = {};
    try {
      const text = await request.text();
      if (text) {
        body = JSON.parse(text);
      }
    } catch (parseErr) {
      console.error(`[BLOG-DELETE-MEDIA:${requestId}] ✗ Failed to parse request body:`, parseErr);
      return new Response(
        JSON.stringify({
          success: false,
          deleted: 0,
          id: null,
          error: 'Invalid request body: must be valid JSON',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const { mediaType, mediaId } = body;

    // Validate mediaType
    const validMediaTypes = ['photo', 'video', 'music'];
    if (!mediaType || !validMediaTypes.includes(mediaType)) {
      console.error(`[BLOG-DELETE-MEDIA:${requestId}] ✗ Invalid mediaType:`, mediaType);
      return new Response(
        JSON.stringify({
          success: false,
          deleted: 0,
          id: null,
          error: `Invalid mediaType: must be one of ${validMediaTypes.join(', ')}`,
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate mediaId
    if (!mediaId || typeof mediaId !== 'string' || mediaId.trim().length === 0) {
      console.error(`[BLOG-DELETE-MEDIA:${requestId}] ✗ Invalid mediaId:`, mediaId);
      return new Response(
        JSON.stringify({
          success: false,
          deleted: 0,
          id: mediaId || null,
          error: 'Invalid request: mediaId must be a non-empty string',
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Map mediaType to collection name
    const collectionMap: Record<string, string> = {
      photo: 'blogphotos',
      video: 'blogvideos',
      music: 'blogmusic',
    };
    const collectionId = collectionMap[mediaType];

    console.log(`[BLOG-DELETE-MEDIA:${requestId}] Deleting ${mediaType} from '${collectionId}': ${mediaId}`);

    // Verify the item exists before deletion
    let existingMedia: any = null;
    try {
      existingMedia = await BaseCrudService.getById(collectionId, mediaId);
      console.log(`[BLOG-DELETE-MEDIA:${requestId}] ✓ Media exists:`, {
        id: existingMedia?._id,
        title: existingMedia?.title,
      });
    } catch (checkErr) {
      const checkErrMsg = checkErr instanceof Error ? checkErr.message : String(checkErr);
      console.warn(`[BLOG-DELETE-MEDIA:${requestId}] ⚠ Media not found before deletion:`, checkErrMsg);
      return new Response(
        JSON.stringify({
          success: false,
          deleted: 0,
          id: mediaId,
          error: `Media not found: ${checkErrMsg}`,
        }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Delete the media using suppressAuth: true
    try {
      console.log(`[BLOG-DELETE-MEDIA:${requestId}] >>> Calling BaseCrudService.delete('${collectionId}', '${mediaId}', { suppressAuth: true })`);
      
      const deleteResult = await BaseCrudService.delete(collectionId, mediaId, { suppressAuth: true });
      
      console.log(`[BLOG-DELETE-MEDIA:${requestId}] ✓ Successfully deleted ${mediaType}:`, {
        id: mediaId,
        title: existingMedia?.title,
        deleteResult,
      });

      return new Response(
        JSON.stringify({
          success: true,
          deleted: 1,
          id: mediaId,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (deleteErr) {
      const deleteErrMsg = deleteErr instanceof Error ? deleteErr.message : String(deleteErr);
      console.error(`[BLOG-DELETE-MEDIA:${requestId}] ✗ Failed to delete ${mediaType}:`, {
        id: mediaId,
        error: deleteErrMsg,
        stack: deleteErr instanceof Error ? deleteErr.stack : undefined,
      });

      return new Response(
        JSON.stringify({
          success: false,
          deleted: 0,
          id: mediaId,
          error: `Failed to delete ${mediaType}: ${deleteErrMsg}`,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BLOG-DELETE-MEDIA:${requestId}] ✗ UNEXPECTED ERROR:`, {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        success: false,
        deleted: 0,
        id: null,
        error: `Unexpected error: ${errorMsg}`,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
