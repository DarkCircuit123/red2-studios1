/**
 * Video platform detection and URL utilities
 */

export type VideoPlatform = 'youtube' | 'vimeo' | 'html5' | 'unknown';

/**
 * Extract YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  try {
    // youtu.be/ID
    const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) return shortMatch[1];

    // youtube.com/watch?v=ID
    const watchMatch = url.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
    if (watchMatch) return watchMatch[1];

    // youtube.com/embed/ID
    const embedMatch = url.match(/youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/);
    if (embedMatch) return embedMatch[1];

    // youtube.com/shorts/ID
    const shortsMatch = url.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) return shortsMatch[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Extract Vimeo video ID from URL
 */
export function extractVimeoId(url: string): string | null {
  try {
    // vimeo.com/ID or vimeo.com/ID/TOKEN
    const match = url.match(/vimeo\.com\/(\d+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

/**
 * Detect video platform from URL
 */
export function detectVideoPlatform(url: string): VideoPlatform {
  if (!url) return 'unknown';

  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    return 'youtube';
  }

  if (url.includes('vimeo.com')) {
    return 'vimeo';
  }

  // Check for common video file extensions
  if (
    url.endsWith('.mp4') ||
    url.endsWith('.webm') ||
    url.endsWith('.ogg') ||
    url.endsWith('.mov')
  ) {
    return 'html5';
  }

  return 'unknown';
}

/**
 * Get canonical YouTube URL
 */
export function getYouTubeCanonicalUrl(id: string): string {
  return `https://www.youtube.com/watch?v=${id}`;
}

/**
 * Get canonical Vimeo URL
 */
export function getVimeoCanonicalUrl(id: string): string {
  return `https://vimeo.com/${id}`;
}

/**
 * Get platform display name
 */
export function getPlatformName(url: string): string {
  const platform = detectVideoPlatform(url);

  switch (platform) {
    case 'youtube':
      return 'YouTube';
    case 'vimeo':
      return 'Vimeo';
    case 'html5':
      return 'Video';
    default:
      return 'Video';
  }
}

/**
 * Get canonical URL for any video platform
 */
export function getCanonicalVideoUrl(url: string): string | null {
  const platform = detectVideoPlatform(url);

  if (platform === 'youtube') {
    const id = extractYouTubeId(url);
    return id ? getYouTubeCanonicalUrl(id) : null;
  }

  if (platform === 'vimeo') {
    const id = extractVimeoId(url);
    return id ? getVimeoCanonicalUrl(id) : null;
  }

  if (platform === 'html5') {
    return url;
  }

  return null;
}
