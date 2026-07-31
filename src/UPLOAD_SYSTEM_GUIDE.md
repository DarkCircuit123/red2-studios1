# Unified Upload System - Vibe Best Practices

## Overview

The upload system has been completely revamped to follow Vibe best practices with:

- **Single source of truth** for upload logic (no duplicate code)
- **Unified validation** across frontend and backend
- **Proper error handling** with retry logic
- **Progress tracking** with detailed metrics
- **Type-safe operations** throughout
- **CMS integration** for storing media URLs
- **Security hardening** with proper validation

## Architecture

### Core Components

```
src/lib/
├── upload-config.ts       # Single source of truth for validation rules
├── upload-service.ts      # Core upload engine (direct + fallback)
├── upload-storage.ts      # CMS storage operations
└── upload-hooks.ts        # React hooks for uploads

src/components/ui/
└── file-upload.tsx        # Reusable upload UI components

src/api/media/
├── get-upload-url.ts      # Get signed Wix Media Manager URL
├── upload.ts              # Fallback proxy upload (images)
└── import-from-url.ts     # Import from external URL
```

## Upload Flow

### Direct Upload (Primary)

```
Browser
  ↓
1. Validate file locally (upload-config.ts)
  ↓
2. Call /api/media/get-upload-url
  ↓ (returns signed URL)
  ↓
3. PUT file directly to Wix Media Manager
  ↓ (browser → Wix, bypasses our server)
  ↓
4. Get media URL from Wix response
  ↓
5. Store URL in CMS collection
  ↓
Done ✓
```

### Fallback Upload (Network Failure)

```
If direct upload fails at network level:
  ↓
1. Retry via proxy: POST to /api/media/upload
  ↓ (our server receives file, uploads to Wix)
  ↓
2. Get media URL from Wix
  ↓
3. Store URL in CMS collection
  ↓
Done ✓
```

## Usage

### Basic File Upload

```typescript
import { FileUpload } from '@/components/ui/file-upload';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';

export function MyComponent() {
  return (
    <FileUpload
      kind="image"
      config={IMAGE_UPLOAD_CONFIG}
      onSuccess={(result) => {
        console.log('Uploaded:', result.mediaUrl);
      }}
      onError={(error) => {
        console.error('Upload failed:', error.message);
      }}
    />
  );
}
```

### Upload with CMS Storage

```typescript
import { useUpload } from '@/lib/upload-hooks';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';

export function MyComponent() {
  const { upload, isUploading, error, result } = useUpload({
    kind: 'image',
    config: IMAGE_UPLOAD_CONFIG,
    storage: {
      collectionId: 'portfolio',
      itemId: 'item-123',
      fieldName: 'mainImage',
    },
    onSuccess: (result) => {
      console.log('Stored in CMS:', result.mediaUrl);
    },
  });

  return (
    <div>
      <input
        type="file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) upload(file);
        }}
        disabled={isUploading}
      />
      {error && <p className="text-red-600">{error}</p>}
      {result && <p className="text-green-600">Uploaded!</p>}
    </div>
  );
}
```

### Compact Upload Button

```typescript
import { CompactUploadButton } from '@/components/ui/file-upload';
import { MUSIC_UPLOAD_CONFIG } from '@/lib/upload-config';

export function MusicUploadButton() {
  return (
    <CompactUploadButton
      kind="music"
      config={MUSIC_UPLOAD_CONFIG}
      onSuccess={(result) => {
        console.log('Music uploaded:', result.mediaUrl);
      }}
      label="Upload Background Music"
      size="md"
    />
  );
}
```

### Multiple File Uploads

```typescript
import { useMultiUpload } from '@/lib/upload-hooks';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';

export function GalleryUpload() {
  const { uploadMultiple, isUploading, results, errors } = useMultiUpload({
    kind: 'image',
    config: IMAGE_UPLOAD_CONFIG,
  });

  return (
    <div>
      <input
        type="file"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          uploadMultiple(files);
        }}
        disabled={isUploading}
      />
      {errors.size > 0 && (
        <div>
          {Array.from(errors.entries()).map(([fileId, error]) => (
            <p key={fileId} className="text-red-600">{error}</p>
          ))}
        </div>
      )}
    </div>
  );
}
```

