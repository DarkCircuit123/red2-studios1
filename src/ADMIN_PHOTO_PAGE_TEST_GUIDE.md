# Admin Photo Page - Complete Test Guide

## Overview
This guide provides step-by-step testing procedures to verify the admin photo page works correctly after the debug fixes.

## Browser Console Setup

Before testing, open browser DevTools (F12) and filter console by:
```
[ProfessionalPhotoLibrary]
[PhotoEditModal]
[UPLOAD_GALLERY]
```

This will show all relevant logs for the photo page operations.

---

## Test 1: Page Load

### Objective
Verify page loads without errors and all controls are visible.

### Steps
1. Navigate to `/admin` → click "Photo Library" tab
2. Open browser console (F12)
3. Observe:
   - [ ] `[ProfessionalPhotoLibrary] Component mounted, loading photos` appears
   - [ ] `[ProfessionalPhotoLibrary] Loading photos from /api/cms/get-portfolio` appears
   - [ ] Loading spinner shows briefly
   - [ ] `[ProfessionalPhotoLibrary] API response:` shows data structure
   - [ ] `[ProfessionalPhotoLibrary] Loaded photos: N` shows count
   - [ ] Upload controls visible (drag & drop area, file input button)
   - [ ] Photo grid/list visible (or "No photos yet" message)
   - [ ] Sync button visible
   - [ ] View mode toggle visible

### Expected Result
✅ Page fully loads with all controls visible, no errors in console

### Failure Scenarios
- ❌ Error banner appears → Check `/api/cms/get-portfolio` endpoint
- ❌ Upload controls hidden → Check error state logic
- ❌ No console logs → Check component mounting

---

## Test 2: CMS Load Failure Handling

### Objective
Verify page remains functional when CMS fails to load.

### Setup
1. Open DevTools Network tab
2. Right-click `/api/cms/get-portfolio` request → Block URL
3. Refresh page

### Steps
1. Observe error banner appears with message
2. Check console for:
   - [ ] `[ProfessionalPhotoLibrary] API error: {status} {error}`
   - [ ] `[ProfessionalPhotoLibrary] Error loading photos: {message}`
3. Verify:
   - [ ] Upload controls still visible
   - [ ] File input still clickable
   - [ ] Drag & drop area still active
   - [ ] Error banner has dismiss button (X)
4. Click dismiss button
5. Verify error banner closes

### Expected Result
✅ Error shown but upload controls remain functional

### Failure Scenarios
- ❌ Upload controls hidden → Architecture still has cascading failure
- ❌ No error message → Error handling broken
- ❌ Page crashes → Error boundary needed

---

## Test 3: File Selection

### Objective
Verify file selection works and files are added to queue.

### Steps
1. Click "Select Photos" button
2. Select 1-3 image files (JPG, PNG, WebP)
3. Observe console:
   - [ ] `[ProfessionalPhotoLibrary] Adding files to queue: N` shows count
   - [ ] `[ProfessionalPhotoLibrary] File: {name}, type: {type}, isImage: true` for each file
   - [ ] `[ProfessionalPhotoLibrary] Filtered image files: N` shows count
   - [ ] `[ProfessionalPhotoLibrary] Upload queue updated: N` shows total
4. Verify:
   - [ ] Files appear in "Upload Queue" section
   - [ ] Each file shows name, size, status badge
   - [ ] Status shows "pending"
   - [ ] Progress bar at 0%

### Expected Result
✅ Files added to queue and visible in UI

### Failure Scenarios
- ❌ Files not in queue → `addFilesToQueue` not called
- ❌ Wrong count → File filtering broken
- ❌ No console logs → Logging not working

---

## Test 4: Drag & Drop Upload

### Objective
Verify drag & drop file selection works.

### Steps
1. Prepare 1-2 image files on desktop
2. Drag files over drag & drop area
3. Observe:
   - [ ] Area highlights (border changes color)
   - [ ] Area background changes
4. Drop files
5. Observe console:
   - [ ] `[ProfessionalPhotoLibrary] Adding files to queue: N`
   - [ ] Files appear in queue
