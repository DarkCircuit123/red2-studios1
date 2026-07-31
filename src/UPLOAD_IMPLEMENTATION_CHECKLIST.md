# Upload System Implementation Checklist

## Overview

This checklist guides you through implementing the new unified upload system across your application. The system is production-ready and follows Vibe best practices.

## Phase 1: Understanding the System ✓

- [x] Read `/src/UPLOAD_SYSTEM_GUIDE.md` for overview
- [x] Review `/src/lib/upload-service.ts` for core logic
- [x] Review `/src/lib/upload-storage.ts` for CMS integration
- [x] Review `/src/lib/upload-hooks.ts` for React hooks
- [x] Review `/src/components/ui/file-upload.tsx` for UI components

## Phase 2: Backend Verification

- [ ] Verify `/src/api/media/get-upload-url.ts` is deployed
- [ ] Verify `/src/api/media/upload.ts` is deployed
- [ ] Verify `/src/api/media/import-from-url.ts` is deployed
- [ ] Test `/api/media/get-upload-url` endpoint manually
- [ ] Test `/api/media/upload` endpoint manually
- [ ] Test `/api/media/import-from-url` endpoint manually
- [ ] Check server logs for any errors
- [ ] Verify Wix Media Manager permissions are correct

## Phase 3: Configuration

- [ ] Review `/src/lib/upload-config.ts`
- [ ] Verify `IMAGE_UPLOAD_CONFIG` settings
  - [ ] `acceptedMimeTypes` includes all needed formats
  - [ ] `maxSizeBytes` is appropriate (default: 100MB)
  - [ ] `acceptedPrefix` is correct
- [ ] Verify `MUSIC_UPLOAD_CONFIG` settings
  - [ ] `acceptedMimeTypes` includes all needed formats
  - [ ] `maxSizeBytes` is appropriate (default: 500MB)
  - [ ] `acceptedPrefix` is correct
- [ ] Add custom upload configs if needed

## Phase 4: Component Migration

### Step 1: Identify Components to Update

- [ ] List all components that handle file uploads
- [ ] Check `/src/components/MusicManager.tsx`
- [ ] Check `/src/components/ImageUploadManager.tsx`
- [ ] Check any custom upload components
- [ ] Check admin panels that handle uploads

### Step 2: Update Each Component

For each component, follow this pattern:

```typescript
// OLD
import { uploadMedia } from '@/lib/direct-media-upload';

// NEW
import { useUpload } from '@/lib/upload-hooks';
import { IMAGE_UPLOAD_CONFIG } from '@/lib/upload-config';

// OLD
const result = await uploadMedia(file, 'image', config);

// NEW
const { upload, isUploading, progress, error } = useUpload({
  kind: 'image',
  config: IMAGE_UPLOAD_CONFIG,
  storage: {
    collectionId: 'portfolio',
    itemId: itemId,
    fieldName: 'mainImage',
  },
});

await upload(file);
```

### Step 3: Test Each Component

- [ ] Test file selection
- [ ] Test drag & drop
- [ ] Test progress tracking
- [ ] Test error handling
- [ ] Test success callback
- [ ] Test CMS storage
- [ ] Test with various file sizes
- [ ] Test with various file types

## Phase 5: UI Components

### Option A: Use Pre-built Components

- [ ] Import `FileUpload` from `@/components/ui/file-upload`
- [ ] Import `CompactUploadButton` from `@/components/ui/file-upload`
- [ ] Replace custom upload UI with these components
- [ ] Test all functionality

### Option B: Custom UI

- [ ] Use `useUpload` hook for state management
- [ ] Use `uploadFile` function for upload logic
- [ ] Use `importFromUrl` function for URL imports
- [ ] Implement custom UI based on your design
- [ ] Test all functionality

## Phase 6: Error Handling

- [ ] Test validation errors (wrong file type)
- [ ] Test size limit errors
- [ ] Test network errors
- [ ] Test timeout errors
- [ ] Test server errors
- [ ] Verify retry logic works
- [ ] Verify error messages are user-friendly
- [ ] Test error recovery

## Phase 7: Progress Tracking

- [ ] Verify progress callback is called
- [ ] Verify percentage updates correctly
- [ ] Verify message updates correctly
- [ ] Verify status transitions correctly
- [ ] Test with large files
- [ ] Test with slow network
- [ ] Verify UI updates smoothly

## Phase 8: CMS Integration

- [ ] Verify media URLs are stored in CMS
- [ ] Verify correct collection is used
- [ ] Verify correct field is updated
- [ ] Test with single-reference fields
- [ ] Test with multi-reference fields
- [ ] Verify URLs are retrievable from CMS
- [ ] Test removing media URLs
- [ ] Test batch operations

## Phase 9: Security

- [ ] Verify file type validation works
- [ ] Verify file size validation works
- [ ] Verify backend re-validates files
- [ ] Verify no base64 data in CMS
- [ ] Verify only Wix URLs stored
- [ ] Test with malicious file types
- [ ] Test with oversized files
- [ ] Review security logs

