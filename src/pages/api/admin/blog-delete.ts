import { BaseCrudService } from '@/integrations';

/**
 * POST /api/admin/blog-delete
 * Deletes a blog post and all its associated media (photos, videos, music)
 * 
 * Uses BaseCrudService with suppressAuth: true to bypass collection-level permissions
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
    
    console.log('[BLOG-DELETE] ===== DELETE REQUEST RECEIVED =====');
    console.log('[BLOG-DELETE] Request body:', {
      postId,
      photoIds: photoIds ? photoIds.length : 0,
      videoIds: videoIds ? videoIds.length : 0,
      musicIds: musicIds ? musicIds.length : 0,
    });

    const deletedItems = {
      photos: 0,
      videos: 0,
      music: 0,
      posts: 0,
      errors: [] as string[],
    };

    // Delete associated photos
    if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
      console.log(`[BLOG-DELETE] Processing ${photoIds.length} photos for deletion`);
      for (const photoId of photoIds) {
        try {
          console.log(`[BLOG-DELETE] >>> Deleting photo: ${photoId}`);
          
          // Verify item exists before deletion
          try {
            const existingPhoto = await BaseCrudService.getById('blogphotos', photoId);
            console.log(`[BLOG-DELETE] Photo exists: ${photoId}`, { title: existingPhoto?.title });
          } catch (checkErr) {
            console.warn(`[BLOG-DELETE] Photo not found before deletion: ${photoId}`, checkErr instanceof Error ? checkErr.message : String(checkErr));
          }
          
          // Delete with suppressAuth to bypass permissions
          const deleteResult = await BaseCrudService.delete('blogphotos', photoId, { suppressAuth: true });
          deletedItems.photos++;
          console.log(`[BLOG-DELETE] ✓ Successfully deleted photo: ${photoId}`, deleteResult);
        } catch (err) {
          const errMsg = `Failed to delete photo ${photoId}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(`[BLOG-DELETE] ✗ ${errMsg}`, err);
          deletedItems.errors.push(errMsg);
        }
      }
    }

    // Delete associated videos
    if (videoIds && Array.isArray(videoIds) && videoIds.length > 0) {
      console.log(`[BLOG-DELETE] Processing ${videoIds.length} videos for deletion`);
      for (const videoId of videoIds) {
        try {
          console.log(`[BLOG-DELETE] >>> Deleting video: ${videoId}`);
          
          // Verify item exists before deletion
          try {
            const existingVideo = await BaseCrudService.getById('blogvideos', videoId);
            console.log(`[BLOG-DELETE] Video exists: ${videoId}`, { title: existingVideo?.title });
          } catch (checkErr) {
            console.warn(`[BLOG-DELETE] Video not found before deletion: ${videoId}`, checkErr instanceof Error ? checkErr.message : String(checkErr));
          }
          
          // Delete with suppressAuth to bypass permissions
          const deleteResult = await BaseCrudService.delete('blogvideos', videoId, { suppressAuth: true });
          deletedItems.videos++;
          console.log(`[BLOG-DELETE] ✓ Successfully deleted video: ${videoId}`, deleteResult);
        } catch (err) {
          const errMsg = `Failed to delete video ${videoId}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(`[BLOG-DELETE] ✗ ${errMsg}`, err);
          deletedItems.errors.push(errMsg);
        }
      }
    }

    // Delete associated music
    if (musicIds && Array.isArray(musicIds) && musicIds.length > 0) {
      console.log(`[BLOG-DELETE] Processing ${musicIds.length} music tracks for deletion`);
      for (const musicId of musicIds) {
        try {
          console.log(`[BLOG-DELETE] >>> Deleting music: ${musicId}`);
          
          // Verify item exists before deletion
          try {
            const existingMusic = await BaseCrudService.getById('blogmusic', musicId);
            console.log(`[BLOG-DELETE] Music exists: ${musicId}`, { title: existingMusic?.title });
          } catch (checkErr) {
            console.warn(`[BLOG-DELETE] Music not found before deletion: ${musicId}`, checkErr instanceof Error ? checkErr.message : String(checkErr));
          }
          
          // Delete with suppressAuth to bypass permissions
          const deleteResult = await BaseCrudService.delete('blogmusic', musicId, { suppressAuth: true });
          deletedItems.music++;
          console.log(`[BLOG-DELETE] ✓ Successfully deleted music: ${musicId}`, deleteResult);
        } catch (err) {
          const errMsg = `Failed to delete music ${musicId}: ${err instanceof Error ? err.message : String(err)}`;
          console.error(`[BLOG-DELETE] ✗ ${errMsg}`, err);
          deletedItems.errors.push(errMsg);
        }
      }
    }

    // Delete the post itself (if postId is provided)
    if (postId) {
      try {
        console.log(`[BLOG-DELETE] >>> Deleting blog post: ${postId}`);
        
        // Verify item exists before deletion
        try {
          const existingPost = await BaseCrudService.getById('blogposts', postId);
          console.log(`[BLOG-DELETE] Blog post exists: ${postId}`, { title: existingPost?.title });
        } catch (checkErr) {
          console.warn(`[BLOG-DELETE] Blog post not found before deletion: ${postId}`, checkErr instanceof Error ? checkErr.message : String(checkErr));
        }
        
        // Delete with suppressAuth to bypass permissions
        const deleteResult = await BaseCrudService.delete('blogposts', postId, { suppressAuth: true });
        deletedItems.posts++;
        console.log(`[BLOG-DELETE] ✓ Successfully deleted blog post: ${postId}`, deleteResult);
      } catch (err) {
        const errMsg = `Failed to delete post ${postId}: ${err instanceof Error ? err.message : String(err)}`;
        console.error(`[BLOG-DELETE] ✗ ${errMsg}`, err);
        deletedItems.errors.push(errMsg);
      }
    }

    console.log('[BLOG-DELETE] ===== DELETION SUMMARY =====');
    console.log('[BLOG-DELETE] Results:', deletedItems);

    // If there were any errors, return them but still report success if at least one item was deleted
    if (deletedItems.errors.length > 0 && deletedItems.photos + deletedItems.videos + deletedItems.music + deletedItems.posts === 0) {
      console.error(`[BLOG-DELETE] ✗ ALL DELETIONS FAILED:`, deletedItems.errors);
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

    console.log(`[BLOG-DELETE] ✓ Deletion complete - ${deletedItems.posts + deletedItems.photos + deletedItems.videos + deletedItems.music} items deleted`);
    return new Response(JSON.stringify({ 
      success: true,
      deleted: deletedItems,
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to delete blog content';
    console.error('[BLOG-DELETE] ✗ UNEXPECTED ERROR:', error);
    console.error('[BLOG-DELETE] Error stack:', error instanceof Error ? error.stack : 'N/A');
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMsg,
        stack: error instanceof Error ? error.stack : undefined,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