6. Verify:
   - [ ] Files in queue with correct names
   - [ ] Status shows "pending"

### Expected Result
✅ Drag & drop works, files added to queue

### Failure Scenarios
- ❌ Area doesn't highlight → Drag handlers broken
- ❌ Files not added → Drop handler broken
- ❌ Wrong file count → File filtering broken

---

## Test 5: Upload Flow

### Objective
Verify file upload completes successfully.

### Steps
1. Add 1 image file to queue (see Test 3)
2. Observe console:
   - [ ] `[ProfessionalPhotoLibrary] Processing queue: N`
   - [ ] `[ProfessionalPhotoLibrary] Starting upload for {filename}`
   - [ ] `[UPLOAD_GALLERY] Request {id} started`
   - [ ] `[UPLOAD_GALLERY] Request {id} file received` with file details
   - [ ] `[UPLOAD_GALLERY] Request {id} MIME type resolved`
   - [ ] `[UPLOAD_GALLERY] Request {id} calling mediaManager.upload`
3. Observe UI:
   - [ ] Status changes to "uploading"
   - [ ] Progress bar animates 10% → 100%
   - [ ] Status changes to "processing"
   - [ ] Status changes to "success"
   - [ ] Progress bar reaches 100%
4. Verify photo appears in grid:
   - [ ] New photo at top of grid
   - [ ] Shows thumbnail
   - [ ] Shows filename as caption
5. Observe console:
   - [ ] `[UPLOAD_GALLERY] Request {id} completed successfully`
   - [ ] `[ProfessionalPhotoLibrary] Upload successful for {filename}`

### Expected Result
✅ File uploads, progress shows, photo appears in grid

### Failure Scenarios
- ❌ Status stays "pending" → `processQueue` not called
- ❌ Status jumps to "failed" → Upload endpoint error
- ❌ Progress doesn't update → XHR progress handler broken
- ❌ Photo doesn't appear → Response parsing failed
- ❌ Console shows `Upload response: {mediaUrl: ...}` but photo doesn't appear → Response format mismatch (should be fixed by this update)

---

## Test 6: Upload Error Handling

### Objective
Verify upload errors are handled gracefully.

### Setup
1. Open DevTools Network tab
2. Right-click `/api/media/upload-gallery` → Block URL

### Steps
1. Add 1 image file to queue
2. Observe console:
   - [ ] `[ProfessionalPhotoLibrary] Starting upload for {filename}`
   - [ ] `[UPLOAD_GALLERY_ERROR_CRITICAL] mediaManager.upload FAILED` (or network error)
3. Observe UI:
   - [ ] Status changes to "uploading"
   - [ ] Progress bar shows
   - [ ] Status changes to "failed"
   - [ ] Error message appears below progress bar
   - [ ] "Retry" button appears
4. Click "Retry" button
5. Verify:
   - [ ] Status changes back to "pending"
   - [ ] Upload retries
   - [ ] Console shows retry attempt

### Expected Result
✅ Upload error shown, retry works

### Failure Scenarios
- ❌ No error message → Error not captured
- ❌ No retry button → Error state not handled
- ❌ Retry doesn't work → Retry handler broken

---

## Test 7: Upload with Invalid File Type

### Objective
Verify invalid file types are rejected.

### Steps
1. Try to select a non-image file (PDF, TXT, etc.)
2. Observe:
   - [ ] File doesn't appear in queue (filtered out)
   - [ ] Console shows `[ProfessionalPhotoLibrary] File: {name}, type: {type}, isImage: false`
3. Try to select mixed files (1 image + 1 PDF)
4. Observe:
   - [ ] Only image appears in queue
   - [ ] PDF filtered out

### Expected Result
✅ Non-image files rejected silently

### Failure Scenarios
- ❌ Non-image files in queue → File filtering broken
- ❌ Upload attempted for non-image → Backend validation needed

---

## Test 8: Upload with Large File

### Objective
Verify large files are rejected.

### Setup
1. Create a test image > 10MB (or use existing large file)

