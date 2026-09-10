import { BaseCrudService } from '@/integrations';

/**
 * DELETE /api/admin/blog-delete
 * Deletes a blog post and all its associated media (photos, videos, music)
 * 
 * CRITICAL: Uses suppressAuth: true to bypass ADMIN-only delete permissions
 * on blog collections (blogposts, blogphotos, blogvideos, blogmusic)
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

    console.log('[API-BLOG-DELETE] Request received:', {
      postId,
      photoCount: photoIds?.length || 0,
      videoCount: videoIds?.length || 0,
      musicCount: musicIds?.length || 0,
    });

    // Delete associated photos
    if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
      for (const photoId of photoIds) {
        console.log(`[API-BLOG-DELETE] Deleting photo: ${photoId}`);
        await BaseCrudService.delete('blogphotos', photoId, { suppressAuth: true });
        console.log(`[API-BLOG-DELETE] Photo deleted: ${photoId}`);
      }
    }

    // Delete associated videos
    if (videoIds && Array.isArray(videoIds) && videoIds.length > 0) {
      for (const videoId of videoIds) {
        console.log(`[API-BLOG-DELETE] Deleting video: ${videoId}`);
        await BaseCrudService.delete('blogvideos', videoId, { suppressAuth: true });
        console.log(`[API-BLOG-DELETE] Video deleted: ${videoId}`);
      }
    }

    // Delete associated music
    if (musicIds && Array.isArray(musicIds) && musicIds.length > 0) {
      for (const musicId of musicIds) {
        console.log(`[API-BLOG-DELETE] Deleting music: ${musicId}`);
        await BaseCrudService.delete('blogmusic', musicId, { suppressAuth: true });
        console.log(`[API-BLOG-DELETE] Music deleted: ${musicId}`);
      }
    }

    // Delete the post itself (if postId is provided)
    if (postId) {
      console.log(`[API-BLOG-DELETE] Deleting blog post: ${postId}`);
      await BaseCrudService.delete('blogposts', postId, { suppressAuth: true });
      console.log(`[API-BLOG-DELETE] Blog post deleted: ${postId}`);
    }

    console.log('[API-BLOG-DELETE] All deletions completed successfully');
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Failed to delete blog content';
    console.error('[API-BLOG-DELETE] Error deleting blog content:', error);
    console.error('[API-BLOG-DELETE] Error stack:', error instanceof Error ? error.stack : 'N/A');
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
