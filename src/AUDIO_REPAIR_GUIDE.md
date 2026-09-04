# Audio Diagnostic & Repair System - Complete Guide

## Overview

This comprehensive audio system provides full diagnostic capabilities, automatic repair, and browser autoplay policy compliance for all audio sources on the site.

## Components & Systems

### 1. **Global Audio Manager** (`/src/lib/audio-manager.ts`)
- **Purpose**: Centralized audio context lifecycle management
- **Features**:
  - Singleton pattern for consistent audio state
  - Autoplay policy compliance (requires user interaction)
  - Master volume control
  - Audio enable/disable toggle with localStorage persistence
  - Subscriber pattern for audio state changes

### 2. **Audio Context Manager** (`/src/lib/audio-context-manager.ts`)
- **Purpose**: Low-level AudioContext management
- **Features**:
  - Automatic context initialization
  - Resume with retry logic (up to 3 attempts)
  - State tracking and logging
  - Helper methods for creating audio nodes

### 3. **Audio Diagnostic System** (`/src/lib/audio-diagnostic.ts`)
- **Purpose**: Comprehensive audio issue detection and repair
- **Detects**:
  - Broken audio links
  - Unsupported formats
  - Autoplay policy violations
  - CORS errors
  - Missing attributes
  - Suspended audio contexts
  - SoundCloud embed issues
  - Video audio problems

### 4. **Background Music Player** (`/src/components/BackgroundMusicPlayer.tsx`)
- **Purpose**: SoundCloud embed with autoplay policy compliance
- **Features**:
  - Hidden SoundCloud iframe (Blue in Green - Miles Davis)
  - Mute/unmute toggle button
  - First-user-interaction trigger
  - Global audio manager integration
  - Loading state indicator

### 5. **Audio Diagnostics Panel** (`/src/components/AudioDiagnosticsPanel.tsx`)
- **Purpose**: User-facing diagnostic UI
- **Features**:
  - Run diagnostics on demand
  - View issues with severity levels
  - Auto-repair toggle
  - Export diagnostic report as JSON
  - Real-time audio context state display

### 6. **Enhanced Click/Hover Sounds** (`/src/lib/click-sound.ts`)
- **Purpose**: Synthesized UI feedback sounds
- **Features**:
  - Global audio manager integration
  - Respects audio enabled state
  - Automatic AudioContext resumption
  - Fallback context creation

## Audio Sources Monitored

