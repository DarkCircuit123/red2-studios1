import type { APIRoute } from 'astro';
import { wixClient } from '@wix/sdk';

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

    // Use Wix SDK to generate a real signed upload URL
    const client = wixClient();
    const filesClient = client.media.files;
    
    let uploadUrlResponse;
    try {
      uploadUrlResponse = await filesClient.generateFileUploadUrl(mimeType, {
        fileName: fileName,
      });
    } catch (apiError) {
      console.error('[GENERATE_UPLOAD_URL] Failed to generate upload URL:', {
        fileName,
        mimeType,
        error: apiError instanceof Error ? apiError.message : String(apiError),
      });
      return new Response(
        JSON.stringify({ 
          error: `Failed to generate upload URL: ${apiError instanceof Error ? apiError.message : String(apiError)}` 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!uploadUrlResponse.uploadUrl) {
      console.error('[GENERATE_UPLOAD_URL] No uploadUrl in response:', uploadUrlResponse);
      return new Response(
        JSON.stringify({ error: 'Failed to generate upload URL from Wix Media Manager' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log('[GENERATE_UPLOAD_URL] Successfully generated signed URL:', { 
      fileName, 
      fileId: uploadUrlResponse.fileId 
    });

    return new Response(
      JSON.stringify({
        uploadUrl: uploadUrlResponse.uploadUrl,
        fileId: uploadUrlResponse.fileId,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[GENERATE_UPLOAD_URL] Error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Failed to generate upload URL' 
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
