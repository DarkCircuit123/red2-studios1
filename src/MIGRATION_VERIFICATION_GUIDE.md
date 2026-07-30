# Portfolio Base64 Image Migration & Verification Guide

## Overview

This guide provides step-by-step instructions to:
1. **Scan** Portfolio items for base64 image data
2. **Migrate** base64 images to Wix Media Manager
3. **Verify** that no base64 data remains in the CMS
4. **Audit** the codebase for any remaining base64 usage

---

## Step 1: Scan for Base64 Images

### Endpoint
```
GET /api/portfolio-scan
```

### What it does
- Fetches all Portfolio items from the CMS
- Analyzes each item's image fields (mainImage, galleryImage1-3)
- Identifies which items contain base64 data
- Returns detailed analysis

### How to run
```bash
# Using curl
curl -X GET http://localhost:3000/api/portfolio-scan

# Or in browser
# Navigate to: http://localhost:3000/api/portfolio-scan
```

### Expected response
```json
{
  "success": true,
  "totalItems": 42,
  "itemsWithBase64": 5,
  "items": [
    {
      "_id": "portfolio_123",
      "projectName": "Project Name",
      "mainImage": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
      "galleryImage1": "https://static.wixstatic.com/media/...",
      "hasBase64": {
        "mainImage": true,
        "galleryImage1": false,
        "galleryImage2": false,
        "galleryImage3": false
      }
    }
  ],
  "analysis": [...]
}
```

### What to look for
- `itemsWithBase64`: Number of items containing base64 data
- `hasBase64` object: Which fields contain base64 for each item
- If `itemsWithBase64 > 0`, proceed to Step 2

---

## Step 2: Migrate Base64 Images

### Endpoint
```
POST /api/portfolio-migration
```

### What it does
1. Scans all Portfolio items
2. For each base64 image found:
   - Converts base64 to File object
   - Uploads to Wix Media Manager via `/api/media/upload`
   - Receives Wix media URL
   - Updates the Portfolio item with new URL
3. Logs all operations (success/failure)
4. Returns migration summary

### How to run
```bash
# Using curl
curl -X POST http://localhost:3000/api/portfolio-migration

# Or in browser (JavaScript console)
fetch('/api/portfolio-migration', { method: 'POST' })
  .then(r => r.json())
  .then(data => console.log(data))
```

### Expected response
```json
{
  "success": true,
  "result": {
    "totalItems": 42,
    "itemsWithBase64": 5,
    "successfulMigrations": 5,
    "failedMigrations": 0,
    "skippedItems": 0,
    "logs": [
      {
        "timestamp": "2026-07-30T10:30:00.000Z",
        "itemId": "portfolio_123",
        "field": "mainImage",
        "status": "success",
        "message": "Migrated base64 to Wix Media URL",
        "details": {
          "originalSize": 2097152,
          "newUrl": "https://static.wixstatic.com/media/..."
        }
      }
    ],
    "summary": "Migration Complete:\n- Total items scanned: 42\n- Items with base64: 5\n- Successful migrations: 5\n- Failed migrations: 0\n- Skipped items: 0\n- Success rate: 100.0%"
  }
}
```

### What to look for
- `successfulMigrations` should equal `itemsWithBase64`
- `failedMigrations` should be 0
- Check `logs` for any errors
- If failures occur, review error messages and retry

---

## Step 3: Verify Migration Success

### Endpoint
```
GET /api/portfolio-verify
```

### What it does
- Fetches all Portfolio items again
- Checks each image field for remaining base64 data
- Calculates clean percentage
- Returns detailed verification report

### How to run
```bash
# Using curl
curl -X GET http://localhost:3000/api/portfolio-verify

# Or in browser
# Navigate to: http://localhost:3000/api/portfolio-verify
```

### Expected response (SUCCESS)
```json
{
  "success": true,
  "result": {
    "totalItems": 42,
    "itemsWithBase64": 0,
    "itemsClean": 42,
    "cleanPercentage": 100.0,
    "status": "success",
    "details": []
  },
  "summary": "Verification Complete:\n- Total items: 42\n- Items with base64: 0\n- Items clean: 42\n- Clean percentage: 100.0%\n- Status: SUCCESS"
}
```

### Expected response (WARNING - some base64 remains)
```json
{
  "success": true,
  "result": {
    "totalItems": 42,
    "itemsWithBase64": 2,
    "itemsClean": 40,
    "cleanPercentage": 95.2,
    "status": "warning",
    "details": [
      {
        "itemId": "portfolio_456",
        "projectName": "Failed Project",
        "base64Fields": ["galleryImage2"]
      }
    ]
  },
  "summary": "..."
}
```

### What to look for
- `status` should be "success"
- `itemsWithBase64` should be 0
- `cleanPercentage` should be 100.0
- If not, review the `details` array for items that still have base64
- Retry migration for those specific items

---

## Step 4: Audit Codebase for Base64 Usage

### Search for problematic patterns
The following patterns should NOT be used for CMS storage:

#### 1. FileReader.readAsDataURL()
```bash
grep -r "readAsDataURL" src/
```
**Expected:** Only in documentation or comments, NOT in active code

#### 2. data:image/ strings
```bash
grep -r "data:image/" src/ --exclude-dir=styles --exclude-dir=lib
```
**Expected:** Only in CSS (grain texture), NOT in components or API handlers

#### 3. canvas.toDataURL()
```bash
grep -r "toDataURL" src/
```
**Expected:** Only for format detection (WebP/AVIF support), NOT for image storage

