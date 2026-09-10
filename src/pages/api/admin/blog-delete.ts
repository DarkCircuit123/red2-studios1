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
        await BaseCrudService.delete('blogphotos', photoId);
      }
    }

    // Delete associated videos
    if (videoIds && Array.isArray(videoIds) && videoIds.length > 0) {
      for (const videoId of videoIds) {
        await BaseCrudService.delete('blogvideos', videoId);
      }
    }

    // Delete associated music
    if (musicIds && Array.isArray(musicIds) && musicIds.length > 0) {
      for (const musicId of musicIds) {
        await BaseCrudService.delete('blogmusic', musicId);
      }
    }

    // Delete the post itself (if postId is provided)
    if (postId) {
      await BaseCrudService.delete('blogposts', postId);
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
