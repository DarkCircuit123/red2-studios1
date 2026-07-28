# Upload Debug Guide - How to Test and Monitor

## What Was Fixed

### 1. **Increased File Size Limits**
- **Music**: 10MB → 50MB
- **Images**: 15MB → 100MB
- **Reason**: Original limits were too conservative and didn't account for actual file sizes

### 2. **Added Comprehensive Logging**
All upload operations now log to the browser console with `[MUSIC_UPLOAD]`, `[IMAGE_UPLOAD]`, `[MUSIC_PLAYER]` prefixes.

### 3. **Better Error Messages**
- File type validation errors now show the actual received type
- Size errors show exact file size in MB
- Processing times are tracked and reported

---

## How to Test

### Step 1: Open Browser Developer Tools
1. Press `F12` or right-click → "Inspect"
2. Go to the **Console** tab
3. Keep it open while testing uploads

### Step 2: Test Music Upload

**Test Case 1: Your 2:40 MP3 file**
1. Navigate to the music upload section
2. Select your 2:40 MP3 file
3. Watch the console for logs:
   ```
   [MUSIC_UPLOAD_UI] File selected: song.mp3, Size: 3.50MB, Type: audio/mpeg
   [MUSIC_UPLOAD_UI] File validation passed, starting upload...
   [MUSIC_UPLOAD_UI] Sending to /api/upload-music...
   [MUSIC_UPLOAD_UI] Response received in 1234ms, status: 200
   [MUSIC_UPLOAD_UI] Upload successful, URL length: 4567890 chars
   [MUSIC_UPLOAD_UI] Debug info: { originalSizeMB: "3.50", base64SizeMB: "4.65", overheadPercent: "33.0", processingTimeMs: 1234 }
   ```

**Test Case 2: Large file (test the 50MB limit)**
1. Try uploading a file larger than 50MB
2. Should see error:
   ```
   [MUSIC_UPLOAD_UI] File size exceeds 50MB limit. Your file is 55.00MB. Please compress or use a smaller file.
   ```

**Test Case 3: Wrong file type**
1. Try uploading a non-audio file (e.g., .txt, .jpg)
2. Should see error:
   ```
   [MUSIC_UPLOAD_UI] Invalid file type: text/plain. Please upload a valid audio file (MP3, WAV, OGG, or WebM)
   ```

### Step 3: Test Image Upload

**Test Case 1: Regular image**
1. Select an image file
2. Watch console for:
   ```
   [IMAGE_UPLOAD_UI] File selected: photo.jpg, Size: 2.50MB, Type: image/jpeg
   [IMAGE_UPLOAD_UI] File validation passed, starting upload...
   [IMAGE_UPLOAD_UI] Sending to /api/upload-image...
   [IMAGE_UPLOAD_UI] Response received in 2345ms, status: 200
   [IMAGE_UPLOAD_UI] Upload successful, URL length: 3456789 chars
   ```

**Test Case 2: Large image (test the 100MB limit)**
1. Try uploading a file larger than 100MB
2. Should see error about exceeding limit

### Step 4: Test Music Playback

**Test Case 1: Background music player**
1. Check console for:
   ```
   [MUSIC_PLAYER] Loading music settings from CMS...
   [MUSIC_PLAYER] Settings loaded: { isEnabled: true, musicUrl: "data:audio/mpeg;base64,...", volume: 50, loopMusic: true }
   [MUSIC_PLAYER] Attempting autoplay...
   [MUSIC_PLAYER] Loading audio element...
   [MUSIC_PLAYER] Calling play()...
   [MUSIC_PLAYER] Autoplay successful
   ```

**Test Case 2: Mute/Unmute**
1. Click the music control button (bottom right)
2. Should see:
   ```
   [MUSIC_PLAYER] Mute toggled: true
   [MUSIC_PLAYER] Mute toggled: false
   [MUSIC_PLAYER] Unmuted, attempting to play...
   [MUSIC_PLAYER] Playback started after unmute
   ```

---

## Understanding the Logs

### Upload Flow
```
1. [MUSIC_UPLOAD_UI] File selected: ...
   ↓ File validation (type, size)
2. [MUSIC_UPLOAD_UI] File validation passed, starting upload...
   ↓ Send to API
3. [MUSIC_UPLOAD_UI] Sending to /api/upload-music...
   ↓ API processes file
4. [MUSIC_UPLOAD] Starting upload process...
   [MUSIC_UPLOAD] File received: ..., Size: 3.50MB, Type: audio/mpeg
   [MUSIC_UPLOAD] Converting to base64...
   [MUSIC_UPLOAD] Base64 conversion complete: 4.65MB (33.0% overhead), took 234ms
   [MUSIC_UPLOAD] Upload successful in 234ms
   ↓ Response received
5. [MUSIC_UPLOAD_UI] Response received in 1234ms, status: 200
   [MUSIC_UPLOAD_UI] Upload successful, URL length: 4567890 chars
   [MUSIC_UPLOAD_UI] Debug info: {...}
   ↓ Update CMS
6. [MUSIC_UPLOAD_UI] Updating CMS: musicsettings/id/musicUrl
   [MUSIC_UPLOAD_UI] CMS update successful
```

### Key Metrics to Watch
- **File Size**: Original size in MB
- **Base64 Size**: Size after encoding (should be ~33% larger)
- **Overhead**: Percentage increase from encoding
- **Processing Time**: How long the conversion took
- **Response Status**: Should be 200 for success

---

## Common Issues and Solutions

### Issue: "File size exceeds 50MB limit"
**Cause**: File is larger than 50MB
**Solution**: Compress the audio file or use a smaller file

### Issue: "Invalid audio file type"
**Cause**: File is not MP3, WAV, OGG, or WebM
**Solution**: Convert file to one of the supported formats

### Issue: Upload hangs or times out
**Cause**: Large file taking too long to process
**Solution**: 
1. Check browser console for errors
2. Try a smaller file first
3. Check your internet connection

### Issue: Music doesn't play after upload
**Cause**: Data URL might be too large for audio element
**Solution**:
1. Check console for `[MUSIC_PLAYER]` errors
2. Try a smaller/compressed audio file
3. Check if music is enabled in CMS settings

### Issue: "413 Payload Too Large" error
**Cause**: Request body exceeds server limit
**Solution**:
1. This shouldn't happen with new limits
2. If it does, the file is likely corrupted
3. Try re-encoding the audio file

---

## Performance Expectations

### Typical Upload Times (for 3.5MB MP3)
- **File validation**: < 10ms
- **Base64 encoding**: 200-500ms
- **API request**: 500-2000ms
- **CMS update**: 500-1500ms
- **Total**: 1-4 seconds

### If Upload is Slow
1. Check your internet connection
2. Monitor CPU usage (encoding is CPU-intensive)
3. Try a smaller file
4. Check browser console for errors

---

## Next Steps if Issues Persist

1. **Collect Debug Info**:
   - Copy all console logs with `[MUSIC_UPLOAD]` or `[IMAGE_UPLOAD]` prefixes
   - Note the exact file size and type
   - Record any error messages

2. **Check CMS**:
   - Go to Wix Dashboard → Database
   - Check if the music/image URL was saved
   - Verify the URL is valid (starts with `data:audio/` or `data:image/`)

3. **Test with Different Files**:
   - Try a smaller file (< 1MB)
   - Try a different format
   - Try a different browser

4. **Report Issues**:
   - Include console logs
   - Include file size and type
   - Include error messages
   - Include browser and OS info
