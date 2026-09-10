import { BaseCrudService } from '@wix/codegen-framework-packages';
import { auth } from 'wix-api';

/**
 * DELETE /api/admin/blog-delete
 * Deletes a blog post and all its associated media (photos, videos, music)
 * Uses auth.elevate() to bypass permission checks for admin operations
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

    // Use auth.elevate() to bypass permission restrictions
    const elevatedAuth = auth.elevate();

    // Delete associated photos
    if (photoIds && Array.isArray(photoIds) && photoIds.length > 0) {
      for (const photoId of photoIds) {
        await elevatedAuth(async () => {
          return await BaseCrudService.delete('blogphotos', photoId);
        })();
      }
    }

    // Delete associated videos
    if (videoIds && Array.isArray(videoIds) && videoIds.length > 0) {
      for (const videoId of videoIds) {
        await elevatedAuth(async () => {
          return await BaseCrudService.delete('blogvideos', videoId);
        })();
      }
    }

    // Delete associated music
    if (musicIds && Array.isArray(musicIds) && musicIds.length > 0) {
      for (const musicId of musicIds) {
        await elevatedAuth(async () => {
          return await BaseCrudService.delete('blogmusic', musicId);
        })();
      }
    }

    // Delete the post itself (if postId is provided)
    if (postId) {
      await elevatedAuth(async () => {
        return await BaseCrudService.delete('blogposts', postId);
      })();
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
