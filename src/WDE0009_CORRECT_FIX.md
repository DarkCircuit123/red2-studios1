# WDE0009 Fix - Correct Architecture

## Problem

**WDE0009: Document is too large**

The error occurred because images were being stored as base64 data URLs directly inside CMS records:

```
Portfolio Item
├── title: "My Project"
├── description: "..."
├── mainImage: "data:image/jpeg;base64,/9j/4AAQ..." (2.67MB)
└── galleryImage1: "data:image/jpeg;base64,/9j/4AAQ..." (2.5MB)

Total document size: ~5.2MB → WDE0009 ERROR (CMS limit exceeded)
```

## Solution

Store only Wix media URLs in the CMS. The URL is tiny (~50 bytes), while the actual image is stored in Wix Media Manager.

```
Portfolio Item
├── title: "My Project"
├── description: "..."
├── mainImage: "https://static.wixstatic.com/media/abc123~mv2.jpg" (50 bytes)
└── galleryImage1: "https://static.wixstatic.com/media/def456~mv2.jpg" (50 bytes)

Total document size: ~500 bytes → NO ERROR
```

## Architecture

### Upload Flow

```
User selects image
        ↓
ImageUploadManager.tsx
        ↓
Create preview with URL.createObjectURL()
(Memory-efficient, not base64)
        ↓
Upload to /api/media/upload
        ↓
MediaUploadService.uploadImage()
        ↓
Send FormData to Wix Media Manager
        ↓
Receive Wix media URL
(wix:image:// or https://static.wixstatic.com/)
        ↓
Validate URL is NOT base64
        ↓
Save URL string to Portfolio CMS
        ↓
CMS document stays tiny (~50 bytes per image)
```

### Key Components

#### 1. **MediaUploadService** (`/src/lib/media-upload-service.ts`)
- Handles file upload to Wix Media Manager
- Returns Wix media URL (not base64)
- Validates file type and size
- Provides progress tracking
- Creates preview URLs with `URL.createObjectURL()` (not base64)

#### 2. **WixMediaManager** (`/src/lib/wix-media-manager.ts`)
- Alternative implementation for Wix Media Manager integration
- Validates Wix media URLs
- Detects data URLs (which should NOT be stored)

#### 3. **API Endpoint** (`/src/api/media/upload.ts`)
- Receives file from frontend
- Uploads to Wix Media Manager
- Returns Wix media URL
- Validates response structure

#### 4. **ImageUploadManager** (`/src/components/ImageUploadManager.tsx`)
- UI component for image uploads
- Uses MediaUploadService
- Validates returned URLs are not base64
- Saves only URL to CMS

#### 5. **Validation Utility** (`/src/lib/wde0009-fix-validation.ts`)
- Validates Portfolio items for base64 data
- Calculates document size impact
- Generates detailed reports
- Helps identify items that need migration

## Key Changes

### ✅ What Changed

1. **Removed base64 encoding** from upload flow
2. **Upload to Wix Media Manager** instead of storing data URLs
3. **Store only URL strings** in CMS (50 bytes vs 2.67MB)
4. **Use URL.createObjectURL()** for previews (memory-efficient)
5. **Validate URLs** are Wix media URLs, not data URLs

### ✅ What Stayed the Same

- Portfolio CMS schema (no new fields)
- Existing UI components
- Image display logic
- No migrations needed
- No secrets or environment variables
- No rollback system needed

## Size Comparison

### Before (WDE0009 Error)
```
Portfolio Item with 4 images:
- mainImage: 2.67MB (base64)
- galleryImage1: 2.5MB (base64)
- galleryImage2: 2.3MB (base64)
- galleryImage3: 2.1MB (base64)
- Other fields: 500 bytes
─────────────────────────
Total: ~9.67MB → WDE0009 ERROR
```

### After (Fixed)
```
Portfolio Item with 4 images:
- mainImage: 50 bytes (URL)
- galleryImage1: 50 bytes (URL)
- galleryImage2: 50 bytes (URL)
- galleryImage3: 50 bytes (URL)
- Other fields: 500 bytes
─────────────────────────
Total: ~700 bytes → NO ERROR
```

