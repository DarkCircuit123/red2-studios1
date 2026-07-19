import React, { useMemo } from 'react';
import {
  detectVideoPlatform,
  extractYouTubeId,
  extractVimeoId,
  getPlatformName,
  getCanonicalVideoUrl,
} from '@/lib/videoPlatform';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  title?: string;
  autoplay?: boolean;
  className?: string;
}

export default function VideoPlayer({
  url,
  poster,
  title = 'Video',
  autoplay = false,
  className = '',
}: VideoPlayerProps) {
  const platform = useMemo(() => detectVideoPlatform(url), [url]);

  if (platform === 'youtube') {
    const videoId = extractYouTubeId(url);
    if (!videoId) {
      return (
        <div className={`bg-black rounded-lg flex items-center justify-center ${className}`}>
          <p className="text-white text-sm">Invalid YouTube URL</p>
        </div>
      );
    }

    const embedUrl = `https://www.youtube.com/embed/${videoId}?${autoplay ? 'autoplay=1' : ''}`;

    return (
      <div className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  if (platform === 'vimeo') {
    const videoId = extractVimeoId(url);
    if (!videoId) {
      return (
        <div className={`bg-black rounded-lg flex items-center justify-center ${className}`}>
          <p className="text-white text-sm">Invalid Vimeo URL</p>
        </div>
      );
    }

    const embedUrl = `https://player.vimeo.com/video/${videoId}?${autoplay ? 'autoplay=1' : ''}`;

    return (
      <div className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}>
        <div className="aspect-video">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full border-0"
          />
        </div>
      </div>
    );
  }

  // HTML5 video
  if (platform === 'html5') {
    const getMimeType = (url: string): string => {
      if (url.endsWith('.mp4')) return 'video/mp4';
      if (url.endsWith('.webm')) return 'video/webm';
      if (url.endsWith('.ogg')) return 'video/ogg';
      if (url.endsWith('.mov')) return 'video/quicktime';
      return 'video/mp4';
    };

    return (
      <div className={`relative w-full bg-black rounded-lg overflow-hidden ${className}`}>
        <video
          controls
          preload="metadata"
          poster={poster}
          autoPlay={autoplay}
          className="w-full h-full"
        >
          <source src={url} type={getMimeType(url)} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Unknown platform
  return (
    <div className={`bg-black rounded-lg flex items-center justify-center ${className}`}>
      <p className="text-white text-sm">Unsupported video format</p>
    </div>
  );
}

/**
 * Get canonical URL for a video (useful for "Watch on X" links)
 */
export function getCanonicalUrl(url: string): string | null {
  return getCanonicalVideoUrl(url);
}

/**
 * Get platform name for display
 */
export function getPlatformDisplayName(url: string): string {
  return getPlatformName(url);
}