### Steps
1. Try to upload large file
2. Observe console:
   - [ ] `[UPLOAD_GALLERY] Request {id} file too large`
   - [ ] Error message in queue: "File too large. Max 10MB..."
3. Verify:
   - [ ] Status shows "failed"
   - [ ] Error message visible
   - [ ] Retry button available

### Expected Result
✅ Large files rejected with clear error

### Failure Scenarios
- ❌ File uploads anyway → Size validation broken
- ❌ No error message → Error not shown

---

## Test 9: Delete Single Photo

### Objective
Verify single photo deletion works.

### Setup
1. Have at least 1 photo in grid

### Steps
1. Hover over photo in grid
2. Observe:
   - [ ] Overlay appears with buttons
   - [ ] Delete button (trash icon) visible
3. Click delete button
4. Observe:
   - [ ] Confirmation dialog appears
   - [ ] Message: "Are you sure you want to delete this photo?"
   - [ ] "Cancel" and "Confirm" buttons
5. Click "Confirm"
6. Observe console:
   - [ ] `[ProfessionalPhotoLibrary] Executing action: delete, items: 1`
   - [ ] `[ProfessionalPhotoLibrary] Deleting photo: {id}`
   - [ ] `[ProfessionalPhotoLibrary] Successfully deleted photo: {id}`
   - [ ] `[ProfessionalPhotoLibrary] Delete action completed`
7. Verify:
   - [ ] Photo removed from grid
   - [ ] Dialog closes
   - [ ] No error message

### Expected Result
✅ Photo deleted successfully

### Failure Scenarios
- ❌ Dialog doesn't appear → Confirmation handler broken
- ❌ Photo doesn't disappear → Delete not called or failed
- ❌ Error message appears → Delete endpoint error
- ❌ Console shows `Delete failed for {id}` → API error

---

## Test 10: Delete Error Handling

### Objective
Verify delete errors are handled.

### Setup
1. Open DevTools Network tab
2. Right-click `/api/cms/mutate` → Block URL

### Steps
1. Try to delete a photo
2. Confirm deletion
3. Observe console:
   - [ ] `[ProfessionalPhotoLibrary] Delete failed for {id}: {status} {error}`
   - [ ] `[ProfessionalPhotoLibrary] Action error: {error}`
4. Observe UI:
   - [ ] Error banner appears
   - [ ] Photo remains in grid
   - [ ] Error message visible

### Expected Result
✅ Delete error shown, photo not removed

### Failure Scenarios
- ❌ No error shown → Error not caught
- ❌ Photo removed anyway → Optimistic update not reverted
- ❌ Page crashes → Error not handled

---

## Test 11: Bulk Delete

### Objective
Verify bulk deletion works.

### Setup
1. Have at least 3 photos in grid

### Steps
1. Click checkbox on first photo
2. Observe:
   - [ ] Photo highlighted
   - [ ] Selection toolbar appears
   - [ ] Shows "1 selected"
   - [ ] "Delete" button visible
3. Click checkboxes on 2 more photos
4. Observe:
   - [ ] All 3 highlighted
   - [ ] Shows "3 selected"
5. Click "Delete" button
6. Observe:
   - [ ] Confirmation dialog appears
   - [ ] Message: "Delete 3 photo(s)?"
7. Click "Confirm"
8. Observe console:
   - [ ] `[ProfessionalPhotoLibrary] Executing action: bulk-delete, items: 3`
   - [ ] `[ProfessionalPhotoLibrary] Deleting photo: {id}` (3 times)
   - [ ] `[ProfessionalPhotoLibrary] Delete action completed`
9. Verify:
   - [ ] All 3 photos removed
   - [ ] Selection cleared
   - [ ] Toolbar disappears

### Expected Result
✅ Bulk delete works for multiple photos

### Failure Scenarios
- ❌ Only 1 photo deleted → Loop broken
- ❌ Selection not cleared → State not reset
- ❌ Toolbar doesn't disappear → UI not updated

---

## Test 12: Edit Photo

### Objective
Verify photo metadata editing works.

### Setup
1. Have at least 1 photo in grid

