/**
 * Backend endpoint to retrieve media URLs after upload
 * Uses server-side Wix SDK (media client from @wix/astro integration)
 * 
 * This endpoint:
 * 1. Accepts a fileName from the upload response
 * 2. Queries Wix Media Manager to find the file by name
 * 3. Returns the media URL with metadata
 * 4. Includes structured logging for debugging
 */

import type { APIRoute } from 'astro';
import { media } from '@wix/media';

interface GetMediaUrlRequest {
  fileName: string;
}

interface GetMediaUrlResponse {
  success: true;
  mediaUrl: string;
  mediaId?: string;
  fileName: string;
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
    const { fileName } = body;

    // Structured logging: incoming request
    console.log(`[GET_MEDIA_URL] Request ${requestId} started`, {
      fileName,
      timestamp: new Date().toISOString(),
    });

    // Validate required field
    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      console.warn(`[GET_MEDIA_URL] Request ${requestId} validation failed`, {
        fileName,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing or invalid fileName'
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Wix Media Manager client
    console.log(`[GET_MEDIA_URL] Request ${requestId} getting Wix context`, {
      timestamp: new Date().toISOString(),
    });
    
    let wixContext;
    try {
      wixContext = context;
    } catch (contextError) {
      console.error(`[GET_MEDIA_URL] Request ${requestId} failed to get Wix context`, {
        error: contextError instanceof Error ? contextError.message : String(contextError),
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to initialize Wix SDK: ${contextError instanceof Error ? contextError.message : String(contextError)}`);
    }

    let mediaClient;
    try {
      mediaClient = media(wixContext);
    } catch (clientError) {
      console.error(`[GET_MEDIA_URL] Request ${requestId} failed to create media client`, {
        error: clientError instanceof Error ? clientError.message : String(clientError),
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to create media client: ${clientError instanceof Error ? clientError.message : String(clientError)}`);
    }

    // Call Wix Media Manager API to list files and find by name
    console.log(`[GET_MEDIA_URL] Request ${requestId} calling listFiles`, {
      fileName,
      timestamp: new Date().toISOString(),
    });

    let listResponse;
    try {
      // List files with a filter for the fileName
      listResponse = await mediaClient.files.listFiles({
        sort: 'CREATED_DATE_DESC',
        limit: 100
      });
    } catch (apiError) {
      console.error(`[GET_MEDIA_URL] Request ${requestId} Wix API call failed`, {
        fileName,
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Wix Media Manager API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
    }

    // Find the file by name
    const files = listResponse?.items || [];
    console.log(`[GET_MEDIA_URL] Request ${requestId} found ${files.length} files`, {
      fileName,
      timestamp: new Date().toISOString(),
    });

    const foundFile = files.find((f: any) => f.fileName === fileName || f.displayName === fileName);

    if (!foundFile) {
      console.warn(`[GET_MEDIA_URL] Request ${requestId} file not found`, {
        fileName,
        availableFiles: files.map((f: any) => ({ fileName: f.fileName, displayName: f.displayName })),
        timestamp: new Date().toISOString(),
      });
      throw new Error(`File not found: ${fileName}`);
    }

    // Get the media URL
    const mediaUrl = foundFile.url || foundFile.downloadUrl;
    if (!mediaUrl) {
      console.error(`[GET_MEDIA_URL] Request ${requestId} no media URL in file`, {
        fileName,
        file: foundFile,
        timestamp: new Date().toISOString(),
      });
      throw new Error('File found but no media URL available');
    }

    // Verify media URL is a real Wix domain
    const mediaUrlObj = new URL(mediaUrl);
    const isValidWixDomain = 
      mediaUrlObj.hostname.includes('wix') ||
      mediaUrlObj.hostname.includes('files') ||
      mediaUrlObj.hostname.includes('media') ||
      mediaUrlObj.hostname.includes('wixmp');

    if (!isValidWixDomain) {
      console.error(`[GET_MEDIA_URL] Request ${requestId} invalid media URL domain`, {
        mediaUrl,
        hostname: mediaUrlObj.hostname,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid media URL domain: ${mediaUrlObj.hostname}`);
    }

    const duration = Date.now() - startTime;

    // Structured logging: success
    console.log(`[GET_MEDIA_URL] Request ${requestId} completed successfully`, {
      fileName,
      mediaId: foundFile.id,
      mediaUrlDomain: mediaUrlObj.hostname,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        mediaUrl,
        mediaId: foundFile.id,
        fileName,
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
