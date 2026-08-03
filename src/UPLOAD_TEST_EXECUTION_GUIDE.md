# Production Upload Test - Execution Guide

## Overview
This guide explains how to run the production upload test to verify the complete end-to-end upload pipeline to Wix Media Manager.

## Test Architecture

### Components
1. **UploadProductionTest.tsx** - Client-side test component that executes all 5 steps
2. **UploadTestPage.tsx** - Dedicated page for running the test
3. **generate-upload-url.ts** - Backend API endpoint to generate signed upload URLs
4. **get-media-url.ts** - Backend API endpoint to retrieve media URLs after upload
5. **upload-test-runner.ts** - Server-side test runner utility (optional)

### Test Flow

```
Step 1: Create Test JPG
  ├─ Creates a 100x100 red JPEG in browser
  ├─ Captures: fileName, fileSize, mimeType
  └─ Duration: ~5-10ms

Step 2: Generate Upload URL (Backend)
  ├─ POST /api/media/generate-upload-url
  ├─ Wix SDK: media(wixContext).files.generateFileUploadUrl()
  ├─ Captures: uploadUrl, expiresAt, HTTP status
  ├─ Validates: Wix domain (wix, files, media, wixmp)
  └─ Duration: ~500-1000ms

Step 3: Upload File to Wix
  ├─ PUT request to uploadUrl with file blob
  ├─ Headers: Content-Type: image/jpeg
  ├─ Captures: HTTP status, file size
  └─ Duration: ~1000-3000ms (depends on network)

Step 4: Retrieve Media URL (Backend)
  ├─ POST /api/media/get-media-url
  ├─ Wix SDK: media(wixContext).files.listFiles()
  ├─ Find file by fileName
  ├─ Captures: mediaUrl, mediaId, HTTP status
  └─ Duration: ~500-1000ms

Step 5: Verify Image Exists
  ├─ HEAD request to mediaUrl
  ├─ Captures: HTTP status, content-type, content-length
  └─ Duration: ~200-500ms

Total Expected Duration: 2-5 seconds
```

## How to Run the Test

### Option 1: Via Browser UI (Recommended)

1. **Navigate to the test page:**
   ```
   http://localhost:3000/upload-test
   ```

2. **Click "Start Upload Test" button**

3. **Monitor the test execution:**
   - Watch each step complete in real-time
   - See status indicators (pending → running → success/error)
   - View detailed output for each step

4. **Review results:**
   - Success: Green checkmark with media URL
   - Failure: Red alert with error message
   - Download logs for debugging

### Option 2: Via Console (Advanced)

```javascript
// In browser console
const testComponent = document.querySelector('[data-test-component]');
// Manually trigger the test via the component's internal state
```

## Expected Output

### Success Case
```
Step 1: Create Test JPG File ✓
  fileName: test-upload-1722614400000.jpg
  fileSize: 1024 bytes
  mimeType: image/jpeg
  Duration: 8ms

Step 2: Generate Upload URL (Backend) ✓
  uploadUrlDomain: files.wixstatic.com
  uploadUrlLength: 256
  expiresAt: 2024-08-03T12:00:00Z
  Duration: 742ms

Step 3: Upload File to Wix Media Manager ✓
  uploadStatus: 200
  uploadDuration: 1523ms
  fileSize: 1024 bytes

Step 4: Retrieve Media URL (Backend) ✓
  mediaUrl: https://files.wixstatic.com/ugd/...
  mediaId: abc123def456
  Duration: 634ms

Step 5: Verify Image in Wix Media Manager ✓
  mediaUrl: https://files.wixstatic.com/ugd/...
  contentType: image/jpeg
  contentLength: 1024
  Duration: 287ms

PRODUCTION UPLOAD TEST COMPLETED SUCCESSFULLY ✓
  mediaUrl: https://files.wixstatic.com/ugd/...
  fileName: test-upload-1722614400000.jpg
  totalDuration: 3194ms
```

### Failure Cases

#### Step 2 Fails: Backend cannot generate upload URL
```
Error: Backend returned HTTP 500: Failed to initialize Wix SDK
Possible causes:
  - Wix API key not configured
  - getSecureContext() not available
  - Media API not initialized
  - Permission denied on Wix account
```