**Reduction: 99.99%** ✅

## Implementation Details

### Upload Process

```typescript
// 1. Create preview (memory-efficient)
const previewUrl = URL.createObjectURL(file);

// 2. Upload to Wix Media Manager
const result = await MediaUploadService.uploadImage(file);
// Returns: { mediaUrl: "https://static.wixstatic.com/...", ... }

// 3. Validate URL is NOT base64
if (MediaUploadService.isDataUrl(result.mediaUrl)) {
  throw new Error('Got base64 instead of Wix URL');
}

// 4. Save URL to CMS
await BaseCrudService.update('portfolio', {
  _id: itemId,
  mainImage: result.mediaUrl  // Only ~50 bytes!
});

// 5. Clean up preview
URL.revokeObjectURL(previewUrl);
```

### Display Process

```typescript
// Images display the same way - using the URL
<Image src={project.mainImage} alt="..." />

// Whether it's:
// - Wix media URL: https://static.wixstatic.com/...
// - Or any other URL: https://example.com/...
// The Image component handles it the same way
```

## Validation

Use the validation utility to check if items have been properly migrated:

```typescript
import WDE0009FixValidator from '@/lib/wde0009-fix-validation';

// Validate a single item
const result = WDE0009FixValidator.validatePortfolioItem(item);
console.log(result.isValid); // true if no base64 found

// Validate multiple items
const validation = WDE0009FixValidator.validatePortfolioItems(items);
console.log(validation.invalidItems); // Count of items with base64

// Generate report
const report = WDE0009FixValidator.generateReport(items);
console.log(report);
```

## Migration Path

### For New Uploads
- All new uploads automatically use Wix Media URLs
- No action needed

### For Existing Base64 Images
- Option 1: Re-upload images (they'll be converted to Wix URLs)
- Option 2: Manually update CMS records with Wix URLs
- Option 3: Use validation utility to identify items needing updates

## Testing

### Test Upload
1. Go to Portfolio page
2. Upload an image
3. Verify in browser DevTools:
   - Network tab: `/api/media/upload` returns `mediaUrl` (not base64)
   - CMS: Image field contains URL string (~50 bytes)

### Test Validation
```typescript
// Check a Portfolio item
const item = await BaseCrudService.getById('portfolio', 'item-id');
const validation = WDE0009FixValidator.validatePortfolioItem(item);
console.log(validation.isValid); // Should be true
```

## Benefits

✅ **Fixes WDE0009 Error** - CMS documents stay tiny
✅ **No Migrations** - Existing schema unchanged
✅ **No Secrets** - No environment variables needed
✅ **No Rollback System** - Simple, straightforward fix
✅ **Better Performance** - Smaller CMS payloads
✅ **Scalable** - Can handle unlimited images
✅ **Minimal Changes** - Only upload flow changed

## Files Modified

1. `/src/api/media/upload.ts` - Upload endpoint (now returns Wix URLs)
2. `/src/lib/media-upload-service.ts` - Upload service (refactored for Wix URLs)
3. `/src/components/ImageUploadManager.tsx` - Added validation for Wix URLs
4. `/src/lib/wix-media-manager.ts` - New Wix Media Manager integration
5. `/src/lib/wde0009-fix-validation.ts` - New validation utility

## Troubleshooting

### Issue: Upload returns base64 URL
**Solution:** Check `/src/api/media/upload.ts` is returning `mediaUrl` from Wix Media Manager, not creating base64

### Issue: Images not displaying
**Solution:** Verify URL format is correct (should start with `https://static.wixstatic.com/` or `wix:image://`)

### Issue: CMS still shows large documents
**Solution:** Use validation utility to identify items with base64 data and re-upload them

## References

- **CMS Document Size Limit:** Wix CMS has a hard limit on document size
- **Wix Media Manager:** Stores images separately from CMS records
- **URL.createObjectURL():** Creates memory-efficient preview URLs
- **Base64 Encoding:** Increases data size by ~33% (not suitable for CMS storage)
