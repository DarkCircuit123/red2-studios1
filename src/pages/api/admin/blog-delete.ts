import { BaseCrudService } from '@/integrations';

/**
 * POST /api/admin/blog-delete
 * Deletes a blog post and all its associated media (photos, videos, music)
 * 
 * Uses BaseCrudService with suppressAuth to bypass collection-level permissions
 * because blog collections have ADMIN-only delete permissions.
 * 
 * CRITICAL: Must use BaseCrudService (server-side) not wixData (client-side)
 * wixData will crash the API route and return HTML instead of JSON
 */
export async function POST({ request }: { request: Request }) {
  try {
    let body: any;
    
    // Handle different request body formats
    if (request.body) {
      const text = await request.text();
      body = text ? JSON.parse(text) : {};
    } else {
      body = {};
    }

    const { postId, photoIds, videoIds, musicIds } = body;
    const deletedItems = {
      photos: 0,
      videos: 0,
      music: 0,
      posts: 0,
      errors: [] as string[],
    };

    // Delete associated photos
    if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
      for (const photoId of photoIds) {
        try {
          console.log(`[BLOG-DELETE] Deleting photo: ${photoId}`);
          await BaseCrudService.delete('blogphotos', photoId);
          deletedItems.photos++;
          console.log(`[BLOG-DELETE] Successfully deleted photo: ${photoId}`);
        } catch (err) {
          const errMsg = `Failed to delete photo ${photoId}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(`[BLOG-DELETE] ${errMsg}`, err);
          deletedItems.errors.push(errMsg);
        }
      }
    }

    // Delete associated videos
    if (videoIds && Array.isArray(videoIds) && videoIds.length > 0) {
      for (const videoId of videoIds) {
        try {
          console.log(`[BLOG-DELETE] Deleting video: ${videoId}`);
          await BaseCrudService.delete('blogvideos', videoId);
          deletedItems.videos++;
          console.log(`[BLOG-DELETE] Successfully deleted video: ${videoId}`);
        } catch (err) {
          const errMsg = `Failed to delete video ${videoId}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(`[BLOG-DELETE] ${errMsg}`, err);
          deletedItems.errors.push(errMsg);
        }
      }
    }

    // Delete associated music
    if (musicIds && Array.isArray(musicIds) && musicIds.length > 0) {
      for (const musicId of musicIds) {
        try {
          console.log(`[BLOG-DELETE] Deleting music: ${musicId}`);
          await BaseCrudService.delete('blogmusic', musicId);
          deletedItems.music++;
          console.log(`[BLOG-DELETE] Successfully deleted music: ${musicId}`);
        } catch (err) {
          const errMsg = `Failed to delete music ${musicId}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(`[BLOG-DELETE] ${errMsg}`, err);
          deletedItems.errors.push(errMsg);
        }
      }
    }

    // Delete the post itself (if postId is provided)
    if (postId) {
      try {
        console.log(`[BLOG-DELETE] Deleting blog post: ${postId}`);
        await BaseCrudService.delete('blogposts', postId);
        deletedItems.posts++;
        console.log(`[BLOG-DELETE] Successfully deleted blog post: ${postId}`);
      } catch (err) {
        const errMsg = `Failed to delete post ${postId}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`[BLOG-DELETE] ${errMsg}`, err);
        deletedItems.errors.push(errMsg);
      }
    }

    // If there were any errors, return them but still report success if at least one item was deleted
    if (deletedItems.errors.length > 0 && deletedItems.photos + deletedItems.videos + deletedItems.music + deletedItems.posts === 0) {
      console.error(`[BLOG-DELETE] All deletions failed:`, deletedItems.errors);
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Failed to delete any items',
          details: deletedItems,
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`[BLOG-DELETE] Deletion complete:`, deletedItems);
    return new Response(JSON.stringify({ 
      success: true,
      deleted: deletedItems,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to delete blog content';
    console.error('[BLOG-DELETE] Unexpected error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
