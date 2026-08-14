# Music Playback Diagnostic Guide

## Problem
User reports: "I don't hear anything playing"

## Root Causes Identified

### 1. **Wix Audio URL Format Issue**
The `audio` field in MusicSettings stores URLs in Wix's proprietary format:
```
wix:audio://v1/e9d727_045b73d775954cdfbdc9c5ecbf864866.mp3/VibeDepot%20-%20Slow%20Jazz.mp3#duration=160
```

**Problem**: HTML `<audio>` elements cannot play `wix:audio://` URLs directly. They need HTTPS URLs.

**Solution**: New `wix-audio-resolver.ts` utility converts these URLs to playable HTTPS format.

### 2. **Missing URL Resolution**
The BackgroundMusicPlayer was only checking `musicUrl` field and ignoring the `audio` field.

**Solution**: Updated to check both fields and use `getPlayableAudioUrl()` helper.

### 3. **No Fallback for Wix Audio URLs**
If only the `audio` field was populated (from CMS audio upload), playback would fail silently.

**Solution**: Added URL conversion logic with detailed logging.

---

## How to Diagnose

### Step 1: Check Browser Console
Open DevTools (F12) and look for these logs:

```
[MUSIC_PLAYER] Starting to load music tracks from CMS...
[MUSIC_PLAYER] Query result: { totalCount: X, itemCount: Y, items: [...] }
[MUSIC_PLAYER] First track details: { title: "...", musicUrl: "...", audioField: "...", ... }
[WIX_AUDIO] Converted wix:audio URL to HTTPS: { original: "wix:audio://...", converted: "https://..." }
[MUSIC_PLAYER] Resolved playable URL: { trackTitle: "...", playableUrl: "https://..." }
[MUSIC_PLAYER] Rendering with track: { title: "...", playableUrl: "https://...", isPlaying: true, ... }
```

