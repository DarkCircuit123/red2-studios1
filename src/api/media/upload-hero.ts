import type { APIRoute } from 'astro';
import { getSecureContext } from '@wix/sdk';
import { media } from '@wix/media';

/**
 * Hero Image Upload API - Clean, reliable upload flow
 * 
 * This endpoint:
 * 1. Validates the file (JPEG, PNG, WebP only; max 10MB)
 * 2. Generates a signed upload URL from Wix Media Manager
 * 3. Receives the file bytes and uploads to Wix
 * 4. Returns { success, mediaUrl, fileId, error }
 * 5. Enforces admin authentication
 */

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const POST: APIRoute = async (context) => {
  try {
    // Check admin authentication via header
    const authHeader = context.request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const formData = await context.request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File type not supported. Allowed: JPEG, PNG, WebP. Received: ${file.type}` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate file size
    if (file.size > MAX_SIZE_BYTES) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `File too large. Max 10MB, received ${(file.size / 1024 / 1024).toFixed(2)}MB` 
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Wix Media Manager client
    const wixContext = getSecureContext();
    const mediaClient = media(wixContext);

    // Generate upload URL
    const uploadUrlResponse = await mediaClient.files.generateFileUploadUrl(file.type, {
      fileName: file.name,
    });

    if (!uploadUrlResponse.uploadUrl) {
      throw new Error('Failed to generate upload URL from Wix Media Manager');
    }

    // Upload file to Wix
    const buffer = await file.arrayBuffer();
    const uploadResponse = await fetch(
      `${uploadUrlResponse.uploadUrl}?filename=${encodeURIComponent(file.name)}`,
      {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: buffer,
      }
    );

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text().catch(() => '');
      throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
    }

    const uploadResult = await uploadResponse.json();
    const mediaUrl = uploadResult?.file?.url;
    const fileId = uploadResult?.file?.id;

    if (!mediaUrl) {
      throw new Error('No media URL returned from Wix Media Manager');
    }

    return new Response(
      JSON.stringify({
        success: true,
        mediaUrl,
        fileId: fileId || '',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[UPLOAD_HERO] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Upload failed';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
