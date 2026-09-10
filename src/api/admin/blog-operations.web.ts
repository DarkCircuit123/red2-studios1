/**
 * VELO BACKEND MODULE: Blog Operations
 * 
 * This is a direct Velo backend function (not HTTP endpoint).
 * Called directly from frontend without fetch() or HTTP.
 * 
 * Functions:
 * - deleteBlogPost(postId: string): Promise<DeleteResult>
 * - deleteBlogMedia(mediaType: string, mediaId: string): Promise<DeleteResult>
 * 
 * Response format:
 * {
 *   success: boolean,
 *   deleted: number (0 or 1),
 *   id: string,
 *   error?: string
 * }
 */

import { BaseCrudService } from '@/integrations';

export interface DeleteResult {
  success: boolean;
  deleted: number;
  id: string;
  error?: string;
}

/**
 * Delete a blog post directly via Velo backend
 * 
 * @param postId - The _id of the blog post to delete
 * @returns DeleteResult object
 */
export async function deleteBlogPost(postId: string): Promise<DeleteResult> {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    console.log(`[BLOG-OPS:${requestId}] ===== DELETE BLOG POST =====`);
    console.log(`[BLOG-OPS:${requestId}] Post ID: ${postId}`);

    // Validate postId
    if (!postId || typeof postId !== 'string' || postId.trim().length === 0) {
      console.error(`[BLOG-OPS:${requestId}] ✗ Invalid postId:`, postId);
      return {
        success: false,
        deleted: 0,
        id: postId || '',
        error: 'Invalid postId: must be a non-empty string',
      };
    }

    // Verify the post exists before deletion
    let existingPost: any = null;
    try {
      existingPost = await BaseCrudService.getById('blogposts', postId);
      console.log(`[BLOG-OPS:${requestId}] ✓ Blog post exists:`, {
        id: existingPost?._id,
        title: existingPost?.title,
      });
    } catch (checkErr) {
      const checkErrMsg = checkErr instanceof Error ? checkErr.message : String(checkErr);
      console.warn(`[BLOG-OPS:${requestId}] ⚠ Blog post not found:`, checkErrMsg);
      return {
        success: false,
        deleted: 0,
        id: postId,
        error: `Blog post not found: ${checkErrMsg}`,
      };
    }

    // Delete the blog post using suppressAuth: true
    try {
      console.log(`[BLOG-OPS:${requestId}] >>> Calling BaseCrudService.delete('blogposts', '${postId}', { suppressAuth: true })`);
      
      const deleteResult = await BaseCrudService.delete('blogposts', postId, { suppressAuth: true });
      
      console.log(`[BLOG-OPS:${requestId}] ✓ Successfully deleted blog post:`, {
        id: postId,
        title: existingPost?.title,
        deleteResult,
      });

      return {
        success: true,
        deleted: 1,
        id: postId,
      };
    } catch (deleteErr) {
      const deleteErrMsg = deleteErr instanceof Error ? deleteErr.message : String(deleteErr);
      console.error(`[BLOG-OPS:${requestId}] ✗ Failed to delete blog post:`, {
        id: postId,
        error: deleteErrMsg,
        stack: deleteErr instanceof Error ? deleteErr.stack : undefined,
      });

      return {
        success: false,
        deleted: 0,
        id: postId,
        error: `Failed to delete blog post: ${deleteErrMsg}`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BLOG-OPS:${requestId}] ✗ UNEXPECTED ERROR:`, {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      deleted: 0,
      id: postId || '',
      error: `Unexpected error: ${errorMsg}`,
    };
  }
}

/**
 * Delete blog media (photo, video, or music) directly via Velo backend
 * 
 * @param mediaType - 'photo' | 'video' | 'music'
 * @param mediaId - The _id of the media to delete
 * @returns DeleteResult object
 */
export async function deleteBlogMedia(mediaType: string, mediaId: string): Promise<DeleteResult> {
  const requestId = crypto.randomUUID().substring(0, 8);
  
  try {
    console.log(`[BLOG-OPS:${requestId}] ===== DELETE BLOG MEDIA =====`);
    console.log(`[BLOG-OPS:${requestId}] Media Type: ${mediaType}, Media ID: ${mediaId}`);

    // Validate mediaType
    const validMediaTypes = ['photo', 'video', 'music'];
    if (!mediaType || !validMediaTypes.includes(mediaType)) {
      console.error(`[BLOG-OPS:${requestId}] ✗ Invalid mediaType:`, mediaType);
      return {
        success: false,
        deleted: 0,
        id: mediaId || '',
        error: `Invalid mediaType: must be one of ${validMediaTypes.join(', ')}`,
      };
    }

    // Validate mediaId
    if (!mediaId || typeof mediaId !== 'string' || mediaId.trim().length === 0) {
      console.error(`[BLOG-OPS:${requestId}] ✗ Invalid mediaId:`, mediaId);
      return {
        success: false,
        deleted: 0,
        id: mediaId || '',
        error: 'Invalid mediaId: must be a non-empty string',
      };
    }

    // Map mediaType to collection name
    const collectionMap: Record<string, string> = {
      photo: 'blogphotos',
      video: 'blogvideos',
      music: 'blogmusic',
    };
    const collectionId = collectionMap[mediaType];

    console.log(`[BLOG-OPS:${requestId}] Deleting ${mediaType} from '${collectionId}': ${mediaId}`);

    // Verify the media exists before deletion
    let existingMedia: any = null;
    try {
      existingMedia = await BaseCrudService.getById(collectionId, mediaId);
      console.log(`[BLOG-OPS:${requestId}] ✓ Media exists:`, {
        id: existingMedia?._id,
        title: existingMedia?.title,
      });
    } catch (checkErr) {
      const checkErrMsg = checkErr instanceof Error ? checkErr.message : String(checkErr);
      console.warn(`[BLOG-OPS:${requestId}] ⚠ Media not found:`, checkErrMsg);
      return {
        success: false,
        deleted: 0,
        id: mediaId,
        error: `Media not found: ${checkErrMsg}`,
      };
    }

    // Delete the media using suppressAuth: true
    try {
      console.log(`[BLOG-OPS:${requestId}] >>> Calling BaseCrudService.delete('${collectionId}', '${mediaId}', { suppressAuth: true })`);
      
      const deleteResult = await BaseCrudService.delete(collectionId, mediaId, { suppressAuth: true });
      
      console.log(`[BLOG-OPS:${requestId}] ✓ Successfully deleted ${mediaType}:`, {
        id: mediaId,
        title: existingMedia?.title,
        deleteResult,
      });

      return {
        success: true,
        deleted: 1,
        id: mediaId,
      };
    } catch (deleteErr) {
      const deleteErrMsg = deleteErr instanceof Error ? deleteErr.message : String(deleteErr);
      console.error(`[BLOG-OPS:${requestId}] ✗ Failed to delete ${mediaType}:`, {
        id: mediaId,
        error: deleteErrMsg,
        stack: deleteErr instanceof Error ? deleteErr.stack : undefined,
      });

      return {
        success: false,
        deleted: 0,
        id: mediaId,
        error: `Failed to delete ${mediaType}: ${deleteErrMsg}`,
      };
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[BLOG-OPS:${requestId}] ✗ UNEXPECTED ERROR:`, {
      error: errorMsg,
      stack: error instanceof Error ? error.stack : undefined,
    });

    return {
      success: false,
      deleted: 0,
      id: mediaId || '',
      error: `Unexpected error: ${errorMsg}`,
    };
  }
}
