# Image Upload Diagnostic Guide

## Problem
User reported: **"Image upload failed: this file could not be stored. Please retry the upload."**

## Root Cause Analysis

The image upload system has a two-tier architecture:
1. **Tier 1 (Primary)**: Direct browser-to-Wix Media Manager upload
2. **Tier 2 (Fallback)**: Proxy through backend (`/api/media/upload`)

The error message is generic and can occur at multiple points in the pipeline, making it difficult to diagnose the exact failure point.

## Solution: Enhanced Logging

Added comprehensive console logging at every step of the upload process to identify exactly where failures occur.

### Logging Points Added

#### Frontend (ImageUploadManager.tsx)
```
[ImageUploadManager] Starting image upload for: {filename}
[ImageUploadManager] Created preview URL
[ImageUploadManager] Calling MediaUploadService.uploadImage...
[ImageUploadManager] Upload service returned: { mediaUrl, mediaId }
[ImageUploadManager] ERROR: Got data URL instead of Wix media URL
[ImageUploadManager] WixImageResolver result: { isValid, isFallback }
[ImageUploadManager] ERROR: Invalid URL format from resolver
[ImageUploadManager] Image storage validation passed
[ImageUploadManager] Validating CMS payload...
[ImageUploadManager] Updating CMS with media URL...
[ImageUploadManager] CMS update successful
[ImageUploadManager] No CMS info provided, updating locally
[ImageUploadManager] Error uploading image: {error}
```

#### Direct Upload Engine (direct-media-upload.ts)
```
[GET_UPLOAD_URL] Requesting signed upload URL for {kind}: {filename}
[GET_UPLOAD_URL] Got signed upload URL
[GET_UPLOAD_URL] Failed to parse response: {error}
[GET_UPLOAD_URL] Failed with status {status}: {response}

[UPLOAD] Starting {kind} upload for file: {filename} ({size} bytes)
[UPLOAD] Got signed upload URL, uploading to Wix Media Manager...
[UPLOAD] Response received. mediaUrl: {url}, mediaId: {id}
[UPLOAD] ERROR: Wix Media Manager response missing file URL
[UPLOAD] Direct upload successful: {url}
[UPLOAD] Direct-to-Wix upload failed at the network level, falling back to proxy path
[UPLOAD] Upload failed with error: {error}

[UPLOAD_PROXY] Uploading via proxy endpoint: {endpoint}
[UPLOAD_PROXY] Network error during fallback upload
[UPLOAD_PROXY] Fallback upload was aborted
[UPLOAD_PROXY] Fallback upload timed out
[UPLOAD_PROXY] Failed to parse response: {error}
[UPLOAD_PROXY] Proxy upload failed with status {status}: {response}
[UPLOAD_PROXY] Server returned no media URL
[UPLOAD_PROXY] Proxy upload successful: {url}
```

#### Backend (get-upload-url.ts)
```
[GET_UPLOAD_URL] Request received: fileName={name}, mimeType={type}, sizeInBytes={size}, kind={kind}
[GET_UPLOAD_URL] Missing required parameters
[GET_UPLOAD_URL] Validation failed: {error}
[GET_UPLOAD_URL] Calling files.generateFileUploadUrl...
[GET_UPLOAD_URL] Wix Media Manager did not return an upload URL
[GET_UPLOAD_URL] Successfully generated upload URL
[GET_UPLOAD_URL] Error: {error}
```

#### Backend (upload.ts - Proxy Fallback)
```
[MEDIA_UPLOAD] Starting media upload to Wix Media Manager...
[MEDIA_UPLOAD] File received: {name}, Size: {size}MB, Type: {type}
[MEDIA_UPLOAD] Rejected: {error}
[MEDIA_UPLOAD] Requesting Wix Media Manager upload URL...
[MEDIA_UPLOAD] Uploading file bytes to Wix Media Manager...
[MEDIA_UPLOAD] Media Manager upload failed: {status} {error}
[MEDIA_UPLOAD] Media Manager response missing file URL: {response}
[MEDIA_UPLOAD] Media upload successful in {time}ms
[MEDIA_UPLOAD] Wix Media URL: {url}
[MEDIA_UPLOAD] Error after {time}ms: {error}
```