## Phase 10: Performance

- [ ] Measure upload speed (direct path)
- [ ] Measure upload speed (fallback path)
- [ ] Measure CMS storage time
- [ ] Test with multiple concurrent uploads
- [ ] Test with large files (100MB+)
- [ ] Monitor memory usage
- [ ] Check for memory leaks
- [ ] Profile with DevTools

## Phase 11: Browser Compatibility

- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari
- [ ] Test in Edge
- [ ] Test on mobile browsers
- [ ] Test drag & drop on mobile
- [ ] Test with different network speeds
- [ ] Test with different file sizes

## Phase 12: Documentation

- [ ] Update component documentation
- [ ] Add JSDoc comments to functions
- [ ] Create migration guide for team
- [ ] Document configuration options
- [ ] Document error codes
- [ ] Document best practices
- [ ] Create troubleshooting guide
- [ ] Add examples to README

## Phase 13: Testing

### Unit Tests

- [ ] Test `uploadFile` function
- [ ] Test `importFromUrl` function
- [ ] Test `storeMediaUrl` function
- [ ] Test `validateFileAgainstConfig` function
- [ ] Test error handling
- [ ] Test retry logic

### Integration Tests

- [ ] Test full upload flow
- [ ] Test upload + CMS storage
- [ ] Test error recovery
- [ ] Test with real Wix Media Manager
- [ ] Test with real CMS collections

### E2E Tests

- [ ] Test user upload workflow
- [ ] Test error scenarios
- [ ] Test with various file types
- [ ] Test with various file sizes
- [ ] Test on different browsers

## Phase 14: Monitoring

- [ ] Set up upload metrics logging
- [ ] Monitor upload success rate
- [ ] Monitor upload speed
- [ ] Monitor error rates
- [ ] Monitor retry rates
- [ ] Set up alerts for failures
- [ ] Create dashboard for metrics
- [ ] Review metrics regularly

## Phase 15: Deployment

- [ ] Create feature branch
- [ ] Commit all changes
- [ ] Create pull request
- [ ] Code review
- [ ] Merge to main
- [ ] Deploy to staging
- [ ] Test in staging environment
- [ ] Deploy to production
- [ ] Monitor production for issues

## Phase 16: Post-Deployment

- [ ] Monitor error logs
- [ ] Monitor upload metrics
- [ ] Gather user feedback
- [ ] Fix any issues
- [ ] Optimize performance
- [ ] Document lessons learned
- [ ] Plan future improvements

## Rollback Plan

If issues occur in production:

1. [ ] Identify the issue
2. [ ] Check error logs
3. [ ] Revert to previous version
4. [ ] Notify users
5. [ ] Investigate root cause
6. [ ] Fix and test thoroughly
7. [ ] Deploy fix
8. [ ] Monitor for issues

## Common Issues & Solutions

### Issue: Upload fails with "Network error"

**Solution:**
1. Check browser console for details
2. Verify `/api/media/get-upload-url` is working
3. Check CORS settings
4. System will automatically retry via proxy
5. If persists, check Wix Media Manager permissions

### Issue: File not stored in CMS

**Solution:**
1. Verify `collectionId` is correct
2. Verify `fieldName` exists in collection
3. Verify user has permission to update collection
4. Check browser console for storage errors
5. Verify CMS collection is not read-only

### Issue: Progress not updating

**Solution:**
1. Verify `onProgress` callback is provided
2. Check browser console for errors
3. Verify file size is large enough to show progress
4. Check network speed (very fast uploads may complete before progress updates)

### Issue: Upload times out

**Solution:**
1. Increase `timeoutMs` option
2. Check network connection
3. Check file size (very large files need more time)
4. Check server load
5. Try uploading smaller file first

### Issue: Memory leak during uploads

**Solution:**
1. Verify cleanup is happening
2. Check for event listener leaks
3. Check for XHR object leaks
4. Profile with DevTools
5. Check for circular references

## Success Criteria

- [ ] All components updated to new system
- [ ] All tests passing
- [ ] No console errors
- [ ] No memory leaks
- [ ] Upload success rate > 99%
- [ ] Average upload time < 5 seconds
- [ ] All error messages user-friendly
- [ ] Documentation complete
- [ ] Team trained on new system
- [ ] Monitoring in place

## Sign-off

- [ ] Development complete
- [ ] Testing complete
- [ ] Code review approved
- [ ] Deployment approved
- [ ] Production monitoring active

## Notes

Use this section to track any issues, decisions, or notes during implementation:

```
[Date] - [Note]
```

## References

- `/src/UPLOAD_SYSTEM_GUIDE.md` - Complete system guide
- `/src/lib/upload-service.ts` - Core upload engine
- `/src/lib/upload-storage.ts` - CMS storage
- `/src/lib/upload-hooks.ts` - React hooks
- `/src/components/ui/file-upload.tsx` - UI components
- `/src/components/MediaUploadExample.tsx` - Example implementation
