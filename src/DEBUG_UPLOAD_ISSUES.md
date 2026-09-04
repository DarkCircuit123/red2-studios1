# INTENSIVE DEBUG REPORT: Upload Pipeline Issues

## Critical Issues Found

### 1. **BASE64 ENCODING BLOAT** ⚠️ CRITICAL
**Location:** `/src/api/upload-music.ts` and `/src/api/upload-image.ts`

**Problem:**
- Files are converted to base64 data URLs
- Base64 encoding adds ~33% overhead
- A 2:40 MP3 file (typically 3-5MB) becomes 4-6.5MB when base64 encoded
- This exceeds the 10MB limit AFTER encoding, even if under before
- The JSON response body itself becomes massive, causing 413 Payload Too Large errors

**Example:**
- Original MP3: 3.5MB
- Base64 encoded: 3.5MB × 1.33 = 4.65MB
- JSON wrapper adds more overhead
- Total request/response can exceed infrastructure limits

### 2. **MISSING WIXMEDIA INTEGRATION** ⚠️ CRITICAL
**Location:** Both upload endpoints

**Problem:**
- Files should be uploaded to Wix Media Manager, not stored as data URLs
- Data URLs are inefficient for large files
- No integration with Wix's media infrastructure
- Files are not persisted properly in the CMS

**Solution:**
- Use Wix Media Manager API to upload files
- Get proper media URLs from Wix infrastructure
- Store URLs in CMS instead of base64 data

### 3. **INCONSISTENT FILE SIZE LIMITS**
**Location:** Multiple files

**Issues:**
- MusicUploadManager: 10MB limit
- ImageUploadManager: Says 50MB in code, but shows 15MB in UI text
- upload-image.ts: 15MB limit
- upload-music.ts: 10MB limit
- These limits don't account for base64 encoding overhead

### 4. **NO STREAMING/CHUNKED UPLOAD**
**Problem:**
- Entire file loaded into memory as ArrayBuffer
- No support for large files
- No progress tracking
- No resumable uploads

### 5. **INADEQUATE ERROR HANDLING**
**Issues:**
- Generic error messages don't help debug
- No logging of actual file sizes being processed
- No validation of CORS headers
- No timeout handling for slow uploads

### 6. **AUDIO PLAYBACK ISSUES**
**Location:** BackgroundMusicPlayer.tsx

**Issues:**
- Hardcoded fallback URL if musicUrl is empty
- No error recovery for failed audio loads
- No retry logic for failed playback
- CORS issues with data URLs

## Recommended Fixes

### Fix 1: Implement Wix Media Manager Upload
- Replace base64 encoding with direct Wix Media upload
- Use proper media URLs
- Implement chunked uploads for large files

### Fix 2: Add Comprehensive Logging
- Log file sizes at each step
- Log base64 encoding overhead
- Log API response sizes
- Track where failures occur

### Fix 3: Implement Streaming Upload
- Support chunked/multipart uploads
- Add progress tracking
- Implement resumable uploads
- Better error recovery

### Fix 4: Fix File Size Limits
- Account for base64 overhead (×1.33)
- Set realistic limits based on infrastructure
- Validate at multiple points

### Fix 5: Improve Error Messages
- Include actual file sizes in errors
- Show encoding overhead calculations
- Provide actionable solutions