### Steps
1. Hover over photo
2. Click "Edit" button
3. Observe:
   - [ ] Modal appears
   - [ ] Title: "Edit Photo"
   - [ ] Caption field populated (or empty)
   - [ ] Alt Text field populated (or empty)
   - [ ] Display Order field shows number
4. Change caption to "Test Caption"
5. Change alt text to "Test Alt Text"
6. Click "Save Changes"
7. Observe console:
   - [ ] `[PhotoEditModal] Saving photo: {id}`
   - [ ] `[PhotoEditModal] Photo saved successfully`
8. Verify:
   - [ ] Modal closes
   - [ ] Photo in grid shows updated caption
   - [ ] No error message

### Expected Result
✅ Photo metadata updated successfully

### Failure Scenarios
- ❌ Modal doesn't open → Edit handler broken
- ❌ Modal doesn't close → Save not called
- ❌ Caption not updated → Update not applied
- ❌ Alert appears → Save failed

---

## Test 13: Edit Error Handling

### Objective
Verify edit errors are handled.

### Setup
1. Open DevTools Network tab
2. Right-click `/api/cms/mutate` → Block URL

### Steps
1. Open edit modal for a photo
2. Change caption
3. Click "Save Changes"
4. Observe:
   - [ ] Alert appears with error message
   - [ ] Modal remains open
   - [ ] Form data preserved
5. Click OK on alert
6. Observe console:
   - [ ] `[PhotoEditModal] Save failed: {status} {error}`
   - [ ] `[PhotoEditModal] Error: {error}`

### Expected Result
✅ Edit error shown, modal remains open for retry

### Failure Scenarios
- ❌ No alert → Error not caught
- ❌ Modal closes → Error not handled
- ❌ Form data lost → State not preserved

---

## Test 14: Sync/Refresh

### Objective
Verify sync button reloads photos from CMS.

### Steps
1. Have photos in grid
2. Click "Sync" button
3. Observe:
   - [ ] Button shows loading spinner
   - [ ] Button disabled
4. Observe console:
   - [ ] `[ProfessionalPhotoLibrary] Loading photos from /api/cms/get-portfolio`
   - [ ] `[ProfessionalPhotoLibrary] API response: {...}`
   - [ ] `[ProfessionalPhotoLibrary] Loaded photos: N`
5. Wait for sync to complete
6. Observe:
   - [ ] Spinner disappears
   - [ ] Button enabled
   - [ ] Photos updated (if changed in CMS)

### Expected Result
✅ Sync reloads photos from CMS

### Failure Scenarios
- ❌ Button doesn't show spinner → Loading state not set
- ❌ Photos don't update → Reload not applied
- ❌ Error appears → CMS load failed

---

## Test 15: View Mode Toggle

### Objective
Verify grid/list view toggle works.

### Steps
1. Have photos in grid view
2. Click view mode toggle button (grid/list icon)
3. Observe:
   - [ ] View changes to list
   - [ ] Photos show as rows with thumbnails
   - [ ] All controls still visible
4. Click toggle again
5. Observe:
   - [ ] View changes back to grid
   - [ ] Photos show as cards

### Expected Result
✅ View mode toggle works

### Failure Scenarios
- ❌ View doesn't change → Toggle handler broken
- ❌ Photos disappear → Conditional rendering broken

---

## Test 16: Search/Filter

### Objective
Verify search filters photos.

### Setup
1. Have at least 3 photos with different captions

### Steps
1. Type in search box: "test"
2. Observe:
   - [ ] Grid updates immediately
   - [ ] Only photos with "test" in caption/alt text shown
3. Clear search box
4. Observe:
   - [ ] All photos shown again

### Expected Result
✅ Search filters photos correctly

### Failure Scenarios
- ❌ No filtering → Search handler broken
- ❌ Wrong photos shown → Filter logic broken

---

## Test 17: Sort Options

### Objective
Verify sort options work.

### Setup
1. Have at least 3 photos

### Steps
1. Click sort dropdown (currently "Sort by Date")
2. Select "Sort by Name"
3. Observe:
   - [ ] Photos reorder by caption alphabetically
