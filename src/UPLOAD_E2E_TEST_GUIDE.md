# Upload Flow End-to-End Test Guide

## Quick Start

This guide walks you through testing the complete image upload flow from the admin panel to Wix Media Manager.

## Prerequisites

1. **Browser DevTools Open** - Press F12
2. **Network Tab Active** - Set filter to "XHR" or "Fetch"
3. **Console Tab Visible** - Watch for [WIX_MEDIA] logs
4. **Admin Access** - You must be able to access the admin panel
5. **Real JPG Image** - Have a test JPG file ready (not a placeholder)

## Step-by-Step Test

### Step 1: Open Admin Panel

```
1. Click the admin button in the header (usually top-right)
2. Authenticate if needed
3. Navigate to the "Photos" tab
4. Look for an "Upload Image" button or drag-drop area
```

**Expected Result**: Admin panel loads without errors, Photos tab is visible

### Step 2: Select Image File

```
1. Click the upload button or drag a JPG file onto the upload area
2. Select a real JPG image from your computer (not a placeholder)
3. File should be less than 10MB
```

**Expected Result**: File is selected, preview appears (optional)

### Step 3: Monitor Network Request

**In DevTools Network Tab:**

```
Watch for a POST request to: /api/media/generate-upload-url

Expected Request Body:
{
  "fileName": "my-image.jpg",
  "mimeType": "image/jpeg",
  "kind": "image"
}
```

**Expected Response (HTTP 200):**

```json
{
  "success": true,
  "uploadUrl": "https://[wix-domain]/upload/...",
  "fileName": "my-image.jpg",
  "mimeType": "image/jpeg",
  "expiresAt": "2026-08-03T12:34:56Z"
}
```

### Step 4: Verify Upload URL

**CRITICAL CHECK**: The `uploadUrl` must be a REAL Wix domain.

✅ **Valid Examples:**
- `https://upload.wixmp.com/...`
- `https://files.wix.com/...`
- `https://media.wix.com/...`
- `https://wix-media-upload.wix.com/...`

❌ **Invalid Examples (FAIL TEST):**
- `https://placeholder-url.com/...`
- `https://example.com/...`
- `http://localhost:3000/...`
- `http://127.0.0.1/...`
- `https://mock-upload-url.com/...`
- `data:image/jpeg;base64,...`

**Action**: If URL is invalid, STOP and check server logs.

### Step 5: Monitor Upload to Wix

**In DevTools Network Tab:**

```
Watch for a PUT request to the uploadUrl (from Step 4)

Expected:
- Method: PUT
- Status: 200-299 (success range)
- No CORS errors
- File bytes are sent in request body
```

**In DevTools Console:**

```
Watch for log: [WIX_MEDIA] File uploaded successfully
```

**Expected Result**: Upload completes within 30 seconds

### Step 6: Monitor Media URL Retrieval

**In DevTools Network Tab:**

```
Watch for a POST request to: /api/media/get-media-url

Expected Request Body:
{
  "fileName": "my-image.jpg"
}

Expected Response (HTTP 200):
{
  "success": true,
  "mediaUrl": "wix:image://..." or "https://static.wixstatic.com/..."
}
```

**In DevTools Console:**

```
Watch for log: [WIX_MEDIA] Retrieved media URL: [url]
```

### Step 7: Verify Admin Panel Success

```
1. Check for success message in admin panel
2. Verify preview image displays
3. Confirm no error messages appear
4. Check that image is saved to CMS
```

**Expected Result**: Success message, preview visible, no errors

### Step 8: Verify in Wix Media Manager

```
1. Log into Wix Business Manager
2. Go to Media Manager
3. Search for your uploaded image by filename
4. Click on the image to view details
5. Verify image displays correctly
```

**Expected Result**: Image appears in Media Manager within 30 seconds

## Server Logs Verification

Check server logs for the complete flow:

```
[GENERATE_UPLOAD_URL] ===== REQUEST STARTED =====
[GENERATE_UPLOAD_URL] Request [ID] filename received
[GENERATE_UPLOAD_URL] Request [ID] MIME type received
[GENERATE_UPLOAD_URL] Request [ID] validation passed
[GENERATE_UPLOAD_URL] Request [ID] initializing Wix SDK
[GENERATE_UPLOAD_URL] Request [ID] Wix context obtained
[GENERATE_UPLOAD_URL] Request [ID] creating media client
[GENERATE_UPLOAD_URL] Request [ID] media client created
[GENERATE_UPLOAD_URL] Request [ID] calling generateFileUploadUrl
[GENERATE_UPLOAD_URL] Request [ID] generateFileUploadUrl succeeded
[GENERATE_UPLOAD_URL] Request [ID] validating upload URL response
[GENERATE_UPLOAD_URL] Request [ID] verifying upload URL
[GENERATE_UPLOAD_URL] Request [ID] upload URL parsed
[GENERATE_UPLOAD_URL] ===== REQUEST COMPLETED SUCCESSFULLY =====
```

