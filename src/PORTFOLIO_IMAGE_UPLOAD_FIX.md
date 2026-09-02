# Portfolio Image Upload Fix - Complete Implementation

## Problem Summary
The Work/Portfolio image upload system was silently failing, creating orphaned CMS rows with empty image fields:
- 10 rows created on 2026-08-10 17:53 with NO image data
- Only 20 of 30 rows had valid image URLs
- No backup records were created
- No error feedback to admin
- Rows were created BEFORE upload completed (fire-and-forget pattern)

## Root Cause
The save handler was inserting CMS rows before the media upload resolved, and did not await the upload result. The row committed without the image and the panel reported success.

## Solution Implemented

### 1. New Upload-First Flow (`/src/lib/portfolio-image-save-handler.ts`)
**Key Changes:**
- Upload to Media Manager FIRST, await the URL
- Only then create/update CMS row with image field populated
- Never create a row before the image URL exists
- Verify after save: re-query the row and confirm image field is non-empty
- Throw real errors, never silent failures
- Write portfolioItemId to link images to parent work item
- Write to portfolioimagebackups on each save

**Function: `savePortfolioImage(imageUrl, options, itemIdToUpdate?)`**
```typescript
// ATOMIC: Upload first, then create/update CMS row
// 1. Validate image URL is not empty
// 2. Create CMS row with image URL ALREADY populated
// 3. Write backup record
// 4. Verify by re-querying the row
// 5. Return success or throw with real error
```

**Function: `cleanupOrphanedPortfolioImages()`**
- Finds all rows where image field is empty or missing
- Deletes each orphaned row
- Returns count of deleted rows and any errors

### 2. Updated WorkGalleryManagerV2 Component
**Key Changes:**
- Import `savePortfolioImage` and `cleanupOrphanedPortfolioImages`
- Add status message system for real-time feedback
- Update file item interface to track CMS save status
- In `onComplete` callback:
  - Set `cmsStatus: 'saving'` when starting CMS save
  - Call `savePortfolioImage()` with await
  - Set `cmsStatus: 'saved'` on success
  - Set `cmsStatus: 'failed'` with error message on failure
- Replace silent alerts with status messages
- Add "Cleanup Orphaned Rows" button
- Update file preview to show CMS save status

**Status Messages:**
- `info`: "Uploading replacement for {filename}..."
- `success`: "✓ Successfully uploaded and saved {count} photo(s)"
- `error`: "Failed to save {filename}: {reason}"
- `warning`: "✓ Uploaded {count} • ✗ Failed: {count}"

### 3. Collection Permissions Update
**Current (INSECURE):**
```
portfolioimages:
  insert: ANYONE
  update: ANYONE
  remove: ANYONE
  read: ANYONE
```

**Required (SECURE):**
```
portfolioimages:
  insert: ADMIN
  update: ADMIN
  remove: ADMIN
  read: ANYONE
```

**To Apply:**
Use Wix CMS API or manually in Wix Dashboard:
1. Go to Database → Collections → Portfolio
2. Click Settings → Permissions
3. Set insert/update/remove to "Admin Only"
4. Keep read as "Anyone"

### 4. Image URL Format
All working rows use: `wix:image://v1/e9d727_...~mv2.jpg/name.jpg#originWidth=..&originHeight=..`

The `/api/media/upload-hero` endpoint returns `mediaUrl` in this format.

## Verification Checklist

### Before Running Cleanup:
- [ ] Backup database (export portfolioimages collection)
- [ ] Verify 10 orphaned rows exist (displayOrder 20, 22-30)
- [ ] Confirm these rows have empty image fields

### Running Cleanup:
```typescript
// In admin panel, click "Cleanup Orphaned Rows" button
// Or run manually:
const result = await cleanupOrphanedPortfolioImages();
console.log(`Deleted ${result.deleted} rows`);
```

### After Cleanup:
- [ ] Verify 10 rows deleted
- [ ] Verify remaining 20 rows all have image URLs
- [ ] Verify all rows have portfolioItemId set
- [ ] Verify all rows have backup records in portfolioimagebackups

### Test New Upload Flow:
1. Upload a new image via admin panel
2. Watch status messages:
   - "Uploading..." (media upload)
   - "Saving to CMS..." (CMS save)
   - "✓ Saved" (success)
3. Verify row appears in gallery
4. Verify row has image URL in CMS
5. Verify backup record created

## Files Modified

1. **Created:** `/src/lib/portfolio-image-save-handler.ts`
   - `savePortfolioImage()` - Atomic upload-first save
   - `cleanupOrphanedPortfolioImages()` - Delete orphaned rows

2. **Updated:** `/src/components/AdminPanel/sections/WorkGalleryManagerV2.tsx`
   - Import save handler functions
   - Add status message system
   - Update file item interface
   - Update `onComplete` callback
   - Add cleanup button
   - Replace alerts with status messages
   - Change collection from 'galleryphotos' to 'portfolioimages'

3. **Manual Update Required:** CMS Collection Permissions
   - portfolioimages: insert/update/remove → ADMIN only

## Security Implications

**Before Fix:**
- Anyone could insert/update/delete portfolio images
- No validation of image field
- Silent failures masked problems

**After Fix:**
- Only admins can modify portfolio images
- All uploads validated before CMS write
- Real error messages for debugging
- Backup records for recovery

## Rollback Plan

If issues occur:
1. Restore database from backup
2. Revert WorkGalleryManagerV2 changes
3. Keep portfolio-image-save-handler.ts (safe utility)
4. Restore collection permissions to original

## Monitoring

After deployment, monitor:
1. Admin panel upload status messages
2. Console logs for `[PORTFOLIO_SAVE]` entries
3. portfolioimagebackups collection for new records
4. portfolioimages collection for empty image fields

## Next Steps

1. **Immediate:** Run cleanup to delete 10 orphaned rows
2. **Short-term:** Test upload flow with new images
3. **Long-term:** Monitor for any new orphaned rows
4. **Optional:** Add automated cleanup on admin panel load
