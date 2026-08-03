/**
 * Backend endpoint to generate signed upload URLs
 * Uses server-side Wix SDK (media client from @wix/astro integration)
 * 
 * This endpoint:
 * 1. Validates incoming filename and MIME type
 * 2. Calls Wix Media Manager API to generate a real upload URL
 * 3. Returns the signed uploadUrl with metadata
 * 4. Includes comprehensive structured logging for debugging
 * 5. Handles all error cases with detailed diagnostics
 */

import type { APIRoute } from 'astro';
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
    // ========== STAGE 1: REQUEST RECEIVED ==========
    console.log(`[GENERATE_UPLOAD_URL] ===== REQUEST STARTED =====`, {
      requestId,
      timestamp: new Date().toISOString(),
    });

    // Parse request body
    let body: GenerateUploadUrlRequest;
    try {
      body = await context.request.json() as GenerateUploadUrlRequest;
    } catch (parseError) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} failed to parse JSON`, {
        error: parseError instanceof Error ? parseError.message : String(parseError),
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid JSON in request body'
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const { fileName, mimeType, kind } = body;

    // ========== STAGE 2: FILENAME VALIDATION ==========
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} filename received`, {
      fileName,
      fileNameLength: fileName?.length,
      timestamp: new Date().toISOString(),
    });

    if (!fileName || typeof fileName !== 'string' || fileName.trim().length === 0) {
      console.warn(`[GENERATE_UPLOAD_URL] Request ${requestId} invalid filename`, {
        fileName,
        fileNameType: typeof fileName,
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

    // ========== STAGE 3: MIME TYPE VALIDATION ==========
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} MIME type received`, {
      mimeType,
      mimeTypeLength: mimeType?.length,
      timestamp: new Date().toISOString(),
    });

    if (!mimeType || typeof mimeType !== 'string' || mimeType.trim().length === 0) {
      console.warn(`[GENERATE_UPLOAD_URL] Request ${requestId} invalid MIME type`, {
        mimeType,
        mimeTypeType: typeof mimeType,
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Missing or invalid mimeType'
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate MIME type format (e.g., "image/jpeg", "audio/mpeg")
    if (!/^[a-z]+\/[a-z0-9+\-.]+$/i.test(mimeType)) {
      console.warn(`[GENERATE_UPLOAD_URL] Request ${requestId} invalid MIME type format`, {
        mimeType,
        expectedFormat: 'type/subtype (e.g., image/jpeg)',
        timestamp: new Date().toISOString(),
      });
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid MIME type format. Expected format: type/subtype (e.g., image/jpeg)'
        } as ErrorResponse),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} validation passed`, {
      fileName,
      mimeType,
      kind,
      timestamp: new Date().toISOString(),
    });

    // ========== STAGE 4: SDK INITIALIZATION ==========
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} initializing Wix SDK`, {
      timestamp: new Date().toISOString(),
    });

    let wixContext;
    try {
      // Get Wix context from the Astro context (provided by @wix/astro integration)
      // The context object contains the Wix SDK client
      wixContext = context;
      console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} Wix context obtained`, {
        contextType: typeof wixContext,
        hasContext: !!wixContext,
        timestamp: new Date().toISOString(),
      });
    } catch (contextError) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} failed to get Wix context`, {
        error: contextError instanceof Error ? contextError.message : String(contextError),
        stack: contextError instanceof Error ? contextError.stack : undefined,
        errorType: contextError instanceof Error ? contextError.constructor.name : typeof contextError,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to initialize Wix SDK: ${contextError instanceof Error ? contextError.message : String(contextError)}`);
    }

    if (!wixContext) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} Wix context is null or undefined`, {
        timestamp: new Date().toISOString(),
      });
      throw new Error('Wix context is null or undefined - SDK initialization failed');
    }

    // ========== STAGE 5: MEDIA CLIENT INITIALIZATION ==========
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} creating media client`, {
      timestamp: new Date().toISOString(),
    });

    let mediaClient;
    try {
      mediaClient = media(wixContext);
      console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} media client created`, {
        clientType: typeof mediaClient,
        hasClient: !!mediaClient,
        hasFiles: !!mediaClient?.files,
        timestamp: new Date().toISOString(),
      });
    } catch (clientError) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} failed to create media client`, {
        error: clientError instanceof Error ? clientError.message : String(clientError),
        stack: clientError instanceof Error ? clientError.stack : undefined,
        errorType: clientError instanceof Error ? clientError.constructor.name : typeof clientError,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Failed to create media client: ${clientError instanceof Error ? clientError.message : String(clientError)}`);
    }

    if (!mediaClient || !mediaClient.files) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} media client or files API is unavailable`, {
        hasClient: !!mediaClient,
        hasFiles: !!mediaClient?.files,
        timestamp: new Date().toISOString(),
      });
      throw new Error('Media client or files API is unavailable');
    }

    // ========== STAGE 6: UPLOAD URL GENERATION ==========
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} calling generateFileUploadUrl`, {
      fileName,
      mimeType,
      timestamp: new Date().toISOString(),
    });

    let uploadUrlResponse;
    try {
      // Call the Wix Media API to generate an upload URL
      // The API signature is: generateFileUploadUrl(mimeType, options)
      uploadUrlResponse = await mediaClient.files.generateFileUploadUrl(mimeType, {
        fileName,
      });

      console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} generateFileUploadUrl succeeded`, {
        responseType: typeof uploadUrlResponse,
        hasUploadUrl: !!uploadUrlResponse?.uploadUrl,
        uploadUrlLength: uploadUrlResponse?.uploadUrl?.length,
        hasExpiresAt: !!uploadUrlResponse?.expiresAt,
        timestamp: new Date().toISOString(),
      });
    } catch (apiError) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} generateFileUploadUrl failed`, {
        errorName: apiError instanceof Error ? apiError.name : 'Unknown',
        errorMessage: apiError instanceof Error ? apiError.message : String(apiError),
        errorStack: apiError instanceof Error ? apiError.stack : undefined,
        errorType: typeof apiError,
        errorConstructor: apiError instanceof Error ? apiError.constructor.name : 'Unknown',
        // Try to extract HTTP status if available
        httpStatus: (apiError as any)?.status || (apiError as any)?.statusCode,
        // Try to extract response body if available
        responseBody: (apiError as any)?.response || (apiError as any)?.body,
        timestamp: new Date().toISOString(),
      });

      // Provide specific error messages based on error type
      let errorMessage = `Wix Media Manager API error: ${apiError instanceof Error ? apiError.message : String(apiError)}`;
      
      if (apiError instanceof Error) {
        if (apiError.message.includes('permission') || apiError.message.includes('unauthorized')) {
          errorMessage = 'Permission denied: Check Wix API key and permissions';
        } else if (apiError.message.includes('authentication') || apiError.message.includes('auth')) {
          errorMessage = 'Authentication failed: Wix SDK not properly initialized';
        } else if (apiError.message.includes('deprecated')) {
          errorMessage = 'API method is deprecated: Update Wix SDK version';
        }
      }

      throw new Error(errorMessage);
    }

    // ========== STAGE 7: RESPONSE VALIDATION ==========
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} validating upload URL response`, {
      responseType: typeof uploadUrlResponse,
      responseKeys: uploadUrlResponse ? Object.keys(uploadUrlResponse) : [],
      timestamp: new Date().toISOString(),
    });

    if (!uploadUrlResponse) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} response is null or undefined`, {
        timestamp: new Date().toISOString(),
      });
      throw new Error('Wix Media Manager returned null or undefined response');
    }

    if (!uploadUrlResponse.uploadUrl) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} no uploadUrl in response`, {
        response: JSON.stringify(uploadUrlResponse),
        responseKeys: Object.keys(uploadUrlResponse),
        timestamp: new Date().toISOString(),
      });
      throw new Error('Wix Media Manager did not return an uploadUrl field');
    }

    if (typeof uploadUrlResponse.uploadUrl !== 'string') {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} uploadUrl is not a string`, {
        uploadUrlType: typeof uploadUrlResponse.uploadUrl,
        timestamp: new Date().toISOString(),
      });
      throw new Error(`uploadUrl is not a string, got ${typeof uploadUrlResponse.uploadUrl}`);
    }

    if (uploadUrlResponse.uploadUrl.length === 0) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} uploadUrl is empty string`, {
        timestamp: new Date().toISOString(),
      });
      throw new Error('uploadUrl is an empty string');
    }

    // ========== STAGE 8: UPLOAD URL VERIFICATION ==========
    console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} verifying upload URL`, {
      uploadUrl: uploadUrlResponse.uploadUrl.substring(0, 100) + '...',
      timestamp: new Date().toISOString(),
    });

    let uploadUrlObj;
    try {
      uploadUrlObj = new URL(uploadUrlResponse.uploadUrl);
      console.log(`[GENERATE_UPLOAD_URL] Request ${requestId} upload URL parsed`, {
        hostname: uploadUrlObj.hostname,
        protocol: uploadUrlObj.protocol,
        timestamp: new Date().toISOString(),
      });
    } catch (urlError) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} failed to parse upload URL`, {
        uploadUrl: uploadUrlResponse.uploadUrl,
        error: urlError instanceof Error ? urlError.message : String(urlError),
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid upload URL format: ${urlError instanceof Error ? urlError.message : String(urlError)}`);
    }

    // Verify upload URL is from a real Wix domain
    const isValidWixDomain = 
      uploadUrlObj.hostname.includes('wix') ||
      uploadUrlObj.hostname.includes('files') ||
      uploadUrlObj.hostname.includes('media') ||
      uploadUrlObj.hostname.includes('wixmp');

    if (!isValidWixDomain) {
      console.error(`[GENERATE_UPLOAD_URL] Request ${requestId} invalid upload URL domain`, {
        uploadUrl: uploadUrlResponse.uploadUrl,
        hostname: uploadUrlObj.hostname,
        expectedDomains: ['wix', 'files', 'media', 'wixmp'],
        timestamp: new Date().toISOString(),
      });
      throw new Error(`Invalid upload URL domain: ${uploadUrlObj.hostname} (expected Wix domain)`);
    }

    const duration = Date.now() - startTime;

    // ========== STAGE 9: SUCCESS ==========
    console.log(`[GENERATE_UPLOAD_URL] ===== REQUEST COMPLETED SUCCESSFULLY =====`, {
      requestId,
      fileName,
      mimeType,
      uploadUrlDomain: uploadUrlObj.hostname,
      uploadUrlLength: uploadUrlResponse.uploadUrl.length,
      expiresAt: uploadUrlResponse.expiresAt,
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

    // ========== ERROR HANDLING ==========
    console.error(`[GENERATE_UPLOAD_URL] ===== REQUEST FAILED =====`, {
      requestId,
      errorName: error instanceof Error ? error.name : 'Unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      errorType: typeof error,
      errorConstructor: error instanceof Error ? error.constructor.name : 'Unknown',
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
