/**
 * Wix Audio URL Resolver
 * Converts wix:audio:// URLs to playable HTTPS URLs
 */

/**
 * Convert a wix:audio:// URL to a playable HTTPS URL
 * 
 * Wix audio URLs look like:
 * wix:audio://v1/e9d727_045b73d775954cdfbdc9c5ecbf864866.mp3/VibeDepot%20-%20Slow%20Jazz.mp3#duration=160
 * 
 * We need to extract the media ID and convert it to an HTTPS URL
 */
export function convertWixAudioUrl(wixUrl: string): string | null {
  if (!wixUrl) return null;
  
  // If it's already an HTTPS URL, return as-is
  if (wixUrl.startsWith('https://')) {
    console.log('[WIX_AUDIO] URL is already HTTPS:', wixUrl);
    return wixUrl;
  }
  
  // If it's not a wix:audio URL, return null
  if (!wixUrl.startsWith('wix:audio://')) {
    console.warn('[WIX_AUDIO] URL is not a wix:audio URL:', wixUrl);
    return null;
  }

  try {
    // Parse the wix:audio URL
    // Format: wix:audio://v1/{mediaId}.{ext}/{filename}#duration={duration}
    const urlPart = wixUrl.replace('wix:audio://', '');
    
    // Extract the media ID and extension
    // Example: v1/e9d727_045b73d775954cdfbdc9c5ecbf864866.mp3/VibeDepot%20-%20Slow%20Jazz.mp3#duration=160
    const match = urlPart.match(/v1\/([^/]+)\//);
    if (!match || !match[1]) {
      console.error('[WIX_AUDIO] Could not extract media ID from URL:', wixUrl);
      return null;
    }

    const mediaId = match[1]; // e.g., "e9d727_045b73d775954cdfbdc9c5ecbf864866.mp3"
    
    // Build the HTTPS URL
    // Wix media URLs follow this pattern: https://static.wixstatic.com/media/{mediaId}
    const httpsUrl = `https://static.wixstatic.com/media/${mediaId}`;
    
    console.log('[WIX_AUDIO] Converted wix:audio URL to HTTPS:', {
      original: wixUrl,
      mediaId,
      converted: httpsUrl
    });
    
    return httpsUrl;
  } catch (error) {
    console.error('[WIX_AUDIO] Error converting wix:audio URL:', {
      url: wixUrl,
      error: error instanceof Error ? error.message : String(error)
    });
    return null;
  }
}

/**
 * Get a playable audio URL from MusicSettings
 * Uses canonical audio field (HTTPS URL) for playback
 */
export function getPlayableAudioUrl(musicUrl?: string, audioField?: string): string | null {
  // Prefer audioField (canonical audio field) if it's a valid HTTPS URL
  if (audioField && audioField.startsWith('https://')) {
    console.log('[WIX_AUDIO] Using canonical audio field (HTTPS):', audioField);
    return audioField;
  }

  // Try to convert audio field if it's a wix:audio URL
  if (audioField && audioField.startsWith('wix:audio://')) {
    const converted = convertWixAudioUrl(audioField);
    if (converted) {
      console.log('[WIX_AUDIO] Using converted audio field:', converted);
      return converted;
    }
  }

  // Fallback to musicUrl if it's a valid HTTPS URL
  if (musicUrl && musicUrl.startsWith('https://')) {
    console.log('[WIX_AUDIO] Using musicUrl (fallback):', musicUrl);
    return musicUrl;
  }

  // Try to convert musicUrl if it's a wix:audio URL
  if (musicUrl && musicUrl.startsWith('wix:audio://')) {
    const converted = convertWixAudioUrl(musicUrl);
    if (converted) {
      console.log('[WIX_AUDIO] Using converted musicUrl (fallback):', converted);
      return converted;
    }
  }

  console.warn('[WIX_AUDIO] No playable audio URL found:', { musicUrl, audioField });
  return null;
}
