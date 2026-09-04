# End-to-End Upload Flow Verification Test

## Test Objective
Verify that the complete image upload flow works correctly from the admin panel through to Wix Media Manager, with proper error handling and no placeholder URLs.

## Test Checklist

### Phase 1: Admin Panel Access
- [ ] Open admin panel (click admin button in header)
- [ ] Verify admin authentication works
- [ ] Navigate to "Photos" tab
- [ ] Confirm UI is responsive and ready for upload

### Phase 2: Frontend Request Validation
- [ ] Select a real JPG image file (not placeholder)
- [ ] Verify browser console shows: `[WIX_MEDIA] Starting image upload: [filename]`
- [ ] Confirm POST request to `/api/media/generate-upload-url` is made
- [ ] Verify request body contains:
  - `fileName`: actual filename
  - `mimeType`: "image/jpeg"
  - `kind`: "image"

### Phase 3: Backend Response Validation
- [ ] Check HTTP response status: **200 OK**
- [ ] Verify response body contains:
  ```json
  {
    "success": true,
    "uploadUrl": "https://[wix-domain]/...",
    "fileName": "[actual-filename]",
    "mimeType": "image/jpeg",
    "expiresAt": "[timestamp]"
  }
  ```
- [ ] Verify `uploadUrl` is NOT any of:
  - ❌ `placeholder-url`
  - ❌ `example.com`
  - ❌ `localhost`
  - ❌ `127.0.0.1`
  - ❌ `mock-url`
  - ❌ `data:image/...`
- [ ] Verify `uploadUrl` domain contains one of: `wix`, `files`, `media`, `wixmp`
- [ ] Check server logs show all 9 stages completed:
  1. REQUEST STARTED
  2. FILENAME VALIDATION
  3. MIME TYPE VALIDATION
  4. SDK INITIALIZATION
  5. MEDIA CLIENT INITIALIZATION
  6. UPLOAD URL GENERATION
  7. RESPONSE VALIDATION
  8. UPLOAD URL VERIFICATION
  9. SUCCESS

### Phase 4: Browser Upload to Wix
- [ ] Verify browser console shows: `[WIX_MEDIA] File uploaded successfully`
- [ ] Confirm XHR PUT request to Wix upload URL completes
- [ ] Verify HTTP status from Wix is 200-299 (success range)
- [ ] Check upload progress tracking shows 100%

### Phase 5: Media URL Retrieval
- [ ] Verify POST request to `/api/media/get-media-url` is made
- [ ] Confirm response contains valid `mediaUrl`
- [ ] Verify URL format is one of:
  - `wix:image://...` (Wix media format)
  - `https://static.wixstatic.com/...` (Wix CDN)

### Phase 6: Wix Media Manager Verification
- [ ] Log into Wix Business Manager
- [ ] Navigate to Media Manager
- [ ] Search for uploaded image by filename
- [ ] Confirm image appears in Media Manager
- [ ] Verify image is accessible and displays correctly
- [ ] Check image properties show correct dimensions and file size

### Phase 7: Admin Panel UI Confirmation
- [ ] Verify success message appears in admin panel
- [ ] Confirm preview image displays in the UI
- [ ] Check image is saved to CMS collection
- [ ] Verify no error messages are shown

### Phase 8: Error Handling Verification
- [ ] Test with invalid file type (e.g., .txt file)
  - Expected: Actionable error message (not generic)
  - Example: "Image upload failed: this file format is not supported. Please use JPG, PNG, WebP, GIF, SVG, TIFF, or BMP."
- [ ] Test with oversized file (>10MB)
  - Expected: Clear size limit message
- [ ] Test with network interruption (if possible)
  - Expected: Retry logic or clear error message

### Phase 9: Cookie & Security Warnings
- [ ] Check browser console for warnings
- [ ] Verify `admin_session` cookie SameSite warning (if present) does NOT prevent authentication
- [ ] Confirm authentication persists across requests
- [ ] Verify no CORS errors occur

### Phase 10: Vite HMR/WebSocket Errors
- [ ] Check browser console for Vite HMR errors
- [ ] Verify errors like "localhost:5173 WebSocket" do NOT break upload functionality
- [ ] Confirm upload completes successfully despite any HMR warnings
- [ ] Verify production build would not have these warnings

## Expected Outcomes

### Success Criteria
✅ Upload URL is a real Wix domain (not placeholder)
✅ HTTP 200 response from backend
✅ File successfully uploads to Wix Media Manager
✅ Image appears in Wix Media Manager within 30 seconds
✅ Error messages are actionable and specific
✅ No placeholder URLs are used anywhere
✅ Admin session cookie warnings don't prevent auth
✅ Vite HMR errors don't break production functionality

### Failure Criteria
❌ Upload URL contains placeholder text
❌ HTTP status is not 200
❌ File does not appear in Wix Media Manager
❌ Generic error messages like "Upload failed"
❌ Authentication fails due to cookie warnings
❌ Upload breaks due to HMR errors

## Test Execution Steps

1. **Open Browser DevTools** (F12)
2. **Go to Network Tab** - filter by XHR/Fetch
3. **Go to Console Tab** - watch for [WIX_MEDIA] logs
4. **Open Admin Panel** - click admin button
5. **Select Image** - choose a real JPG file
6. **Monitor Requests**:
   - POST /api/media/generate-upload-url
   - PUT [uploadUrl] (to Wix)
   - POST /api/media/get-media-url
7. **Verify Response** - check each response matches expected format
8. **Check Wix Manager** - verify image appears
9. **Review Logs** - check server logs for all 9 stages

## Common Issues & Fixes

### Issue: "Invalid upload URL domain"
- **Cause**: Backend returning non-Wix domain
- **Fix**: Check Wix SDK initialization and API credentials

### Issue: "Upload failed with status 403"
- **Cause**: Wix upload URL expired or invalid
- **Fix**: Verify URL generation is fresh (not cached)

### Issue: "Could not find uploaded file"
- **Cause**: File uploaded but not indexed in Media Manager yet
- **Fix**: Wait 5-10 seconds and retry, or check file permissions

### Issue: "Network error during upload"
- **Cause**: CORS issue or network connectivity
- **Fix**: Check browser console for CORS errors, verify network

### Issue: "Invalid JSON in request body"
- **Cause**: Frontend sending malformed request
- **Fix**: Check ImageUploadManager component for JSON serialization

## Notes for QA

- Test with different image formats (JPG, PNG, WebP)
- Test with various file sizes (small <1MB, medium 1-5MB, large 5-10MB)
- Test on different browsers (Chrome, Firefox, Safari)
- Test on mobile devices if applicable
- Test with slow network (DevTools throttling)
- Test with admin session expired (should re-authenticate)

## Sign-Off

- [ ] All 10 phases completed successfully
- [ ] No placeholder URLs detected
- [ ] Image appears in Wix Media Manager
- [ ] Error messages are actionable
- [ ] No authentication issues
- [ ] No HMR/WebSocket interference
- [ ] Ready for production deployment

**Test Date**: _______________
**Tester Name**: _______________
**Result**: PASS / FAIL
