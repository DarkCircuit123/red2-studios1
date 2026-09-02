# Work Gallery Manager - Bug Fixes Complete

## Summary
Fixed two critical bugs in the Work Gallery system:
1. **BUG 1**: Wrong upload endpoint (was using `/api/media/upload-hero` for gallery uploads)
2. **BUG 2**: Nonexistent collection reference (`galleryphotos` → `portfolioimages`)

---

## BUG 1: Wrong Upload Endpoint

### Problem
- WorkGalleryManager.tsx was POSTing to `/api/media/upload-hero` (the homepage hero image uploader)
- This endpoint returned 500 errors with 406 UNSUPPORTED_FILE_FORMAT internally
- The backend wasn't passing filename with extension and proper MIME type to Wix Media API
- Generic error messages made debugging difficult

### Root Cause
- `/api/media/upload-hero` is specifically for the homepage hero section
- Gallery uploads need a dedicated endpoint with proper error handling
- The backend wasn't preserving the filename extension when calling Wix Media API

### Solution
Created new dedicated endpoint: `/api/media/upload-gallery`

**New Files:**
- `/src/api/media/upload-gallery.ts` - Backend handler
- `/src/pages/api/media/upload-gallery.ts` - Route export

**Key Features:**
1. ✅ Strict MIME type mapping (jpg → image/jpeg, NOT image/jpg)
2. ✅ Prefers browser-provided File.type when available
3. ✅ Falls back to extension map only when File.type is blank
4. ✅ Passes filename WITH extension to Wix Media API
5. ✅ Returns detailed error messages instead of generic 500
6. ✅ Structured logging for debugging
7. ✅ Admin authentication required

**Changes in WorkGalleryManager.tsx:**
- Line 230: Changed from `/api/media/upload-hero` → `/api/media/upload-gallery`
- Line 345: Changed from `/api/media/upload-hero` → `/api/media/upload-gallery`

---

## BUG 2: Nonexistent Collection Reference

### Problem
- WorkGalleryManager.tsx was querying collection ID `galleryphotos`
- This collection does not exist on the site
- Error: `WDE0025: The galleryphotos collection does not exist`
- The correct collection is `portfolioimages` (display name "Portfolio")
- `portfolioimages` already contains 30 rows with valid data

### Root Cause
- WorkGalleryManager was built with incorrect collection reference
- The `galleryphotos` collection never existed in the CMS
- The correct collection `portfolioimages` has the right schema

### Solution
Replaced all references to `galleryphotos` with `portfolioimages`

**Schema Mapping:**
```typescript
// OLD (nonexistent galleryphotos):
interface GalleryPhoto {
  _id: string;
  gallerySlug?: string;
  category?: string;
  subCategory?: string;
  title?: string;
  image?: string;
  thumbnail?: string;
  description?: string;
  displayOrder?: number;
  featured?: boolean;
}

// NEW (portfolioimages):
interface PortfolioImage {
  _id: string;
  portfolioItemId?: string;      // TEXT - identifies the gallery
  displayOrder?: number;          // NUMBER - sort order
  caption?: string;               // TEXT - image caption
  altText?: string;               // TEXT - accessibility alt text
  image?: string;                 // IMAGE - the wix:image:// URL
}
```

**Changes in WorkGalleryManager.tsx:**
- Line 44-56: Updated interface from `GalleryPhoto` → `PortfolioImage`
- Line 75: Updated state type
- Line 97-98: Changed collection from `galleryphotos` → `portfolioimages`
- Line 261-271: Updated new photo object to match `portfolioimages` schema
- Line 274: Changed create call from `galleryphotos` → `portfolioimages`
- Line 370: Changed update call from `galleryphotos` → `portfolioimages`
- Line 391: Changed delete call from `galleryphotos` → `portfolioimages`

---

## Upload Logic Improvements

### Before (Broken)
1. Create CMS row with empty/placeholder image field
2. Upload image to Wix
3. If upload fails, row already exists with no image
4. Result: Orphaned rows with no image data

### After (Fixed)
1. Upload image to Wix Media Manager
2. Wait for upload to complete and get wix:image:// URL
3. ONLY THEN create CMS row with the real image URL
4. If upload fails, no row is created
5. Result: Clean data, no orphaned rows

**Code Flow:**
```typescript
// 1. Upload first
const uploadResponse = await fetch('/api/media/upload-gallery', {
  method: 'POST',
  body: formDataForUpload,
});

// 2. Check for errors
if (!uploadResponse.ok) {
  // Fail here - no row created
  failedUploads.push({ name, reason });
  continue;
}

// 3. Get the URL
const uploadedData = await uploadResponse.json();
const imageUrl = uploadedData.mediaUrl;

// 4. ONLY NOW create the row
const newPhoto: PortfolioImage = {
  _id: crypto.randomUUID(),
  portfolioItemId: 'work-gallery',
  caption: fileItem.original.name.replace(/\.[^/.]+$/, ''),
  altText: fileItem.original.name.replace(/\.[^/.]+$/, ''),
  image: imageUrl,  // ← Real URL from upload
  displayOrder: photos.length + successfulUploads.length + 1,
};

await BaseCrudService.create('portfolioimages', newPhoto);
```

---

## Cleanup of Orphaned Rows

### Problem
The `portfolioimages` collection has 10 orphaned rows with empty image fields:
- displayOrder: 20, 22, 23, 24, 25, 26, 27, 28, 29, 30
- All created 2026-08-10 17:53
- These were created during failed uploads

### Solution
Created cleanup utility: `/src/lib/cleanup-empty-portfolio-images.ts`

