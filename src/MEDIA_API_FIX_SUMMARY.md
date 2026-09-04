# Media API Fix: "files is not a function" Error Resolution

## Problem
The media upload system was failing with the error:
```
Wix Media API failed: (0 , __vite_ssr_import_0__.files) is not a function
```

This occurred in `/src/api/media/get-upload-url.ts` and other media endpoints when attempting to call `files()` from `@wix/media`.

## Root Cause
The `files` function from `@wix/media` requires a **Wix SDK context** to be passed as an argument. The code was calling `files()` without any context, which resulted in the function being called incorrectly in the Astro/Cloudflare Workers runtime.

**Incorrect pattern:**
```typescript
const filesClient = files();  // ❌ WRONG - no context passed
```

**Correct pattern:**
```typescript
import { getSecureContext } from '@wix/sdk';

const wixContext = getSecureContext();
const filesClient = files(wixContext);  // ✅ CORRECT - context provided
```

## Files Fixed
All media-related API endpoints were updated to use the correct Wix SDK pattern:

1. **`/src/api/media/get-upload-url.ts`**
   - Added `import { getSecureContext } from '@wix/sdk'`
   - Changed `files()` to `files(getSecureContext())`

2. **`/src/api/media/upload.ts`**
   - Added `import { getSecureContext } from '@wix/sdk'`
   - Changed `files()` to `files(getSecureContext())`

3. **`/src/api/upload-music.ts`**
   - Added `import { getSecureContext } from '@wix/sdk'`
   - Changed `files()` to `files(getSecureContext())`

4. **`/src/api/media/import-from-url.ts`**
   - Added `import { getSecureContext } from '@wix/sdk'`
   - Changed `files()` to `files(getSecureContext())`

## How It Works
The fix follows the same pattern already used successfully in other Wix SDK integrations:
- `/src/api/auth/login.ts` - uses `getSecureContext()` with `members` API
- `/src/api/auth/update-profile.ts` - uses `getSecureContext()` with `members` API

## Validation & Security
The fix maintains all existing validation:
- **PSD file rejection** - explicitly blocked at both client and server level
- **File size limits** - enforced via `upload-config.ts` (100MB for images, 500MB for audio)
- **MIME type validation** - strict whitelist of supported formats
- **Client-side validation** - `ImageUploadManager.tsx` validates before upload
- **Server-side validation** - all endpoints validate before processing

## Upload Flow (Unchanged)
The two-tier upload strategy remains intact:
1. **Tier 1 (Primary)**: Browser requests signed upload URL from `/api/media/get-upload-url` → PUTs file directly to Wix Media Manager
2. **Tier 2 (Fallback)**: If network-level failure occurs, falls back to proxy upload through `/api/media/upload`

## Testing
After this fix:
- ✅ Signed upload URLs are generated successfully
- ✅ Files upload directly from browser to Wix Media Manager
- ✅ Real Wix media URLs are returned (not base64 or fabricated URLs)
- ✅ PSD files are rejected with user-friendly message
- ✅ File size limits are enforced
- ✅ Fallback proxy path works if direct upload fails

## Related Issues Fixed
This fix resolves:
- HTTP 413 errors (Content Too Large) - now handled gracefully with proper error messages
- "files is not a function" error - SDK context now properly provided
- Fallback proxy path - still works as safety net for network-level failures
