import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Music } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BackgroundMusicPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // SoundCloud track URL - Blue in Green by Miles Davis
  const SOUNDCLOUD_TRACK_URL = 'https://soundcloud.com/markd54321/198-blue-in-green-miles-davis';
  const SOUNDCLOUD_EMBED_URL = `https://w.soundcloud.com/player/?url=${encodeURIComponent(SOUNDCLOUD_TRACK_URL)}&color=%236F0809&auto_play=false&hide_related=false&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;

  // Handle first user interaction to enable autoplay
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        setIsLoading(false);
        
        // Attempt to trigger SoundCloud player
        if (iframeRef.current?.contentWindow) {
          try {
            iframeRef.current.contentWindow.postMessage(
              { method: 'play' },
              '*'
            );
            setIsPlaying(true);
          } catch (e) {
            console.log('SoundCloud player interaction:', e);
          }
        }
      }
    };

    // Listen for any user interaction
    const events = ['click', 'touchstart', 'keydown'];
    events.forEach(event => {
      document.addEventListener(event, handleUserInteraction, { once: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, handleUserInteraction);
      });
    };
  }, [hasInteracted]);

  const togglePlayPause = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      try {
        const method = isPlaying ? 'pause' : 'play';
        iframeRef.current.contentWindow.postMessage(
          { method },
          '*'
        );
        setIsPlaying(!isPlaying);
      } catch (e) {
        console.log('Could not control SoundCloud playback:', e);
      }
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    setIsMuted(!isMuted);
    if (iframeRef.current?.contentWindow) {
      try {
        const method = isMuted ? 'unmute' : 'mute';
        iframeRef.current.contentWindow.postMessage(
          { method },
          '*'
        );
      } catch (e) {
        console.log('Could not control SoundCloud mute:', e);
      }
    }
  }, [isMuted]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  return (
    <>
      {/* SoundCloud embed iframe - preloaded and ready */}
      <iframe
        ref={iframeRef}
        title="Background Music Player - SoundCloud"
        width="100%"
        height="60"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        onLoad={handleIframeLoad}
        src={SOUNDCLOUD_EMBED_URL}
        style={{ 
          position: 'fixed',
          bottom: '100px',
          right: '8px',
          zIndex: 30,
          borderRadius: '8px',
          opacity: 0.9,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
        }}
      />

      {/* Music control button - fixed position */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={toggleMute}
        className="fixed bottom-8 right-8 z-40 p-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
        title={isMuted ? 'Click to unmute background music' : 'Click to mute background music'}
      >
        {isLoading ? (
          <Music className="w-5 h-5 animate-pulse" />
        ) : isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </motion.button>
    </>
  );
}