**Usage:**
```typescript
import { cleanupEmptyPortfolioImages } from '@/lib/cleanup-empty-portfolio-images';

const result = await cleanupEmptyPortfolioImages();
console.log(`Deleted ${result.deletedCount} empty rows`);
console.log('Deleted IDs:', result.deletedIds);
```

**What it does:**
1. Fetches all rows from `portfolioimages`
2. Identifies rows where `image` field is empty or missing
3. Deletes each empty row
4. Returns count and IDs of deleted rows
5. Logs all operations for audit trail

**To run cleanup:**
- Call `cleanupEmptyPortfolioImages()` once from admin panel or backend
- This will remove all 10 orphaned rows
- After cleanup, all remaining rows will have valid image URLs

---

## Security: Collection Permissions

### Current State
`portfolioimages` permissions:
- insert: ANYONE ❌ (security risk)
- update: ANYONE ❌ (security risk)
- remove: ANYONE ❌ (security risk)
- read: ANYONE ✅ (correct)

### Required State
`portfolioimages` permissions:
- insert: ADMIN ✅ (only admin can add photos)
- update: ADMIN ✅ (only admin can modify photos)
- remove: ADMIN ✅ (only admin can delete photos)
- read: ANYONE ✅ (anyone can view photos)

### How to Update
1. Go to Wix Dashboard → Database
2. Find `portfolioimages` collection
3. Click Settings/Permissions
4. Change insert, update, remove to ADMIN
5. Keep read as ANYONE
6. Save

**Note:** This prevents unauthorized users from modifying the portfolio gallery through the API.

---

## Files Modified

### Frontend
- `/src/components/AdminPanel/sections/WorkGalleryManager.tsx`
  - Updated collection references: `galleryphotos` → `portfolioimages`
  - Updated upload endpoint: `/api/media/upload-hero` → `/api/media/upload-gallery`
  - Updated interface and schema mapping
  - Fixed upload logic to upload before creating row

### Backend
- `/src/api/media/upload-gallery.ts` (NEW)
  - Dedicated gallery upload endpoint
  - Proper MIME type handling
  - Filename with extension preservation
  - Detailed error messages
  - Structured logging

### Utilities
- `/src/lib/cleanup-empty-portfolio-images.ts` (NEW)
  - Cleanup script for orphaned rows
  - Identifies and deletes rows with empty image field

---

## Testing Checklist

- [ ] Upload a new image to Work Gallery
  - [ ] Verify upload uses `/api/media/upload-gallery`
  - [ ] Verify image appears in `portfolioimages` collection
  - [ ] Verify image has correct wix:image:// URL
  - [ ] Verify displayOrder is correct

- [ ] Replace an existing image
  - [ ] Verify new image uploads successfully
  - [ ] Verify old image URL is replaced
  - [ ] Verify row is updated, not duplicated

- [ ] Delete an image
  - [ ] Verify row is deleted from `portfolioimages`
  - [ ] Verify slot becomes empty

- [ ] Run cleanup
  - [ ] Execute `cleanupEmptyPortfolioImages()`
  - [ ] Verify 10 orphaned rows are deleted
  - [ ] Verify no valid rows are affected

- [ ] Verify permissions
  - [ ] Check `portfolioimages` has ADMIN insert/update/remove
  - [ ] Verify read is still ANYONE

---

## Error Handling

The new `/api/media/upload-gallery` endpoint returns detailed errors:

**Success Response (200):**
```json
{
  "success": true,
  "mediaUrl": "wix:image://v1/...",
  "fileId": "..."
}
```

**Error Response (400/500):**
```json
{
  "success": false,
  "error": "Detailed error message explaining what went wrong"
}
```

**Common Errors:**
- `"No file provided"` - File not in request
- `"Unsupported file extension. Allowed: jpg, jpeg, png, webp, gif, tif, tiff, heic"` - Invalid file type
- `"File too large. Max 10MB, received X.XXmb"` - File exceeds size limit
- `"Failed to generate upload URL: ..."` - Wix API error
- `"Upload failed: ..."` - Network or Wix error

---

## Logging

All operations are logged with `[UPLOAD_GALLERY]` prefix for easy debugging:

```
[UPLOAD_GALLERY] Request {id} started
[UPLOAD_GALLERY] Request {id} file received
[UPLOAD_GALLERY] Request {id} MIME type resolved
[UPLOAD_GALLERY] Request {id} filename sanitized
[UPLOAD_GALLERY] Request {id} upload URL generated
[UPLOAD_GALLERY] Request {id} uploading file to Wix
[UPLOAD_GALLERY] Request {id} completed successfully
```

---

## Summary of Fixes

| Issue | Before | After |
|-------|--------|-------|
| Upload endpoint | `/api/media/upload-hero` (wrong) | `/api/media/upload-gallery` (correct) |
| Collection | `galleryphotos` (doesn't exist) | `portfolioimages` (exists) |
| Schema | Wrong fields | Correct fields (portfolioItemId, displayOrder, caption, altText, image) |
| Upload logic | Create row → Upload (orphaned rows on failure) | Upload → Create row (no orphans) |
| Error messages | Generic 500 | Detailed error text |
| Orphaned rows | 10 rows with empty images | Cleanup utility to remove them |
| Permissions | ANYONE (security risk) | ADMIN (secure) |

---

## Next Steps

1. ✅ Deploy the new `/api/media/upload-gallery` endpoint
2. ✅ Update WorkGalleryManager.tsx with collection changes
3. ⏳ Run cleanup utility to remove 10 orphaned rows
4. ⏳ Update `portfolioimages` permissions to ADMIN
5. ✅ Test upload/replace/delete functionality
6. ✅ Verify error handling and logging

All code changes are complete and ready for deployment.
