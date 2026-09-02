# Upload Gallery 406 UNSUPPORTED_FILE_FORMAT Fix - FINAL

## Problem
The `/api/media/upload-gallery` endpoint was returning 500 errors with Wix Media returning 406 UNSUPPORTED_FILE_FORMAT. The frontend was sending correct JPEG files with proper MIME types, but the backend handler was losing the filename and/or mimeType before calling Wix Media.

## Root Cause
The old backend handler was using `files.generateFileUploadUrl()` from `@wix/media` (frontend API), which:
1. Generates a signed upload URL
2. Requires a separate PUT request to upload the file
3. Is complex and error-prone
4. Was not properly passing filename with extension to Wix

The correct approach is to use `mediaManager.upload()` from `wix-media-backend` (backend API), which:
1. Handles the entire upload in one call
2. Takes 4 arguments in a specific order
3. Requires mimeType to be nested inside `mediaOptions`
4. Requires a Buffer (not base64 string)
5. Returns `{ fileUrl: 'wix:image://...' }` directly

## Solution

### Backend Fix: `/src/api/media/upload-gallery.ts`

**Changed from:**
- Using `files.generateFileUploadUrl()` (frontend API)
- Generating signed URLs and making separate PUT requests
- Complex multi-step process with potential data loss

**Changed to:**
- Using `mediaManager.upload()` (backend API)
- Direct upload in one call
- Correct argument order and structure

**Key Changes:**

1. **Import Change:**
   ```typescript
   // OLD
   import { files } from '@wix/media';
   import { auth } from '@wix/essentials';
   
   // NEW
   import { mediaManager } from 'wix-media-backend';
   ```

2. **Upload Call - Correct Contract:**
   ```typescript
   uploadResult = await mediaManager.upload(
     '/portfolio',                 // 1: destination folder, leading slash
     buffer,                       // 2: Buffer, NOT base64 string
     sanitizedFileName,            // 3: filename WITH extension
     {                             // 4: options
       mediaOptions: {
         mimeType: mimeType,       // MUST be nested here
         mediaType: 'image'
       },
       metadataOptions: { 
         isPrivate: false, 
         isVisitorUpload: false 
       }
     }
   );
   ```

3. **Buffer Conversion:**
   ```typescript
   const arrayBuffer = await file.arrayBuffer();
   const buffer = Buffer.from(arrayBuffer);
   ```

4. **Response Handling:**
   ```typescript
   // OLD: uploadResult?.file?.url
   // NEW: uploadResult?.fileUrl
   const mediaUrl = uploadResult?.fileUrl;
   ```

5. **Critical Logging:**
   - Logs fileName, mimeType, and buffer.length before upload
   - Logs full error object on failure
   - Returns specific error message to client instead of bare 500

### Frontend Verification: `/src/components/AdminPanel/sections/WorkGalleryManager.tsx`

✅ **Already Correct:**
- Sends FormData with file object (not base64)
- Frontend extracts mimeType from File.type
- Only inserts CMS row after successful upload
- Uses returned mediaUrl to populate image field
- Handles upload failures without creating orphaned CMS rows

**Flow:**
1. Frontend uploads file via FormData
2. Backend receives file, validates, converts to Buffer
3. Backend calls mediaManager.upload() with correct contract
4. Backend returns { success: true, mediaUrl: 'wix:image://...' }
5. Frontend creates CMS row with returned mediaUrl
6. If upload fails, no CMS row is created

## Testing Checklist

- [x] Backend receives File object from FormData
- [x] fileName extracted with extension intact
- [x] mimeType detected from File.type (browser-provided)
- [x] File converted to Buffer (not base64 string)
- [x] mediaManager.upload() called with 4 arguments in correct order
- [x] mimeType nested inside mediaOptions (not at top level)
- [x] Folder path has leading slash: '/portfolio'
- [x] Error logging captures full error object
- [x] Success returns { fileUrl: 'wix:image://...' }
- [x] Frontend only creates CMS row on success
- [x] Frontend uses returned mediaUrl in image field

## Files Modified

1. `/src/api/media/upload-gallery.ts` - Complete rewrite using mediaManager.upload()
2. `/src/components/AdminPanel/sections/WorkGalleryManager.tsx` - No changes needed (already correct)

## Expected Behavior After Fix

1. **Upload Flow:**
   - Frontend sends JPEG file via FormData
   - Backend receives file, validates MIME type
   - Backend converts to Buffer
   - Backend calls mediaManager.upload() with correct contract
   - Wix Media accepts upload (no 406 error)
   - Backend returns wix:image:// URL
   - Frontend creates CMS row with URL

2. **Error Handling:**
   - If upload fails, specific error message returned to client
   - No orphaned CMS rows created
   - Full error logged for debugging

3. **Logging:**
   - [UPLOAD_GALLERY_CRITICAL_ARGS] - Arguments before upload
   - [UPLOAD_GALLERY_ERROR_CRITICAL] - Full error object on failure
   - [UPLOAD_GALLERY] - Success/failure summary

## Contract Verification

✅ **mediaManager.upload() Contract Met:**
- Arg 1: '/portfolio' (folder with leading slash)
- Arg 2: Buffer (not base64 string)
- Arg 3: sanitizedFileName (with extension)
- Arg 4: options with mediaOptions.mimeType nested correctly

✅ **Frontend Contract Met:**
- Sends FormData with file
- Extracts mediaUrl from response
- Only creates CMS row on success
- Uses mediaUrl in image field
