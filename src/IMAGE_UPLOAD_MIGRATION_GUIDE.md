# Image Upload Architecture Migration Guide

## Problem: WDE0009 "Document is too large"

### Root Cause
The original `ImageUploadManager.tsx` was storing **base64-encoded images directly in the Wix CMS Portfolio collection**. This caused:

1. **33% data overhead**: Base64 encoding increases data size by ~33%
   - 1MB image → 1.33MB base64 string
   - 10MB image → 13.3MB base64 string

2. **CMS document size limits**: Wix CMS documents have size limits (~1MB per document)
   - Storing large base64 strings exceeded limits
   - Resulted in `WDE0009: Document is too large` error

3. **Performance issues**:
   - Slow CMS read/write operations
   - Memory bloat from storing binary data as text
   - Network overhead transmitting base64

4. **Scalability problems**:
   - Thousands of portfolio images would make CMS unusable
   - No way to optimize or transform images
   - Difficult to migrate data

## Solution: Media Manager Architecture

### New Flow
```
User selects image
    ↓
Upload to Wix Media Manager (/api/media/upload)
    ↓
Receive media URL (e.g., https://static.wixstatic.com/media/...)
    ↓
Store ONLY the URL in CMS Portfolio collection
    ↓
Load images from media URL (not base64)
```

### Key Changes

#### 1. New Media Upload Service (`/src/lib/media-upload-service.ts`)
- Handles file validation and size checks
- Uploads to Wix Media Manager
- Returns media URL instead of base64
- Provides progress tracking
- Uses `URL.createObjectURL()` for previews (not base64)

#### 2. New Media Upload API (`/src/api/media/upload.ts`)
- Receives file uploads
- Uploads to Wix Media Manager
- Returns media URL and metadata
- Replaces the old base64 endpoint

#### 3. Updated ImageUploadManager (`/src/components/ImageUploadManager.tsx`)
- Uses `MediaUploadService.uploadImage()` instead of FileReader
- Stores media URL in CMS (not base64)
- Shows upload progress percentage
- Uses `URL.createObjectURL()` for local previews
- Properly cleans up preview URLs

#### 4. Updated Upload Queue (`/src/lib/upload-queue.ts`)
- Uses `URL.createObjectURL()` instead of `FileReader.readAsDataURL()`
- More efficient image resizing
- Avoids base64 encoding overhead

#### 5. Deprecated Old Endpoint (`/src/api/upload-image.ts`)
- Kept for backward compatibility
- Shows deprecation warning
- Directs users to use `/api/media/upload`

## Migration Steps

### For Existing Portfolio Items with Base64 Images

If you have existing portfolio items with base64 images stored in the CMS:

1. **Identify affected items**:
   ```typescript
   const items = await BaseCrudService.getAll('portfolio');
   const withBase64 = items.items.filter(item => 
     item.mainImage?.startsWith('data:image/')
   );
   ```

2. **Migrate to media URLs** (manual process):
   - Download the base64 image
   - Upload to Wix Media Manager
   - Update the CMS item with the new media URL
   - Delete the base64 data

3. **Or use a migration script** (if needed):
   ```typescript
   // This would require a backend function to:
   // 1. Decode base64 to blob
   // 2. Upload blob to Wix Media Manager
   // 3. Update CMS with new URL
   ```

### For New Uploads

All new image uploads automatically use the media URL architecture:

1. User uploads image via `ImageUploadManager`
2. File is sent to `/api/media/upload`
3. Media URL is returned and stored in CMS
4. Portfolio detail page loads from media URL

## File Changes Summary

### Created Files
- `/src/lib/media-upload-service.ts` - Media upload service
- `/src/api/media/upload.ts` - Media upload endpoint

### Modified Files
- `/src/components/ImageUploadManager.tsx` - Uses media service instead of FileReader
- `/src/lib/upload-queue.ts` - Uses URL.createObjectURL instead of FileReader
- `/src/api/upload-image.ts` - Marked as deprecated