## How to Use the Logs

### Step 1: Open Browser Developer Tools
- Press `F12` or `Ctrl+Shift+I` (Windows) / `Cmd+Option+I` (Mac)
- Go to the **Console** tab

### Step 2: Attempt Upload
- Try uploading an image
- Watch the console for log messages

### Step 3: Identify Failure Point

#### Scenario A: Logs stop after "Starting image upload"
- **Problem**: File validation failed
- **Check**: Is the file format supported? (JPG, PNG, WebP, GIF, SVG, TIFF, BMP)
- **Check**: Is the file under 100MB?

#### Scenario B: Logs show "Requesting signed upload URL" but then stop
- **Problem**: Backend `/api/media/get-upload-url` failed
- **Check**: Network tab - what HTTP status did the request get?
- **Check**: Is the request body valid? (fileName, mimeType, sizeInBytes required)
- **Check**: Is Wix Media Manager API accessible?

#### Scenario C: Logs show "Got signed upload URL" but then stop
- **Problem**: Direct browser-to-Wix upload failed
- **Check**: Network tab - look for the PUT request to the upload URL
- **Check**: Did it fail with CORS error? (Network tab will show)
- **Check**: Did it timeout? (120 second limit)
- **Check**: If it failed, did it fall back to proxy? (look for "[UPLOAD_PROXY]" logs)

#### Scenario D: Logs show "Uploading via proxy endpoint" but then stop
- **Problem**: Backend `/api/media/upload` failed
- **Check**: Network tab - what HTTP status did the request get?
- **Check**: Is the file too large for the Worker to buffer? (Cloudflare Workers have memory limits)
- **Check**: Did it timeout? (120 second limit)

#### Scenario E: Logs show "Response received. mediaUrl: {url}" but then error
- **Problem**: URL validation failed
- **Check**: Is the URL a data URL? (starts with `data:` or `blob:`)
- **Check**: Is the URL a valid Wix media URL? (should start with `wix:image://` or contain `static.wixstatic.com`)
- **Check**: Did WixImageResolver reject it?

#### Scenario F: Logs show "Updating CMS with media URL" but then error
- **Problem**: CMS update failed
- **Check**: Network tab - what HTTP status did the update request get?
- **Check**: Do you have permission to update this collection?
- **Check**: Is the collection ID and field name correct?

## Common Issues and Solutions

### Issue 1: "Got data URL instead of Wix media URL"
**Cause**: Upload succeeded but returned a blob URL or data URL instead of a real Wix media URL
**Solution**: 
- This indicates a bug in the upload engine
- Check if direct upload is being used or fallback proxy
- If fallback proxy: the backend `/api/media/upload` is returning an invalid URL
- If direct upload: Wix Media Manager response is malformed

### Issue 2: "Network error during direct upload"
**Cause**: Browser-to-Wix connection failed (CORS, network, timeout)
**Solution**:
- Check browser console for CORS errors
- Check network tab for the PUT request to Wix
- Verify internet connection
- Try again - may be temporary network issue
- If persistent, the fallback proxy should have kicked in

### Issue 3: "Failed to get upload URL"
**Cause**: Backend `/api/media/get-upload-url` failed
**Solution**:
- Check network tab for the POST request to `/api/media/get-upload-url`
- Check HTTP status code
- If 400: file validation failed (check file type/size)
- If 500: backend error (check server logs)
- If timeout: backend is slow or unresponsive

### Issue 4: "Server returned no media URL"
**Cause**: Backend proxy upload succeeded but didn't return a URL
**Solution**:
- Check backend logs for `/api/media/upload`
- Verify Wix Media Manager API is responding correctly
- Check if the response format changed

