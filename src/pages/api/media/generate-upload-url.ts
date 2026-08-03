/**
 * Backend endpoint to generate signed upload URLs
 * Uses server-only Wix SDK (getSecureContext)
 * 
 * This endpoint:
 * 1. Validates incoming filename and MIME type
 * 2. Calls Wix Media Manager API to generate a real upload URL
 * 3. Returns the signed uploadUrl with metadata
 * 4. Includes structured logging for debugging
 */

import type { APIRoute } from 'astro';
import { getSecureContext } from '@wix/sdk';
import { media } from '@wix/media';

interface GenerateUploadUrlRequest {
  fileName: string;
  mimeType: string;
  kind?: 'image' | 'music';
}

interface GenerateUploadUrlResponse {
  success: true;
  uploadUrl: string;
  fileName: string;
  mimeType: string;
  expiresAt?: string;
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
    const body = await context.request.json() as GenerateUploadUrlRequest;
    const { fileName, mimeType, kind } = body;

    // Structured logging: incoming request
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} started`, {
      fileName,
      mimeType,
      kind,
      timestamp: new Date().toISOString(),
    });

    // Validate required fields
    if (!fileName || !mimeType) {
      console.warn(`[GENERATE_UPLOAD_URL] Request ${requestId} validation failed`, {
        missingFields: {
          fileName: !fileName,
          mimeType: !mimeType,
        },
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing required fields: fileName, mimeType'
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate MIME type format
    if (!/^[a-z]+\/[a-z0-9+\-.]+$/i.test(mimeType)) {
      console.warn(`[GENERATE_UPLOAD_URL] Request ${requestId} invalid MIME type`, {
        mimeType,
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid MIME type format'
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get Wix Media Manager client
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} getting Wix context`, {
      timestamp: new Date().toISOString(),
    });
    const wixContext = getSecureContext();
    const mediaClient = media(wixContext);

    // Call Wix Media Manager API to generate upload URL
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} calling generateFileUploadUrl`, {
      fileName,
      mimeType,
      timestamp: new Date().toISOString(),
    });

    let uploadUrlResponse;
    try {
      uploadUrlResponse = await mediaClient.files.generateFileUploadUrl(mimeType, {
        fileName,
      });
    } catch (apiError) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} Wix API call failed`, {
        error: apiError instanceof Error ? apiError.message : String(apiError),
        stack: apiError instanceof Error ? apiError.stack : undefined,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Wix Media Manager API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`);
    }

    // Validate response
    if (!uploadUrlResponse?.uploadUrl) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} no uploadUrl in response`, {
        response: uploadUrlResponse,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Wix Media Manager did not return an upload URL');
    }

    // Verify upload URL is a real Wix domain
    const uploadUrlObj = new URL(uploadUrlResponse.uploadUrl);
    const isValidWixDomain = 
      uploadUrlObj.hostname.includes('wix') ||
      uploadUrlObj.hostname.includes('files') ||
      uploadUrlObj.hostname.includes('media');

    if (!isValidWixDomain) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} invalid upload URL domain`, {
        uploadUrl: uploadUrlResponse.uploadUrl,
        hostname: uploadUrlObj.hostname,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid upload URL domain: ${uploadUrlObj.hostname}`);
    }

    const duration = Date.now() - startTime;

    // Structured logging: success
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} completed successfully`, {
      fileName,
      mimeType,
      uploadUrlDomain: uploadUrlObj.hostname,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        uploadUrl: uploadUrlResponse.uploadUrl,
        fileName,
        mimeType,
        expiresAt: uploadUrlResponse.expiresAt,
      } as GenerateUploadUrlResponse),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = Date.now() - startTime;

    // Structured logging: error with full stack
    console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} failed`, {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    });

    const errorMessage = error instanceof Error ? error.message : 'Failed to generate upload URL';
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      } as ErrorResponse),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