### Background Music
- **Source**: SoundCloud embed (https://soundcloud.com/markd54321/198-blue-in-green-miles-davis)
- **Status**: Fully integrated with autoplay policy compliance
- **Control**: Mute/unmute button (bottom-right corner)

### Click Sounds
- **Type**: Synthesized via Web Audio API
- **Trigger**: Button clicks, link clicks
- **Status**: Respects global audio toggle

### Hover Sounds
- **Type**: Synthesized via Web Audio API
- **Trigger**: Element hover events
- **Status**: Respects global audio toggle

### Video Audio
- **Monitoring**: Automatic detection of video elements
- **Issues**: Missing controls, missing sources

## Browser Autoplay Policy Compliance

### Key Requirements Met
1. ✅ **User Interaction Required**: Audio only plays after first user interaction
2. ✅ **Muted by Default**: Background music starts muted
3. ✅ **Allow Attribute**: SoundCloud iframe has `allow="autoplay"`
4. ✅ **Auto-play Parameter**: SoundCloud URL includes `auto_play=false`
5. ✅ **AudioContext Resume**: Automatic on first interaction

### Supported Browsers
- ✅ Chrome/Chromium (88+)
- ✅ Firefox (90+)
- ✅ Safari (14.1+)
- ✅ Edge (88+)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Usage

### Running Diagnostics

#### Via UI
1. Click the refresh button (bottom-right, below music toggle)
2. Click "Run Diagnostic"
3. View issues and severity levels
4. Toggle "Auto-repair issues" to fix automatically
5. Click "Export" to download JSON report

#### Via Code
```typescript
import { AudioDiagnostic } from '@/lib/audio-diagnostic';

// Run diagnostic
const report = await AudioDiagnostic.runDiagnostic();

// Apply fixes
AudioDiagnostic.applyAllFixes();

// Export report
const json = AudioDiagnostic.exportReport();
```

### Using Audio Manager

```typescript
import { GlobalAudioManager } from '@/lib/audio-manager';

const manager = GlobalAudioManager.getInstance();

// Toggle audio
manager.toggleAudio();

// Check if audio is enabled
if (manager.isAudioEnabledState()) {
  // Play sounds
}

// Resume audio context
await manager.resumeAudioContext();

// Subscribe to changes
const unsubscribe = manager.onAudioToggle((enabled) => {
  console.log('Audio enabled:', enabled);
});
```

### Using Audio Hooks

```typescript
import { useAudioDiagnostics, useAudioManager } from '@/hooks/useAudioDiagnostics';

function MyComponent() {
  const { report, runDiagnostic, applyFixes } = useAudioDiagnostics();
  const { isAudioEnabled, toggleAudio } = useAudioManager();

  return (
    <div>
      <button onClick={toggleAudio}>
        {isAudioEnabled ? 'Mute' : 'Unmute'}
      </button>
      <button onClick={runDiagnostic}>Run Diagnostics</button>
    </div>
  );
}
```

## Diagnostic Report Structure

```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "totalIssues": 5,
  "criticalIssues": 1,
  "warningIssues": 2,
  "issues": [
    {
      "id": "audio-context-suspended",
      "type": "context-suspended",
      "severity": "warning",
      "source": "AudioContext",
      "description": "AudioContext is suspended",
      "fix": "Resume AudioContext on first user interaction",
      "fixed": false
    }
  ],
  "audioSources": {
    "backgroundMusic": true,
    "clickSounds": true,
    "hoverSounds": true,
    "soundcloudEmbed": true,
    "videoAudio": false
  },
  "audioContextState": "suspended",
  "browserSupport": {
    "audioContext": true,
    "webAudio": true,
    "audioElement": true,
    "iframeAutoplay": true
  }
}
```

## Issue Types & Fixes

| Type | Severity | Description | Fix |
|------|----------|-------------|-----|
| `broken-link` | Critical | Audio source URL is invalid | Verify URL is correct |
| `format-unsupported` | Critical | Audio format not supported | Use supported format (MP3, WAV, OGG) |
| `autoplay-blocked` | Critical | Autoplay policy violation | Add muted attribute or require user interaction |
| `cors-error` | Warning | CORS issue with external audio | Add crossOrigin="anonymous" |
| `missing-attribute` | Warning | Missing required attribute | Add allow="autoplay" to iframe |
| `context-suspended` | Warning | AudioContext is suspended | Resume on first user interaction |

## Testing Checklist

### Desktop Browsers
- [ ] Chrome: Music plays after click, sounds work
- [ ] Firefox: Music plays after click, sounds work
- [ ] Safari: Music plays after click, sounds work
- [ ] Edge: Music plays after click, sounds work

### Mobile Browsers
- [ ] iOS Safari: Music plays after tap, sounds work
- [ ] Chrome Mobile: Music plays after tap, sounds work
- [ ] Firefox Mobile: Music plays after tap, sounds work

### Audio Features
- [ ] Background music mute/unmute works
- [ ] Click sounds play on button clicks
- [ ] Hover sounds play on hover
- [ ] Audio toggle persists across page reloads
- [ ] Diagnostics panel opens and runs
- [ ] Export report downloads JSON file

### Autoplay Policy
- [ ] No audio plays without user interaction
- [ ] Background music starts muted
- [ ] SoundCloud iframe has allow attribute
- [ ] AudioContext resumes on first interaction

## Troubleshooting

### Audio Not Playing
1. Check browser console for errors
2. Run diagnostics (click refresh button)
3. Verify user has interacted with page
4. Check if audio is muted globally
5. Verify SoundCloud track URL is valid

### Autoplay Policy Errors
1. Ensure audio is muted by default
2. Require user interaction before playing
3. Add `allow="autoplay"` to iframes
4. Resume AudioContext on first interaction

### CORS Errors
1. Add `crossOrigin="anonymous"` to audio elements
2. Verify external audio source supports CORS
3. Use CORS proxy if necessary

### AudioContext Suspended
1. Click anywhere on page to trigger resume
2. Check browser console for errors
3. Verify browser supports Web Audio API
4. Try different browser if issue persists

## Performance Optimization

- Audio preloading is handled automatically
- Master gain node reduces CPU usage
- Lazy initialization of AudioContext
- Efficient event listener cleanup
- localStorage caching of user preferences

## Security Considerations

- ✅ No inline audio data
- ✅ CORS headers verified
- ✅ No autoplay without user interaction
- ✅ Secure SoundCloud embed
- ✅ No sensitive data in localStorage

## Future Enhancements

- [ ] Audio visualization
- [ ] Equalizer controls
- [ ] Playlist management
- [ ] Audio recording
- [ ] Spatial audio support
- [ ] Advanced analytics

## Support

For issues or questions:
1. Check the diagnostic report
2. Review browser console logs
3. Test in different browser
4. Export diagnostic report for debugging
5. Check browser autoplay policy documentation
