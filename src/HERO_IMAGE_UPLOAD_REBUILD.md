# Hero Image Upload System - Complete Rebuild

## Overview
Rebuilt the entire admin image-upload system from scratch with a clean, reliable upload flow for hero images.

## What Was Changed

### New Files Created
1. **`/src/api/media/upload-hero.ts`** - Clean upload endpoint
   - Validates file type (JPEG, PNG, WebP only)
   - Enforces 10MB size limit
   - Requires admin authentication via Bearer token
   - Returns structured JSON: `{ success, mediaUrl, fileId, error }`
   - Uses Wix Media Manager API directly

2. **`/src/pages/api/media/upload-hero.ts`** - Route wrapper
   - Exports the upload-hero API endpoint

3. **`/src/components/HeroImageUploader.tsx`** - New upload component
   - Client-side file validation (JPEG, PNG, WebP; max 10MB)
   - Local preview using `URL.createObjectURL()`
   - Upload progress tracking with XHR
   - Success/error states with clear messages
   - Replace/Delete buttons for existing images
   - Saves to CMS `homepageimages.heroImage` field
   - Enforces admin authentication

### Modified Files
1. **`/src/components/AdminPanel.tsx`**
   - Added import for `HeroImageUploader`
   - Updated to use `adminToken` from auth store
   - Replaced old `ImageUploadManager` for hero with new `HeroImageUploader`
   - Kept other image uploads unchanged

2. **`/src/lib/adminAuthStore.ts`**
   - Added `adminToken: string | null` to state
   - Generate token on login: `btoa(username:password)`
   - Clear token on logout
   - Token passed to upload component for API authentication

3. **`/src/components/sections/HeroSection.tsx`**
   - Enhanced null/empty string handling
   - Validates image URL before rendering
   - Shows loading state (black background)
   - Shows fallback gradient only when no image exists

## Upload Flow

### Admin Workflow
1. Admin opens Admin Panel → Photos tab
2. Clicks "Upload Hero Image" or drag-drops a file
3. Component validates:
   - File type: JPEG, PNG, or WebP only
   - File size: max 10MB
   - Shows clear error message if validation fails
4. Shows local preview while uploading
5. Sends to `/api/media/upload-hero` with:
   - File in FormData
   - Authorization header: `Bearer {adminToken}`
6. Server:
   - Validates file again server-side
   - Generates signed Wix Media Manager upload URL
   - Uploads file to Wix
   - Returns `{ success: true, mediaUrl, fileId }`
7. Component saves mediaUrl to CMS `homepageimages.heroImage`
8. Shows success message
9. Hero section automatically updates (2-second poll)

### Validation Rules
- **Allowed formats**: JPEG, PNG, WebP only
- **Rejected formats**: PSD, TIFF, HEIC, and all others
- **Max size**: 10MB
- **Error messages**: Clear, user-friendly

### Security
- Admin authentication enforced on every upload
- Bearer token in Authorization header
- Server-side file validation
- No direct Wix SDK calls from client
- Structured JSON responses only

## Testing Checklist

- [ ] Admin logs in successfully
- [ ] Admin opens Admin Panel → Photos tab
- [ ] Upload a JPEG under 10MB
  - [ ] Shows local preview
  - [ ] Shows upload progress
  - [ ] Shows success message
  - [ ] Saves to CMS
- [ ] Refresh page
  - [ ] Hero image persists
  - [ ] No placeholder or fallback overlay
- [ ] Replace hero image
  - [ ] Click "Replace" button
  - [ ] Upload new JPEG
  - [ ] Hero updates immediately
- [ ] Delete hero image
  - [ ] Click "Delete" button
  - [ ] Hero shows fallback gradient
  - [ ] CMS field cleared
- [ ] Test validation
  - [ ] Try uploading PNG > 10MB → error message
  - [ ] Try uploading PSD → error message
  - [ ] Try uploading TIFF → error message

## Files NOT Removed (Preserved for Other Uses)
- `ImageUploadManager.tsx` - Still used for portfolio, sponsors, about images
- `media-upload-service.ts` - Still used by other components
- `direct-media-upload.ts` - Still used by other components
- `/api/media/upload.ts` - Still used by other components
- `/api/media/get-upload-url.ts` - Still used by other components

## What's Different from Old System
- ✅ No broken @wix/sdk imports
- ✅ No signed-URL generation fallback
- ✅ No proxy fallback route
- ✅ No custom media-upload-service for hero
- ✅ Clean, dedicated endpoint for hero uploads
- ✅ Proper error handling with JSON responses
- ✅ Admin authentication enforced
- ✅ Hero renders CMS URL directly, no placeholders
- ✅ 10MB size limit enforced
- ✅ JPEG, PNG, WebP only (no PSD, TIFF, HEIC)

## Next Steps
1. Restart the preview
2. Test end-to-end with a JPEG under 10MB
3. Verify hero image persists after page refresh
4. Verify no placeholder/fallback covers the image
