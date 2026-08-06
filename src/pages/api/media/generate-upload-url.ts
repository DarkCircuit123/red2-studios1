import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { fileName, mimeType, kind } = await request.json();

    if (!fileName || !mimeType) {
      return new Response(
        JSON.stringify({ error: 'Missing fileName or mimeType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GENERATE_UPLOAD_URL] Generating signed URL:', { fileName, mimeType, kind });

    let uploadUrlResponse;
    try {
      // Use auth.elevate to call generateFileUploadUrl with elevated permissions
      const elevatedGenerateUrl = auth.elevate(files.generateFileUploadUrl);
      
      uploadUrlResponse = await elevatedGenerateUrl(mimeType, {
        fileName: fileName,
        parentFolderId: 'media-root',
        private: false,
      });
      
      console.log('[GENERATE_UPLOAD_URL] Generated upload URL successfully:', { 
        fileName, 
        fileId: uploadUrlResponse.fileId 
      });
    } catch (apiError) {
      console.error('[GENERATE_UPLOAD_URL] Failed to generate upload URL:', {
        fileName,
        mimeType,
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
      });
      return new Response(
        JSON.stringify({ 
          error: `Failed to generate upload URL: ${apiError instanceof Error ? apiError.message : String(apiError)}` 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!uploadUrlResponse || !uploadUrlResponse.uploadUrl) {
      console.error('[GENERATE_UPLOAD_URL] No uploadUrl in response:', uploadUrlResponse);
      return new Response(
        JSON.stringify({ error: 'Failed to generate upload URL from Wix Media Manager' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({
        uploadUrl: uploadUrlResponse.uploadUrl,
        fileId: uploadUrlResponse.fileId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GENERATE_UPLOAD_URL] Unexpected error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate upload URL' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