### Step 2: Check Music Settings in CMS
1. Go to your Wix Dashboard → Database
2. Open the "MusicSettings" collection
3. Verify the record has:
   - ✅ `isEnabled` = `true`
   - ✅ Either `musicUrl` (HTTPS URL) OR `audio` (wix:audio:// URL)
   - ✅ `volume` > 0 (e.g., 30-100)
   - ✅ `loopMusic` = `true` (recommended)

### Step 3: Verify URL Resolution
Check the console for URL conversion logs:

**If you see**:
```
[WIX_AUDIO] URL is already HTTPS: https://static.wixstatic.com/media/...
```
✅ URL is correct - should play

**If you see**:
```
[WIX_AUDIO] Converted wix:audio URL to HTTPS: { original: "wix:audio://...", converted: "https://..." }
```
✅ Conversion successful - should play

**If you see**:
```
[WIX_AUDIO] No playable audio URL found: { musicUrl: undefined, audioField: undefined }
```
❌ No URL in CMS - add music file to MusicSettings

### Step 4: Check Audio Element
In DevTools Console, run:
```javascript
// Find the audio element
const audio = document.querySelector('audio');
console.log({
  src: audio?.src,
  readyState: audio?.readyState,
  networkState: audio?.networkState,
  paused: audio?.paused,
  muted: audio?.muted,
  volume: audio?.volume,
  error: audio?.error
});
```

**Expected values**:
- `src`: Should be an HTTPS URL starting with `https://static.wixstatic.com/`
- `readyState`: Should be 2-4 (not 0)
- `networkState`: Should be 2 (NETWORK_LOADING) or 3 (NETWORK_IDLE)
- `paused`: Should be `false` (if playing)
- `muted`: Should be `false` (unless user muted)
- `volume`: Should be 0.3-1.0 (not 0)
- `error`: Should be `null` (if no error)

### Step 5: Test Playback Manually
In DevTools Console:
```javascript
const audio = document.querySelector('audio');
audio?.play().then(() => console.log('Playing!')).catch(e => console.error('Error:', e));
```

---

## Common Issues & Fixes

### Issue: "No enabled music tracks found"
**Cause**: `isEnabled` is `false` in CMS
**Fix**: 
1. Go to Database → MusicSettings
2. Set `isEnabled` to `true`
3. Refresh the page

### Issue: "No playable audio URL found"
**Cause**: Both `musicUrl` and `audio` fields are empty
**Fix**:
1. Go to Database → MusicSettings
2. Upload an audio file to the `audio` field, OR
3. Add an HTTPS URL to the `musicUrl` field
4. Refresh the page

### Issue: "Audio playback error: NetworkError"
**Cause**: URL is invalid or CORS blocked
**Fix**:
1. Check the URL in console - should start with `https://static.wixstatic.com/`
2. Try playing the URL directly in browser address bar
3. If it doesn't work, re-upload the audio file

### Issue: "Autoplay blocked by browser policy"
**Cause**: Browser requires user interaction before playing audio
**Fix**: 
1. Click anywhere on the page
2. Music should start playing
3. This is normal browser behavior for autoplay protection

### Issue: "Audio plays but no sound"
**Cause**: Volume is 0 or audio is muted
**Fix**:
1. Check `volume` field in CMS - should be 30-100
2. Click the speaker icon (bottom right) to unmute
3. Check browser volume settings

---

## Implementation Details

### New Files Created

#### 1. `/src/lib/wix-audio-resolver.ts`
Converts `wix:audio://` URLs to playable HTTPS URLs.

**Key functions**:
- `convertWixAudioUrl(wixUrl)`: Converts wix:audio:// → https://
- `getPlayableAudioUrl(musicUrl, audioField)`: Gets playable URL from either field

**Usage**:
```typescript
import { getPlayableAudioUrl } from '@/lib/wix-audio-resolver';

const playableUrl = getPlayableAudioUrl(track.musicUrl, track.audio);
// Returns: "https://static.wixstatic.com/media/..." or null
```

#### 2. Updated `/src/components/BackgroundMusicPlayer.tsx`
- Now checks both `musicUrl` and `audio` fields
- Uses `getPlayableAudioUrl()` to resolve URLs
- Added detailed logging for diagnostics
- Properly handles wix:audio:// URL conversion

#### 3. `/src/components/MusicDiagnostics.tsx` (Optional)
Development-only component that displays music settings and URL resolution.

**To enable in development**:
```typescript
// In Router.tsx or any page
import MusicDiagnostics from '@/components/MusicDiagnostics';

// Add to your layout
<MusicDiagnostics />
```

---

## Testing Checklist

- [ ] Music settings exist in CMS with `isEnabled = true`
- [ ] Audio file is uploaded to `audio` field OR HTTPS URL in `musicUrl`
- [ ] Console shows "Converted wix:audio URL to HTTPS" or "Using musicUrl"
- [ ] Audio element has valid `src` attribute
- [ ] Volume is > 0 in CMS
- [ ] Speaker icon is visible (bottom right)
- [ ] Speaker icon is NOT muted (blue, not gray)
- [ ] Click anywhere on page → music starts playing
- [ ] Adjust volume slider in CMS → volume changes
- [ ] Toggle `isEnabled` in CMS → music stops/starts

---

## Browser Compatibility

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | ✅ | Full support, autoplay requires user interaction |
| Firefox | ✅ | Full support, autoplay requires user interaction |
| Safari | ✅ | Full support, autoplay requires user interaction |
| Edge | ✅ | Full support, autoplay requires user interaction |
| IE 11 | ❌ | Not supported (use fallback) |

---

## Performance Notes

- Audio preloads automatically (`preload="auto"`)
- Playback starts on first user interaction (browser autoplay policy)
- No memory leaks - event listeners cleaned up on unmount
- Minimal CPU usage - native HTML5 audio element

---

## Next Steps

1. **Verify CMS Data**: Check MusicSettings collection has correct data
2. **Check Console Logs**: Look for URL conversion messages
3. **Test Playback**: Click page → listen for audio
4. **Adjust Volume**: Use CMS volume slider to test
5. **Report Issues**: If still not working, share console logs

---

## Support

If music still doesn't play after following this guide:

1. **Export console logs**: Right-click console → Save as
2. **Check CMS data**: Screenshot MusicSettings record
3. **Verify URL**: Try playing the URL directly in browser
4. **Check browser settings**: Ensure audio is not muted globally

Contact support with:
- Console logs
- CMS data screenshot
- Browser/OS version
- Steps to reproduce