#### 4. Base64 in CMS updates
```bash
grep -r "base64" src/components/ src/api/ --exclude-dir=ui
```
**Expected:** Only in migration/verification scripts, NOT in normal upload flow

### Detailed search results

**readAsDataURL occurrences:**
- ✅ `/src/IMAGE_UPLOAD_MIGRATION_GUIDE.md` - Documentation only
- ✅ `/src/WDE0009_FIX_SUMMARY.md` - Historical reference
- ✅ `/src/lib/upload-queue.ts:336` - Comment explaining why NOT to use it

**data:image/ occurrences:**
- ✅ `/src/tailwind.config.mjs:7` - CSS grain texture (legitimate)
- ✅ `/src/styles/global.css:20` - CSS cursor (legitimate)
- ✅ `/src/styles/cinema.css:27` - CSS noise pattern (legitimate)
- ✅ `/src/components/NextGenGraphicsLayer.tsx:319` - CSS background (legitimate)
- ✅ Documentation files - References only

**toDataURL occurrences:**
- ✅ `/src/lib/image-optimization.ts:243` - WebP format detection
- ✅ `/src/lib/adaptive-image-loading.ts:151,153` - AVIF format detection

### Verification checklist
- [ ] No `readAsDataURL` in active component/API code
- [ ] No `data:image/` in component/API code (only CSS)
- [ ] No `toDataURL` used for image storage (only format detection)
- [ ] All image uploads go through `/api/media/upload`
- [ ] All CMS image fields contain URLs, not base64
- [ ] Migration script successfully converted all base64 to URLs

---

## Step 5: Verify Upload Flow

### Test uploading a new image

1. **Navigate to Portfolio page**
   - Go to `/portfolio` or admin panel

2. **Upload a 20-50 MB JPEG**
   - Select a large image file
   - Observe upload progress

3. **Verify network requests**
   - Open DevTools → Network tab
   - Look for POST to `/api/media/upload`
   - Verify response contains `mediaUrl` (not base64)

4. **Check CMS item**
   - Open Portfolio CMS collection
   - Find the item you just uploaded
   - Verify `mainImage` field contains URL, not base64

### Expected network flow
```
Browser
  ↓ (FormData with File)
/api/media/upload
  ↓ (ArrayBuffer)
Wix Media Manager
  ↓ (media URL)
Response with mediaUrl
  ↓ (URL string)
wixData.update()
  ↓ (stores URL reference)
CMS Item
```

### Success indicators
- ✅ Upload completes without "Document too large" error
- ✅ Network request shows FormData (not base64)
- ✅ Response contains `mediaUrl` starting with `https://`
- ✅ CMS item shows URL in image field, not base64
- ✅ Image displays correctly on portfolio page

---

## Step 6: Monitor for Regressions

### Ongoing checks

**Weekly:**
- [ ] Verify no new base64 images in Portfolio items
- [ ] Check upload flow still works correctly
- [ ] Monitor error logs for "Document too large" errors

**Before deployment:**
- [ ] Run verification endpoint
- [ ] Confirm 100% clean status
- [ ] Test upload with large file (50+ MB)
- [ ] Verify CMS item contains URL, not base64

### Automated verification
Add to CI/CD pipeline:
```bash
# Check for base64 in Portfolio items
curl -s http://localhost:3000/api/portfolio-verify | jq '.result.status'
# Should output: "success"
```

---

## Troubleshooting

### Issue: Migration fails with "Upload failed"
**Cause:** Media upload endpoint not working
**Solution:**
1. Check `/api/media/upload` is accessible
2. Verify Wix Media Manager integration
3. Check file size (max 100MB)
4. Review error logs for details

### Issue: Some items still have base64 after migration
**Cause:** Migration didn't complete for those items
**Solution:**
1. Check migration logs for specific errors
2. Verify those items are readable from CMS
3. Retry migration for failed items
4. Check CMS permissions

### Issue: Upload works but image not stored correctly
**Cause:** CMS update failed
**Solution:**
1. Verify CMS write permissions
2. Check Portfolio item structure
3. Ensure image field accepts URLs
4. Review update API response

### Issue: "Document too large" error still occurs
**Cause:** Old base64 data still in CMS
**Solution:**
1. Run verification endpoint
2. Identify items with base64
3. Manually delete base64 from those items
4. Re-run migration

---

## Summary

| Step | Endpoint | Purpose | Expected Result |
|------|----------|---------|-----------------|
| 1 | `GET /api/portfolio-scan` | Find base64 images | Identify items to migrate |
| 2 | `POST /api/portfolio-migration` | Migrate to Wix Media | All base64 converted to URLs |
| 3 | `GET /api/portfolio-verify` | Verify migration | 100% clean status |
| 4 | Code search | Audit codebase | No base64 in active code |
| 5 | Manual test | Test upload flow | Large files upload successfully |
| 6 | Ongoing | Monitor regressions | No new base64 images |

---

## Production Checklist

Before considering the fix complete:

- [ ] Scan shows 0 items with base64
- [ ] Migration completes with 100% success rate
- [ ] Verification shows 100% clean
- [ ] Codebase audit shows no problematic base64 usage
- [ ] Upload test succeeds with 50+ MB file
- [ ] CMS item contains URL, not base64
- [ ] No "Document too large" errors in logs
- [ ] All image fields display correctly on site

Once all items are checked, the migration is **production-ready**.
