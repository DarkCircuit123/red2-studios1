import { useState, useEffect, useMemo } from 'react';

interface VideoPlayerProps {
  url: string;
  poster?: string;
  title?: string;
}

/**
 * Robust VideoPlayer component supporting YouTube, Vimeo, and HTML5 video
 * Uses regex patterns for reliable URL parsing and includes poster support
 */
export default function VideoPlayer({ url, poster, title = 'Video player' }: VideoPlayerProps) {
  const [playerType, setPlayerType] = useState<'youtube' | 'vimeo' | 'html5' | null>(null);
  const [videoId, setVideoId] = useState<string | null>(null);

  // Robust regex patterns for video URL parsing
  const YOUTUBE_REGEX = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be)\/(?:watch\?v=)?([a-zA-Z0-9_-]{11})/;
  const VIMEO_REGEX = /(?:https?:\/\/)?(?:www\.)?vimeo\.com\/(\d+)/;
  const HTML5_VIDEO_REGEX = /\.(mp4|webm|ogg|mov|avi)$/i;

  useEffect(() => {
    if (!url) {
      setPlayerType(null);
      setVideoId(null);
      return;
    }

    // YouTube detection and ID extraction
    const youtubeMatch = url.match(YOUTUBE_REGEX);
    if (youtubeMatch && youtubeMatch[1]) {
      setPlayerType('youtube');
      setVideoId(youtubeMatch[1]);
      return;
    }

    // Vimeo detection and ID extraction
    const vimeoMatch = url.match(VIMEO_REGEX);
    if (vimeoMatch && vimeoMatch[1]) {
      setPlayerType('vimeo');
      setVideoId(vimeoMatch[1]);
      return;
    }

    // HTML5 video detection
    if (HTML5_VIDEO_REGEX.test(url)) {
      setPlayerType('html5');
      setVideoId(null);
      return;
    }

    // Fallback: treat as HTML5 if it looks like a URL
    if (url.startsWith('http://') || url.startsWith('https://')) {
      setPlayerType('html5');
      setVideoId(null);
      return;
    }

    setPlayerType(null);
    setVideoId(null);
  }, [url]);

  const iframeAttrs = useMemo(
    () => ({
      allow: 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture',
      allowFullScreen: true,
      loading: 'lazy' as const,
      referrerPolicy: 'strict-origin-when-cross-origin' as const,
    }),
    []
  );

  if (!playerType || !url) return null;

  if (playerType === 'youtube' && videoId) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-12">
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?rel=0`}
          title={title}
          className="w-full h-full"
          {...iframeAttrs}
        />
      </div>
    );
  }

  if (playerType === 'vimeo' && videoId) {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-12">
        <iframe
          src={`https://player.vimeo.com/video/${videoId}`}
          title={title}
          className="w-full h-full"
          {...iframeAttrs}
        />
      </div>
    );
  }

  if (playerType === 'html5') {
    return (
      <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden mb-12">
        <video
          controls
          className="w-full h-full"
          poster={poster}
          title={title}
        >
          <source src={url} type={url.endsWith('.webm') ? 'video/webm' : url.endsWith('.ogg') ? 'video/ogg' : 'video/mp4'} />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  return null;
}
