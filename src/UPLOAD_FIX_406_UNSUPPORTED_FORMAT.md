# Fix for 406 "UNSUPPORTED_FILE_FORMAT" Upload Errors

## Problem
Users were getting 406 errors with "UNSUPPORTED_FILE_FORMAT" when uploading 81 photos. The error indicated that the Wix Media API was rejecting files due to unrecognized file extensions or MIME types.

**Root Causes:**
1. **Filename sanitization**: Original filenames with special characters (parentheses, dates, etc.) like `01_2023-12-11(101).jpg` were being preserved through compression, potentially confusing the API
2. **MIME type consistency**: The compressed File objects weren't explicitly setting the MIME type in all cases
3. **FormData construction**: The filename wasn't being explicitly passed to FormData.append(), which could cause the API to misidentify the file type

## Solution

### 1. **Image Compression Utility** (`/src/lib/image-compression.ts`)
- Added `sanitizeFilename()` function that:
  - Removes path separators and null bytes
  - Replaces parentheses, brackets, and other special characters with underscores
  - Consolidates multiple underscores into single underscores
  - Removes leading/trailing underscores
  - Ensures `.jpg` extension is always present
  
- Updated `compressImage()` to:
  - Sanitize the original filename
  - Ensure the final File object always has `.jpg` extension
  - Explicitly set `type: 'image/jpeg'` on all File objects

**Example transformations:**
- `01_2023-12-11(101).jpg` → `01_2023-12-11_101.jpg`
- `03_076115BB-2BA2-4653-A028-43D6E10B8FB5.jpg` → `03_076115BB-2BA2-4653-A028-43D6E10B8FB5.jpg`
- `image(1).png` → `image_1.jpg` (converted to JPEG)

### 2. **WorkGalleryManager Component** (`/src/components/AdminPanel/sections/WorkGalleryManager.tsx`)
- Updated FormData construction in two places:
  - Batch upload: `formDataForUpload.append('file', fileToUpload, fileToUpload.name);`
  - Replace photo: `formDataForUpload.append('file', fileToUpload, fileToUpload.name);`
  
- The third parameter explicitly passes the filename to FormData, ensuring the API receives the correct filename and MIME type

### 3. **Upload API** (`/src/api/media/upload-hero.ts`)
- No changes needed - already validates MIME types correctly
- Accepts: `image/jpeg`, `image/png`, `image/webp`
- Max size: 10MB

## How It Works

**Before Upload:**
1. User selects files (e.g., `01_2023-12-11(101).jpg`)
2. Compression utility:
   - Sanitizes filename → `01_2023-12-11_101.jpg`
   - Compresses image to JPEG
   - Creates File object with `type: 'image/jpeg'` and sanitized name
3. FormData explicitly includes filename: `append('file', file, 'sanitized_name.jpg')`
4. Upload API receives clean, standard JPEG with proper MIME type
5. Wix Media API accepts the file ✓

## Testing

To verify the fix works:
1. Try uploading the 81 photos that previously failed
2. Check the browser console for compression logs
3. Verify filenames are sanitized in the upload requests
4. Confirm all photos upload successfully

## Files Modified
- `/src/lib/image-compression.ts` - Added filename sanitization
- `/src/components/AdminPanel/sections/WorkGalleryManager.tsx` - Updated FormData construction

## Backward Compatibility
✓ All changes are backward compatible
✓ Existing working uploads continue to work
✓ Only affects new uploads with problematic filenames
