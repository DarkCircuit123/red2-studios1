# Admin Image Upload Flow - Fix Summary

## Problem
The endpoint `POST /api/media/get-upload-url` was returning HTTP 500 with a Vite SyntaxError page instead of JSON, preventing hero-image uploads. The root cause was invalid `@wix/sdk` import usage.

## Root Cause Analysis
The media upload endpoints were importing `getSecureContext` from `@wix/sdk`:
```typescript
import { getSecureContext } from '@wix/sdk';
```

Then attempting to use it with a context parameter:
```typescript
const wixContext = getSecureContext(context);
const filesClient = files(wixContext);
```

**The Issue:** The `@wix/sdk` package does not export `getSecureContext` as a named export. This caused a Vite SyntaxError during module resolution, which manifested as an HTTP 500 error with an HTML error page instead of JSON.

## Solution
The Wix Media API (`@wix/media`) is designed to work **without** requiring explicit context initialization. The `files()` function can be called directly without parameters:

```typescript
const filesClient = files();
const result = await filesClient.generateFileUploadUrl(mimeType, { fileName });
```

## Files Fixed

### 1. `/src/api/media/get-upload-url.ts`
- **Removed:** `import { getSecureContext } from '@wix/sdk';`
- **Changed:** `files(wixContext)` → `files()`
- **Result:** Now returns valid JSON with `{ uploadUrl, fileName }` on success or `{ error, details }` on failure

### 2. `/src/api/media/upload.ts`
- **Removed:** `import { getSecureContext } from '@wix/sdk';`
- **Removed:** SDK context initialization logic
- **Changed:** `files(wixContext)` → `files()`
- **Result:** Fallback endpoint now works correctly for direct file uploads

### 3. `/src/api/media/import-from-url.ts`
- **Removed:** `import { getSecureContext } from '@wix/sdk';`
- **Removed:** SDK context initialization logic
- **Changed:** `files(wixContext)` → `files()`
- **Result:** URL import endpoint now works correctly

### 4. `/src/api/upload-music.ts`
- **Removed:** `import { getSecureContext } from '@wix/sdk';`
- **Removed:** SDK context initialization logic
- **Changed:** `files(wixContext)` → `files()`
- **Result:** Music upload endpoint now works correctly

## API Response Format

### Success Response (200 OK)
```json
{
  "uploadUrl": "https://...",
  "fileName": "image.jpg"
}
```

### Error Response (400/500)
```json
{
  "error": "Error message",
  "details": "Check server logs for more information"
}
```

## Testing Checklist
- [x] GET_UPLOAD_URL endpoint returns valid JSON (not HTML error page)
- [x] File validation works (size, type checks)
- [x] Upload URL generation succeeds
- [x] Fallback /api/media/upload endpoint works
- [x] URL import endpoint works
- [x] Music upload endpoint works
- [x] Admin authentication flow preserved
- [x] Home page design unchanged

## Deployment Notes
- All three endpoints now return proper JSON responses
- No breaking changes to API contracts
- Admin authentication flow remains unchanged
- Hero image uploads will now work correctly
- Uploaded media URLs are saved to CMS as expected

## Technical Details
The Wix Media API (`@wix/media`) is a client-side library that handles authentication and context internally. When called from a Wix backend route (Astro API route), it automatically uses the request context to authenticate. No manual context passing is required.

This is the correct pattern for Wix backend routes:
```typescript
import { files } from '@wix/media';

export const POST: APIRoute = async (context) => {
  const filesClient = files(); // No context parameter needed
  const result = await filesClient.generateFileUploadUrl(mimeType, { fileName });
  // ... rest of logic
};
```
