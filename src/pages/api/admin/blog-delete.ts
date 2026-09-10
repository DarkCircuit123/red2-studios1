import { BaseCrudService } from '@/integrations';

/**
 * DELETE /api/admin/blog-delete
 * Deletes a blog post and all its associated media (photos, videos, music)
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

    // Delete associated photos
    if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
      for (const photoId of photoIds) {
        try {
          await BaseCrudService.delete('blogphotos', photoId);
        } catch (err) {
          console.warn(`Failed to delete photo ${photoId}:`, err);
        }
      }
    }

    // Delete associated videos
    if (videoIds && Array.isArray(videoIds) && videoIds.length > 0) {
      for (const videoId of videoIds) {
        try {
          await BaseCrudService.delete('blogvideos', videoId);
        } catch (err) {
          console.warn(`Failed to delete video ${videoId}:`, err);
        }
      }
    }

    // Delete associated music
    if (musicIds && Array.isArray(musicIds) && musicIds.length > 0) {
      for (const musicId of musicIds) {
        try {
          await BaseCrudService.delete('blogmusic', musicId);
        } catch (err) {
          console.warn(`Failed to delete music ${musicId}:`, err);
        }
      }
    }

    // Delete the post itself (if postId is provided)
    if (postId) {
      try {
        await BaseCrudService.delete('blogposts', postId);
      } catch (err) {
        console.warn(`Failed to delete post ${postId}:`, err);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error deleting blog content:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to delete blog content',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
