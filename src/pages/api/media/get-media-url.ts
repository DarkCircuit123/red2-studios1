/**
 * Backend endpoint to retrieve media URLs after upload
 * Uses server-only Wix SDK (getSecureContext)
 * 
 * This endpoint:
 * 1. Accepts a file ID from the upload response
 * 2. Queries Wix Media Manager to get the permanent media URL
 * 3. Returns the media URL with metadata
 * 4. Includes structured logging for debugging
 */

import type { APIRoute } from 'astro';
import { getSecureContext } from '@wix/sdk';
import { media } from '@wix/media';

interface GetMediaUrlRequest {
  fileId: string;
}

interface GetMediaUrlResponse {
  success: true;
  mediaUrl: string;
  fileId: string;
}

interface ErrorResponse {
  success: false;
  error: string;
}

export const POST: APIRoute = async (context) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();

  try {
    // Parse request body
    const body = await context.request.json() as GetMediaUrlRequest;
    const { fileId } = body;

    // Structured logging: incoming request
    console.log(`[GET_MEDIA_URL] Request ${requestId} started`, {
      fileId,
      timestamp: new Date().toISOString(),
    });

    // Validate required field
    if (!fileId) {
      console.warn(`[GET_MEDIA_URL] Request ${requestId} validation failed`, {
        missingFields: {
          fileId: !fileId,
        },
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required field: fileId'
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Wix Media Manager client
    console.log(`[GET_MEDIA_URL] Request ${requestId} getting Wix context`, {
      timestamp: new Date().toISOString(),
    });
    const wixContext = getSecureContext();
    const mediaClient = media(wixContext);

    // Call Wix Media Manager API to get file info
    console.log(`[GET_MEDIA_URL] Request ${requestId} calling getFileInfo`, {
      fileId,
      timestamp: new Date().toISOString(),
    });

    let fileInfo;
    try {
      fileInfo = await mediaClient.files.getFileInfo(fileId);
    } catch (apiError) {
      console.error(`[GET_MEDIA_URL] Request ${requestId} Wix API call failed`, {
        fileId,
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Wix Media Manager API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
    }

    // Validate response
    if (!fileInfo?.file?.url) {
      console.error(`[GET_MEDIA_URL] Request ${requestId} no media URL in response`, {
        fileId,
        response: fileInfo,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Wix Media Manager did not return a media URL');
    }

    // Verify media URL is a real Wix domain
    const mediaUrlObj = new URL(fileInfo.file.url);
    const isValidWixDomain = 
      mediaUrlObj.hostname.includes('wix') ||
      mediaUrlObj.hostname.includes('files') ||
      mediaUrlObj.hostname.includes('media');

    if (!isValidWixDomain) {
      console.error(`[GET_MEDIA_URL] Request ${requestId} invalid media URL domain`, {
        mediaUrl: fileInfo.file.url,
        hostname: mediaUrlObj.hostname,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid media URL domain: ${mediaUrlObj.hostname}`);
    }

    const duration = Date.now() - startTime;

    // Structured logging: success
    console.log(`[GET_MEDIA_URL] Request ${requestId} completed successfully`, {
      fileId,
      mediaUrlDomain: mediaUrlObj.hostname,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        mediaUrl: fileInfo.file.url,
        fileId,
      } as GetMediaUrlResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    // Structured logging: error with full stack
    console.error(`[GET_MEDIA_URL] Request ${requestId} failed`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    const errorMessage = error instanceof Error ? error.message : 'Failed to retrieve media URL';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