### Direct Upload Service

```typescript
import { uploadFile } from '@/lib/upload-service';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';

async function uploadImage(file: File) {
  try {
    const result = await uploadFile(file, 'image', IMAGE_UPLOAD_CONFIG, {
      onProgress: (progress) => {
        console.log(`${progress.percentage}% - ${progress.message}`);
      },
      maxRetries: 2,
      timeoutMs: 120000,
    });

    console.log('Media URL:', result.mediaUrl);
    console.log('Upload took:', result.duration, 'ms');
  } catch (error) {
    console.error('Upload failed:', error.message);
  }
}
```

### CMS Storage Operations

```typescript
import { storeMediaUrl, removeMediaUrl, getStoredMediaUrls } from '@/lib/upload-storage';
import type { UploadResult } from '@/lib/upload-service';

// Store a media URL
async function saveToPortfolio(uploadResult: UploadResult) {
  const result = await storeMediaUrl(uploadResult, {
    collectionId: 'portfolio',
    itemId: 'item-123',
    fieldName: 'mainImage',
  });

  if (result.success) {
    console.log('Stored:', result.mediaUrl);
  }
}

// Get stored URLs
async function getPortfolioImages(itemId: string) {
  const urls = await getStoredMediaUrls('portfolio', itemId, 'mainImage');
  console.log('Images:', urls);
}

// Remove a URL
async function removeImage(itemId: string, mediaUrl: string) {
  const success = await removeMediaUrl(mediaUrl, {
    collectionId: 'portfolio',
    itemId,
    fieldName: 'mainImage',
  });
}
```

## Configuration

### Upload Limits

Edit `/src/lib/upload-config.ts`:

```typescript
export const IMAGE_UPLOAD_CONFIG: UploadConfig = {
  label: 'image',
  acceptedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    // ... add more types
  ],
  acceptedPrefix: 'image/',
  maxSizeBytes: 100 * 1024 * 1024, // 100MB
  maxSizeLabel: '100MB',
};

export const MUSIC_UPLOAD_CONFIG: UploadConfig = {
  label: 'audio',
  acceptedMimeTypes: [
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    // ... add more types
  ],
  acceptedPrefix: 'audio/',
  maxSizeBytes: 500 * 1024 * 1024, // 500MB
  maxSizeLabel: '500MB',
};
```

## Error Handling

### Error Codes

- `VALIDATION_ERROR` - File failed validation (type/size)
- `FILE_TOO_LARGE` - File exceeds size limit
- `INVALID_FILE_TYPE` - File type not supported
- `NETWORK_ERROR` - Network-level failure (retryable)
- `SERVER_ERROR` - Server returned error (retryable if 5xx)
- `INVALID_RESPONSE` - Server response invalid
- `TIMEOUT` - Upload timed out (retryable)
- `UNKNOWN` - Unknown error

### Retry Logic

```typescript
// Automatic retry on network failures
const result = await uploadFile(file, 'image', config, {
  maxRetries: 2,        // Retry up to 2 times
  timeoutMs: 120000,    // 2 minute timeout
});
```

### Error Recovery

```typescript
import { uploadFile, type UploadError } from '@/lib/upload-service';

try {
  const result = await uploadFile(file, 'image', config);
} catch (error) {
  if (error instanceof Error && 'retryable' in error) {
    const uploadError = error as UploadError;
    if (uploadError.retryable) {
      console.log('Retryable error, user can try again');
    } else {
      console.log('Non-retryable error:', uploadError.message);
    }
  }
}
```

## Progress Tracking

```typescript
import { uploadFile, type UploadProgress } from '@/lib/upload-service';

await uploadFile(file, 'image', config, {
  onProgress: (progress: UploadProgress) => {
    console.log({
      percentage: progress.percentage,      // 0-100
      loaded: progress.loaded,              // bytes
      total: progress.total,                // bytes
      status: progress.status,              // 'pending' | 'uploading' | 'processing' | 'complete'
      message: progress.message,            // Human-readable message
    });
  },
});
```