### Issue 5: "CMS update failed"
**Cause**: Database update failed after successful upload
**Solution**:
- Check network tab for the CMS update request
- Verify you have write permissions to the collection
- Check if the collection ID and field name are correct
- The image was uploaded successfully but not saved to the database
- You can manually save the URL to the database

## Network Tab Analysis

When troubleshooting, check the **Network** tab for these requests:

1. **POST /api/media/get-upload-url**
   - Should return 200 with `{ uploadUrl, fileName }`
   - If 400: validation error
   - If 500: backend error

2. **PUT {uploadUrl}** (Direct upload)
   - Should return 200 with `{ file: { url, id } }`
   - If CORS error: network-level failure, will fallback to proxy
   - If timeout: network-level failure, will fallback to proxy
   - If 4xx/5xx: real error, won't fallback

3. **POST /api/media/upload** (Proxy fallback)
   - Should return 200 with `{ mediaUrl, mediaId, ... }`
   - If 400: validation error
   - If 413: file too large
   - If 500: backend error

4. **PATCH /api/collections/{collectionId}/items/{itemId}** (CMS update)
   - Should return 200 with updated item
   - If 403: permission denied
   - If 404: item not found
   - If 500: database error

## Performance Considerations

### Upload Timeouts
- Direct upload: 120 seconds
- Proxy upload: 120 seconds
- If file is very large, may timeout on slow connections

### File Size Limits
- Images: 100MB max
- Validation happens on frontend, backend, and Wix Media Manager
- If file is near limit, may fail on one of these checks

### Memory Usage
- Direct upload: minimal (browser sends directly to Wix)
- Proxy upload: file buffered in Cloudflare Worker memory
- Very large files may cause Worker to run out of memory

## Testing the Upload

### Test 1: Small JPEG
- File: 1-5MB JPEG
- Expected: Should upload successfully
- If fails: indicates fundamental issue

### Test 2: PNG with Transparency
- File: 1-5MB PNG
- Expected: Should upload successfully
- If fails: may be MIME type issue

### Test 3: Large File
- File: 50-100MB image
- Expected: Should upload (may take time)
- If fails: may be timeout or size limit issue

### Test 4: Unsupported Format
- File: .txt, .pdf, .doc
- Expected: Should fail with "unsupported format" message
- If fails: validation not working

## Debugging Checklist

- [ ] Open browser console (F12)
- [ ] Check for any JavaScript errors
- [ ] Attempt upload and watch console logs
- [ ] Identify which "[STAGE]" log appears last
- [ ] Check Network tab for failed requests
- [ ] Verify file format is supported
- [ ] Verify file size is under 100MB
- [ ] Check internet connection
- [ ] Try a different file
- [ ] Try a different browser
- [ ] Clear browser cache and try again
- [ ] Check if Wix Media Manager is accessible
- [ ] Verify collection ID and field name are correct

## When to Contact Support

If you've checked all the above and still have issues:

1. **Collect logs**: Screenshot or copy all console logs
2. **Collect network details**: Screenshot of Network tab showing failed requests
3. **Provide file details**: File name, size, format, MIME type
4. **Provide context**: When did this start? Was it working before?
5. **Provide error message**: Full error message from the UI

Include all of this when reporting the issue.

## Related Files

- `/src/components/ImageUploadManager.tsx` - Frontend upload UI
- `/src/lib/direct-media-upload.ts` - Upload engine with logging
- `/src/lib/media-upload-service.ts` - Upload service wrapper
- `/src/api/media/get-upload-url.ts` - Backend URL generation
- `/src/api/media/upload.ts` - Backend proxy upload
- `/src/lib/upload-config.ts` - Validation rules
- `/src/lib/safeJson.ts` - Safe JSON parsing

## Version History

- **2026-07-31**: Added comprehensive logging to all upload stages