### No Changes Needed
- `/src/components/pages/PortfolioDetailPage.tsx` - Already handles both URLs and base64
- `/src/entities/index.ts` - Portfolio schema unchanged
- Other components - Automatically work with media URLs

## Technical Details

### URL.createObjectURL vs FileReader.readAsDataURL

**FileReader.readAsDataURL (OLD - DON'T USE)**
```typescript
const reader = new FileReader();
reader.readAsDataURL(file);
reader.onload = () => {
  const base64 = reader.result; // "data:image/jpeg;base64,/9j/4AAQSkZJRg..."
  // 33% larger than original file
  // Stored in CMS (causes WDE0009)
};
```

**URL.createObjectURL (NEW - USE THIS)**
```typescript
const objectUrl = URL.createObjectURL(file);
// "blob:http://localhost:3000/12345678-1234-1234-1234-123456789012"
// Same size as original file
// Used for local preview only
// Must revoke when done: URL.revokeObjectURL(objectUrl)
```

### Media URL Storage

**Old (Base64 - DON'T DO THIS)**
```typescript
// CMS document size: ~13MB for 10MB image
await BaseCrudService.update('portfolio', {
  _id: 'item-123',
  mainImage: 'data:image/jpeg;base64,/9j/4AAQSkZJRg...' // 13MB string
});
```

**New (Media URL - DO THIS)**
```typescript
// CMS document size: ~100 bytes for URL
await BaseCrudService.update('portfolio', {
  _id: 'item-123',
  mainImage: 'https://static.wixstatic.com/media/abc123def456'
});
```

## Error Handling

### Upload Failures
- Network errors: Automatic retry with exponential backoff
- File too large: User-friendly error message
- Invalid file type: Clear error with supported formats
- CMS update failure: Separate error handling

### Progress Tracking
- Real-time upload percentage
- Visual progress bar in UI
- Estimated time remaining (can be added)

## Performance Improvements

### Before (Base64)
- Upload 10MB image
- Convert to base64 (33% overhead) → 13.3MB
- Store in CMS → Slow write
- Load from CMS → Slow read
- Total: ~2-3 seconds

### After (Media URL)
- Upload 10MB image
- Store in Media Manager (optimized)
- Store URL in CMS → Fast write
- Load from CDN → Fast read
- Total: ~0.5-1 second

## Remaining Wix Limitations

1. **Media Manager quotas**: Check your Wix plan for storage limits
2. **File size limits**: 100MB per file (reasonable for images)
3. **Rate limiting**: Implement backoff for bulk uploads
4. **Media URL format**: Wix may change URL structure (unlikely)

## Testing Checklist

- [ ] Upload new image via ImageUploadManager
- [ ] Verify media URL is stored in CMS (not base64)
- [ ] Load portfolio detail page
- [ ] Image displays correctly from media URL
- [ ] Upload progress shows percentage
- [ ] Error handling works for invalid files
- [ ] Error handling works for oversized files
- [ ] Delete image functionality works
- [ ] Replace image functionality works
- [ ] Drag & drop upload works
- [ ] Preview URL is properly revoked on cleanup

## Rollback Plan

If issues occur:

1. **Revert ImageUploadManager.tsx** to use old FileReader code
2. **Keep /api/media/upload** for new uploads
3. **Migrate existing base64 images** to media URLs
4. **Monitor CMS document sizes** to ensure no WDE0009 errors

## Questions & Troubleshooting

### Q: Will existing base64 images still work?
A: Yes, the portfolio detail page handles both base64 and media URLs. Existing images will continue to display.

### Q: How do I migrate existing base64 images?
A: Manual process or custom migration script. See "Migration Steps" above.

### Q: What if upload fails?
A: User sees error message. Image is not saved to CMS. User can retry.

### Q: Can I use this for other file types?
A: Yes, extend `MediaUploadService` for audio, video, documents, etc.

### Q: Is there a file size limit?
A: 100MB per file. Adjust `MAX_FILE_SIZE` in `media-upload-service.ts` if needed.