## Security

### Validation

- **Frontend**: Immediate validation before upload
- **Backend**: Re-validation on server (never trust client)
- **Wix**: Final validation by Wix Media Manager

### File Type Checking

```typescript
// Validates both MIME type and file extension
const validation = validateFileAgainstConfig(file, IMAGE_UPLOAD_CONFIG);

if (!validation.valid) {
  console.error(validation.error);
}
```

### Size Limits

- Images: 100MB (configurable)
- Audio: 500MB (configurable)
- Enforced at: frontend, backend, Wix

### URL Storage

- Only real Wix Media Manager URLs stored in CMS
- No base64 data
- No fabricated URLs
- Prevents WDE0009 "Document too large" errors

## Migration Guide

### From Old System

**Old:**
```typescript
import { uploadMedia } from '@/lib/direct-media-upload';

const result = await uploadMedia(file, 'image', IMAGE_UPLOAD_CONFIG);
```

**New:**
```typescript
import { uploadFile } from '@/lib/upload-service';

const result = await uploadFile(file, 'image', IMAGE_UPLOAD_CONFIG);
```

**Old (with CMS):**
```typescript
const result = await uploadMedia(file, 'image', config);
await BaseCrudService.update('portfolio', {
  _id: itemId,
  mainImage: result.mediaUrl,
});
```

**New (with CMS):**
```typescript
const { upload } = useUpload({
  kind: 'image',
  config,
  storage: {
    collectionId: 'portfolio',
    itemId,
    fieldName: 'mainImage',
  },
});

await upload(file);
```

## Troubleshooting

### Upload Fails Immediately

1. Check file type is in `acceptedMimeTypes`
2. Check file size is under `maxSizeBytes`
3. Check browser console for validation errors

### Upload Times Out

1. Increase `timeoutMs` option
2. Check network connection
3. Check file size (very large files may need more time)

### "Network error during direct upload"

1. This is normal - system will automatically retry via proxy
2. Check browser console for details
3. If persists, check CORS settings

### Media URL Not Stored in CMS

1. Check `collectionId` and `fieldName` are correct
2. Check user has permission to update collection
3. Check browser console for storage errors

## Best Practices

1. **Always provide feedback** - Show progress to users
2. **Handle errors gracefully** - Don't just show generic "failed" message
3. **Validate early** - Check file before uploading
4. **Use appropriate timeouts** - Longer for large files
5. **Store URLs only** - Never store base64 or file data in CMS
6. **Test with real files** - Test with actual file sizes you expect
7. **Monitor uploads** - Log upload metrics for debugging

## Performance

### Metrics

- Direct upload: ~100-500ms for small files (depends on network)
- Fallback proxy: ~200-1000ms (includes server processing)
- CMS storage: ~50-200ms

### Optimization

1. Use direct upload (primary path) - fastest
2. Compress images before upload
3. Use appropriate file formats (WebP for images, MP3 for audio)
4. Batch uploads for multiple files

## Support

For issues or questions:

1. Check browser console for error messages
2. Check `/src/lib/upload-service.ts` for implementation details
3. Check `/src/api/media/` for backend routes
4. Review error codes and retry logic

## Files Modified/Created

### New Files
- `/src/lib/upload-service.ts` - Core upload engine
- `/src/lib/upload-storage.ts` - CMS storage operations
- `/src/lib/upload-hooks.ts` - React hooks
- `/src/components/ui/file-upload.tsx` - UI components

### Existing Files (Unchanged)
- `/src/lib/upload-config.ts` - Validation rules (no changes)
- `/src/lib/direct-media-upload.ts` - Legacy (kept for compatibility)
- `/src/api/media/get-upload-url.ts` - Backend (no changes)
- `/src/api/media/upload.ts` - Backend (no changes)
- `/src/api/media/import-from-url.ts` - Backend (no changes)

## Next Steps

1. Update existing upload components to use new system
2. Test with real files and network conditions
3. Monitor upload metrics in production
4. Gather user feedback on UX