#### Step 3 Fails: Upload to Wix fails
```
Error: Upload failed with HTTP 403
Possible causes:
  - Upload URL expired
  - Invalid file format
  - CORS issue
  - Wix Media Manager temporarily unavailable
```

#### Step 4 Fails: Cannot retrieve media URL
```
Error: File not found: test-upload-1722614400000.jpg
Possible causes:
  - File not yet indexed in Wix Media Manager
  - Incorrect fileName
  - File deleted after upload
  - Wix API rate limit exceeded
```

#### Step 5 Fails: Image not accessible
```
Error: Image verification failed: HTTP 404
Possible causes:
  - Media URL is invalid
  - Image was deleted
  - CDN cache not updated yet
  - Wix Media Manager issue
```

## Debugging

### View Console Logs
1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for `[TEST]` prefixed messages
4. Each log includes timestamp, level, and data

### Download Test Logs
1. After test completes, click "Download Logs" button
2. Saves as `upload-test-TIMESTAMP.log`
3. Contains all test steps and API responses

### Check Server Logs
1. Look for `[GENERATE_UPLOAD_URL]` and `[GET_MEDIA_URL]` prefixed logs
2. Each request has a unique `requestId` for tracing
3. Logs include:
   - Request validation
   - SDK initialization
   - API calls
   - Response validation
   - Error details with stack traces

### Common Issues & Solutions

#### Issue: "Backend did not return an uploadUrl"
**Solution:**
- Check Wix SDK is properly initialized
- Verify API key in environment variables
- Check Wix Media API permissions
- Review server logs for detailed error

#### Issue: "Upload failed with HTTP 403"
**Solution:**
- Verify upload URL is from valid Wix domain
- Check file MIME type is correct
- Ensure upload URL hasn't expired
- Try again (may be temporary Wix issue)

#### Issue: "File not found: test-upload-..."
**Solution:**
- Wait a few seconds (indexing delay)
- Check file was actually uploaded (Step 3)
- Verify fileName matches exactly
- Check Wix Media Manager UI manually

#### Issue: "Image verification failed: HTTP 404"
**Solution:**
- Wait for CDN propagation (usually <5 seconds)
- Verify media URL is correct
- Check image wasn't deleted
- Try accessing URL directly in browser

## Test Metrics

### Performance Benchmarks
- **Step 1 (Create JPG):** 5-15ms
- **Step 2 (Generate URL):** 500-1500ms
- **Step 3 (Upload):** 1000-5000ms (network dependent)
- **Step 4 (Get URL):** 500-1500ms
- **Step 5 (Verify):** 200-1000ms
- **Total:** 2-9 seconds

### Success Rate
- Target: 95%+ success rate
- Common failures: Network timeouts, Wix API rate limits
- Retry strategy: Automatic retry on Step 4 if file not found

## Integration with CI/CD

### Running Tests Automatically
```bash
# Run test via API
curl -X POST http://localhost:3000/api/upload-test \
  -H "Content-Type: application/json" \
  -d '{"runTest": true}'
```

### Expected Response
```json
{
  "success": true,
  "steps": [
    {
      "name": "Create Test JPG File",
      "status": "success",
      "duration": 8,
      "details": { ... }
    },
    ...
  ],
  "totalDuration": 3194,
  "mediaUrl": "https://files.wixstatic.com/ugd/...",
  "mediaId": "abc123def456",
  "fileName": "test-upload-1722614400000.jpg"
}
```

## Troubleshooting Checklist

- [ ] Wix API key configured in environment
- [ ] Wix SDK properly initialized
- [ ] Media API permissions enabled
- [ ] Backend endpoints accessible
- [ ] CORS headers configured correctly
- [ ] Upload URL domain is valid Wix domain
- [ ] File MIME type is correct
- [ ] Network connectivity stable
- [ ] Wix Media Manager not rate-limited
- [ ] Sufficient storage quota in Wix account

## Next Steps

1. **Run the test:** Navigate to `/upload-test` and click "Start Upload Test"
2. **Monitor execution:** Watch all 5 steps complete
3. **Review results:** Check success/failure status
4. **Download logs:** Save logs for analysis if needed
5. **Verify image:** Check image appears in Wix Media Manager UI
6. **Iterate:** Fix any issues and re-run test

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review server logs for detailed error messages
3. Download test logs for analysis
4. Check Wix API documentation
5. Verify Wix account permissions and quotas