**All 9 stages should complete without errors.**

## Error Handling Test

### Test 1: Invalid File Type

```
1. Try to upload a .txt file
2. Expected Error: "Image upload failed: this file format is not supported. Please use JPG, PNG, WebP, GIF, SVG, TIFF, or BMP."
3. Verify error is SPECIFIC (not generic "Upload failed")
```

### Test 2: Oversized File

```
1. Try to upload a file > 10MB
2. Expected Error: "File too large. Max 10MB, received [size]MB"
3. Verify error message is ACTIONABLE
```

### Test 3: Network Error

```
1. Open DevTools Network tab
2. Set throttling to "Offline"
3. Try to upload
4. Expected: Clear error message about network
5. Verify error is NOT generic
```

## Cookie & Security Warnings

### Check for SameSite Cookie Warning

```
In DevTools Console, you might see:
"A cookie associated with a cross-site resource was set without the `SameSite` attribute..."

This is NORMAL and should NOT prevent authentication.

Verify:
1. Admin session persists after warning
2. Upload still completes successfully
3. No 401/403 errors occur
```

### Check for Vite HMR Errors

```
In DevTools Console, you might see:
"WebSocket connection to 'ws://localhost:5173/...' failed"

This is NORMAL in development and should NOT affect production.

Verify:
1. Upload completes despite HMR error
2. No upload failures due to HMR
3. Production build would not have this error
```

## Troubleshooting

### Issue: Upload URL is placeholder

**Symptoms:**
- uploadUrl contains "placeholder", "example", "localhost", or "mock"
- Image doesn't appear in Wix Media Manager

**Solution:**
1. Check server logs for errors during URL generation
2. Verify Wix SDK is properly initialized
3. Check Wix API credentials in environment
4. Restart backend server

### Issue: HTTP 500 from generate-upload-url

**Symptoms:**
- Response status is 500
- Error message in response

**Solution:**
1. Check server logs for detailed error
2. Look for "Failed to initialize Wix SDK" message
3. Verify Wix context is available
4. Check media client initialization

### Issue: Upload fails with 403 Forbidden

**Symptoms:**
- PUT request to uploadUrl returns 403
- File doesn't upload to Wix

**Solution:**
1. Verify upload URL is fresh (not cached)
2. Check URL hasn't expired
3. Verify file MIME type matches request
4. Check Wix permissions

### Issue: Image doesn't appear in Media Manager

**Symptoms:**
- Upload completes successfully
- Image not visible in Wix Media Manager

**Solution:**
1. Wait 5-10 seconds (indexing delay)
2. Refresh Media Manager page
3. Search by filename
4. Check file permissions in Wix

### Issue: Generic error message

**Symptoms:**
- Error says "Upload failed" with no details
- Can't determine root cause

**Solution:**
1. Check browser console for [WIX_MEDIA] logs
2. Check server logs for detailed error
3. Look for specific error code (VALIDATION_ERROR, NETWORK_ERROR, etc.)
4. Report with full error details

## Success Checklist

- [ ] Upload URL is a real Wix domain (not placeholder)
- [ ] HTTP 200 response from /api/media/generate-upload-url
- [ ] File successfully uploads to Wix (PUT request succeeds)
- [ ] Image appears in Wix Media Manager within 30 seconds
- [ ] Admin panel shows success message
- [ ] Error messages are specific and actionable
- [ ] No placeholder URLs anywhere in flow
- [ ] SameSite cookie warning doesn't prevent auth
- [ ] Vite HMR errors don't break upload
- [ ] All 9 server log stages complete

## When to Report Issues

Report an issue if:
1. Upload URL contains placeholder text
2. HTTP status is not 200 from backend
3. File doesn't appear in Wix Media Manager after 30 seconds
4. Error messages are generic ("Upload failed")
5. Authentication fails due to cookie warnings
6. Upload breaks due to HMR/WebSocket errors
7. Any stage in server logs shows error

## Next Steps After Successful Test

1. Test with different image formats (PNG, WebP)
2. Test with various file sizes (1MB, 5MB, 10MB)
3. Test on different browsers
4. Test with slow network (DevTools throttling)
5. Test with admin session expired
6. Test error cases (invalid file, oversized file)
7. Verify production build works the same way

---

**Document Version**: 1.0
**Last Updated**: 2026-08-03
**Status**: Ready for Testing