4. Select "Sort by Date"
5. Observe:
   - [ ] Photos reorder by creation date

### Expected Result
✅ Sort options work correctly

### Failure Scenarios
- ❌ Photos don't reorder → Sort handler broken
- ❌ Wrong order → Sort logic broken

---

## Test 18: Authentication Check

### Objective
Verify non-admin users cannot access photo page.

### Setup
1. Log out or use incognito window
2. Try to navigate to `/admin`

### Steps
1. Observe:
   - [ ] Redirected to login or access denied
   - [ ] Cannot see admin panel

### Expected Result
✅ Non-admin access denied

### Failure Scenarios
- ❌ Admin panel accessible → Auth check broken
- ❌ Upload works for non-admin → Permission check broken

---

## Test 19: Network Failure During Upload

### Objective
Verify network failures are handled.

### Setup
1. Turn off network (or use DevTools offline mode)

### Steps
1. Try to upload a file
2. Observe console:
   - [ ] `[ProfessionalPhotoLibrary] Network error during upload`
3. Observe UI:
   - [ ] Status shows "failed"
   - [ ] Error message: "Network error"
   - [ ] Retry button available
4. Turn network back on
5. Click retry
6. Observe:
   - [ ] Upload retries
   - [ ] Succeeds

### Expected Result
✅ Network errors handled, retry works

### Failure Scenarios
- ❌ No error shown → Error not caught
- ❌ Retry doesn't work → Retry handler broken

---

## Test 20: Concurrent Operations

### Objective
Verify multiple operations can happen simultaneously.

### Steps
1. Add 3 files to upload queue
2. While uploading, try to:
   - [ ] Delete a photo
   - [ ] Edit a photo
   - [ ] Search photos
   - [ ] Change view mode
3. Observe:
   - [ ] All operations work independently
   - [ ] No conflicts or errors
   - [ ] UI remains responsive

### Expected Result
✅ Concurrent operations work without conflicts

### Failure Scenarios
- ❌ Operations block each other → State management issue
- ❌ UI becomes unresponsive → Performance issue
- ❌ Errors appear → Race condition

---

## Summary Checklist

### Core Functionality
- [ ] Page loads without errors
- [ ] All controls visible
- [ ] Upload works
- [ ] Delete works
- [ ] Edit works
- [ ] Sync works

### Error Handling
- [ ] CMS errors shown but upload works
- [ ] Upload errors shown with retry
- [ ] Delete errors shown
- [ ] Edit errors shown
- [ ] Network errors handled

### User Experience
- [ ] Progress shown during upload
- [ ] Confirmation for destructive actions
- [ ] Clear error messages
- [ ] Responsive UI
- [ ] All controls accessible

### Logging
- [ ] Console shows all operations
- [ ] Logs include timestamps
- [ ] Error logs include full context
- [ ] Logs help debug issues

---

## Debugging Tips

### If Upload Fails
1. Check console for `[UPLOAD_GALLERY]` logs
2. Look for MIME type detection errors
3. Check file size (max 10MB)
4. Verify admin authentication
5. Check `/api/media/upload-gallery` endpoint

### If Photos Don't Load
1. Check console for `[ProfessionalPhotoLibrary] API error`
2. Verify `/api/cms/get-portfolio` endpoint
3. Check CMS permissions
4. Look for network errors in DevTools

### If Delete Fails
1. Check console for `Delete failed for {id}`
2. Verify `/api/cms/mutate` endpoint
3. Check CMS permissions
4. Look for network errors

### If Edit Fails
1. Check console for `[PhotoEditModal] Save failed`
2. Verify `/api/cms/mutate` endpoint
3. Check form data validation
4. Look for network errors

---

## Performance Considerations

- [ ] Page loads in < 2 seconds
- [ ] Upload progress updates smoothly
- [ ] Grid renders smoothly with many photos
- [ ] Search/filter responsive
- [ ] No memory leaks (check DevTools Memory tab)

---

## Accessibility Checks

- [ ] All buttons have labels
- [ ] Keyboard navigation works
- [ ] Error messages readable
- [ ] Color contrast sufficient
- [ ] Images have alt text

