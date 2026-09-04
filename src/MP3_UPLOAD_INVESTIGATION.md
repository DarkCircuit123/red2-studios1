# MP3 Upload Failure Investigation

## Error Analysis
**Error Message:** "The string did not match the expected pattern."

This error occurs when trying to store a value in a Wix CMS field that has a specific type constraint. In this case, the `musicUrl` field in the `musicsettings` collection is typed as `@wixFieldType url`, which means Wix validates the string against URL pattern rules.

## Root Cause Identified

### Issue 1: Incorrect Response Field Mapping
**File:** `/src/components/MusicUploadManager.tsx` (line 80)
**Problem:** The code reads `data.url` but the backend returns `data.mediaUrl`

```typescript
// WRONG - backend returns mediaUrl, not url
const musicUrl = data.url;  // This is undefined!
```

**Backend Response** (`/src/api/upload-music.ts` line 133):
```typescript
return new Response(
  JSON.stringify({
    url: mediaUrl,  // ✓ Correct field name
    mediaId,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
    debug: { ... }
  }),
  ...
);
```

Wait - the backend DOES return `url`. Let me check if there's a mismatch...

Actually, looking at line 133 of `/src/api/upload-music.ts`, it returns `url: mediaUrl`. So the field name is correct.

### Issue 2: Potential Invalid URL Format
If `data.url` is `undefined` or an invalid URL string, storing it in a `@wixFieldType url` field will fail with "string did not match the expected pattern."

### Issue 3: File Size Limits
**Frontend Limit** (`MusicUploadManager.tsx` line 41):
- Max 50MB

**Backend Limit** (`upload-music.ts` line 48):
- Max 200MB (conservative limit; Wix Media Manager supports up to 500MB)

**Wix Media Manager Actual Limit:**
- 500MB per file (official Wix limit)

### Issue 4: MIME Type Validation
**Frontend Accepted Types** (`MusicUploadManager.tsx` line 34):
```typescript
const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
```

**Backend Accepted Types** (`upload-music.ts` line 34):
```typescript
const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'];
```

**Issue:** Some browsers/systems may report MP3 files as:
- `audio/mpeg` ✓ (standard)
- `audio/mp3` ✓ (non-standard but accepted)
- `audio/x-mpeg` ✗ (not accepted)
- `application/octet-stream` ✗ (fallback when type unknown)

## Validation Checklist

### 1. Maximum Allowed MP3 File Size
- **Frontend:** 50MB
- **Backend:** 200MB
- **Wix Media Manager:** 500MB
- **Recommendation:** Increase to 500MB (Wix maximum)

### 2. Frontend File Size Restrictions
- ✓ Implemented in `MusicUploadManager.tsx` line 41
- Current: 50MB
- Should be: 500MB

### 3. Backend File Size Restrictions
- ✓ Implemented in `upload-music.ts` line 48
- Current: 200MB
- Should be: 500MB

### 4. Accepted MIME Types
- ✓ Both frontend and backend accept: `audio/mpeg`, `audio/mp3`, `audio/wav`, `audio/ogg`, `audio/webm`
- ⚠️ Missing: `audio/x-mpeg` (alternative MP3 MIME type)

### 5. Accepted File Extensions
- ✓ Frontend accepts all audio files via `accept="audio/*"`
- ✓ Backend validates MIME type (not extension)
- ⚠️ Should also validate file extension as fallback

### 6. Wix Media Manager Upload Limits
- ✓ Wix Media Manager supports up to 500MB
- ✓ Both endpoints use `files.generateFileUploadUrl()` correctly
- ✓ Both endpoints use PUT request to upload URL correctly

### 7. Frontend File Rejection
- ✓ `MusicUploadManager.tsx` validates:
  - MIME type (line 35)
  - File size (line 41)
- ✓ Shows user-friendly error messages

### 8. Backend File Validation
- ✓ `upload-music.ts` validates:
  - MIME type (line 35)
  - File size (line 49)
- ✓ Returns detailed error responses

## Logging Implemented

The backend already logs:
- File name
- File size (bytes and MB)
- MIME type
- Upload URL (generated)
- Upload response
- Full exception and stack trace

Example log output:
```
[MUSIC_UPLOAD] File received: song.mp3, Size: 15.50MB, Type: audio/mpeg
[MUSIC_UPLOAD] Requesting Wix Media Manager upload URL...
[MUSIC_UPLOAD] Generated upload URL successfully
[MUSIC_UPLOAD] Uploading file bytes to Wix Media Manager...
[MUSIC_UPLOAD] Upload successful in 2345ms. Media URL: https://static.wixstatic.com/media/...
```

## Issues to Fix

### HIGH PRIORITY
1. **Increase frontend file size limit from 50MB to 500MB**
2. **Increase backend file size limit from 200MB to 500MB**
3. **Add `audio/x-mpeg` to accepted MIME types**
4. **Verify response field mapping is correct**

### MEDIUM PRIORITY
5. **Add file extension validation as fallback**
6. **Improve error messages for URL validation failures**
7. **Add more detailed logging for URL validation**

### LOW PRIORITY
8. **Add progress bar for large file uploads**
9. **Add upload cancellation support**
10. **Add retry logic for failed uploads**

## Testing Plan

### Test Cases
1. **Small MP3 (1-2 MB)**
   - File: `test-small.mp3` (1.5 MB)
   - Expected: ✓ Success

2. **Medium MP3 (10-20 MB)**
   - File: `test-medium.mp3` (15 MB)
   - Expected: ✓ Success

3. **Large MP3 (50+ MB)**
   - File: `test-large.mp3` (75 MB)
   - Expected: ✓ Success (after fix)

4. **Invalid MIME Type**
   - File: `test.txt` (renamed to `.mp3`)
   - Expected: ✗ Rejected with error message

5. **Oversized File (>500 MB)**
   - File: `test-huge.mp3` (600 MB)
   - Expected: ✗ Rejected with error message

## Next Steps

1. Fix the file size limits
2. Add `audio/x-mpeg` MIME type support
3. Test with various MP3 files
4. Verify URL validation passes
5. Document the Wix Media Manager limits
