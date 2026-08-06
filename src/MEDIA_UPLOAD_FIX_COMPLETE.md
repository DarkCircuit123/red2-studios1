# Media Upload Fix - Complete

## Summary
Fixed the `(0 , __vite_ssr_import_0__.files) is not a function` runtime 500 error by correcting the Wix Media SDK import pattern and adding mandatory auth elevation.

## Changes Made

### 1. STEP 0 - Route Directory Analysis
**Finding:** The project uses **Astro** with both `/src/pages/api/` and `/src/api/` directories.
- **Live Directory:** `/src/pages/api/media/` (Astro's standard API routes)
- **Dead Code:** `/src/api/media/` (duplicate, not served by Astro)

**Action:** Fixed both directories to prevent confusion, but only `/src/pages/api/media/` is actually served.

### 2. STEP 1 - Corrected Import and Call Pattern

**Before (WRONG):**
```typescript
import { files } from '@wix/media';
const filesClient = files();  // ❌ files is NOT a factory function
await filesClient.generateFileUploadUrl(mimeType, { fileName });
```

**After (CORRECT):**
```typescript
import { files } from '@wix/media';
import { auth } from '@wix/essentials';

const generateUrl = auth.elevate(files.generateFileUploadUrl);
await generateUrl(mimeType, {
  fileName,
  parentFolderId: 'media-root',
  private: false,
});
```

**Key Fix:** `files` is a **namespace object**, not a factory function. Methods hang off it directly.

### 3. STEP 2 - Added Mandatory Auth Elevation

**Files Updated:**
- `/src/pages/api/media/generate-upload-url.ts`
- `/src/api/media/generate-upload-url.ts`
- `/src/api/media/get-media-url.ts`

**Why:** `generateFileUploadUrl` requires `MEDIA.SITE_MEDIA_FILES_UPLOAD` scope. Without `auth.elevate()`, the call runs as a site visitor and returns 403 Forbidden.

**Pattern Applied:**
```typescript
const generateUrl = auth.elevate(files.generateFileUploadUrl);
const listFiles = auth.elevate(files.listFiles);
```

### 4. STEP 3 - Fixed Client Upload Call

**File:** `/src/lib/wix-media-upload-service.ts`

**Corrections:**
- ✅ HTTP method: `PUT` (already correct)
- ✅ Header: `Content-Type` set to real MIME type (added)
- ✅ Body: raw binary stream (already correct)
- ✅ Note: 200 means accepted, not ready. Check `operationStatus` before displaying

**Code:**
```typescript
xhr.open('PUT', uploadUrl);
xhr.setRequestHeader('Content-Type', file.type);  // Added
xhr.send(file);  // Raw binary, not FormData
```

### 5. STEP 4 - Fixed Cookie SameSite Attribute

**Files Updated:**
- `/src/api/auth/admin-login.ts`
- `/src/pages/api/auth/admin-login.ts`

**Change:**
```typescript
// Before
sameSite: 'lax'

// After
sameSite: 'none'  // Required for cross-site requests under *.remote-machine.wix-code.com
```

**Why:** `admin_session` cookie was being rejected cross-site because `SameSite=Lax` blocks third-party cookies. Changed to `SameSite=None; Secure` for cross-site compatibility.

## Verification Checklist

- [x] Reverted incorrect `@wix/sdk` imports (none found - already correct)
- [x] Identified active API directory: `/src/pages/api/media/`
- [x] Corrected `files` import pattern in all media endpoints
- [x] Added `auth.elevate()` wrapper for all restricted media calls
- [x] Updated client upload to use PUT with Content-Type header
- [x] Fixed `admin_session` cookie to `SameSite=None; Secure`

## Project Type

This is a **Wix-managed headless** project using Astro. Auth elevation via `@wix/essentials` applies.

## Next Steps

1. Test media upload flow end-to-end
2. Monitor server logs for any remaining 403/500 errors
3. Verify `admin_session` cookie is sent cross-site
4. Check file upload status via `operationStatus` field
