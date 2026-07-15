import { useEffect, useRef, useState, useCallback } from 'react';
import { Volume2, VolumeX, Music, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';
import { GlobalAudioManager } from '@/lib/audio-manager';

declare global {
  interface Window {
    SC?: {
      Widget: {
        getInstance: () => any;
      };
    };
  }
}

export default function BackgroundMusicPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const widgetRef = useRef<any>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showControls, setShowControls] = useState(false);
  const audioManagerRef = useRef(GlobalAudioManager.getInstance());

  // SoundCloud track URL - Blue in Green by Miles Davis
  const SOUNDCLOUD_TRACK_URL = 'https://soundcloud.com/markd54321/198-blue-in-green-miles-davis';
  const SOUNDCLOUD_EMBED_URL = `https://w.soundcloud.com/player/?url=${encodeURIComponent(SOUNDCLOUD_TRACK_URL)}&color=%236F0809&auto_play=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&visual=false`;

  // Load SoundCloud Widget API
  useEffect(() => {
    if (window.SC) {
      setIsLoading(false);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://w.soundcloud.com/player/api.js';
    script.async = true;
    script.onload = () => {
      setIsLoading(false);
      if (window.SC?.Widget && iframeRef.current) {
        widgetRef.current = window.SC.Widget.getInstance(iframeRef.current);
      }
    };
    document.body.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, []);

  // Handle first user interaction to enable autoplay
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        audioManagerRef.current.resumeAudioContext().catch(() => {});
      }
    };

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
    if (widgetRef.current) {
      widgetRef.current.toggle();
      setIsPlaying(!isPlaying);
    }
  }, [isPlaying]);

  const toggleMute = useCallback(() => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    audioManagerRef.current.setAudioEnabled(!newMutedState);
  }, [isMuted]);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
    if (window.SC?.Widget && iframeRef.current) {
      widgetRef.current = window.SC.Widget.getInstance(iframeRef.current);
    }
  }, []);

  return (
    <>
      {/* SoundCloud embed iframe */}
      <iframe
        ref={iframeRef}
        title="Background Music Player - SoundCloud"
        width="100%"
        height="166"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        onLoad={handleIframeLoad}
        src={SOUNDCLOUD_EMBED_URL}
        style={{
          position: 'fixed',
          bottom: '80px',
          right: '8px',
          zIndex: 39,
          borderRadius: '8px',
          overflow: 'hidden',
          maxWidth: '320px',
          opacity: showControls ? 1 : 0,
          pointerEvents: showControls ? 'auto' : 'none',
          transition: 'opacity 0.3s ease-in-out',
        }}
      />

      {/* Music control button - fixed position */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-8 right-8 z-40 flex flex-col items-center gap-2"
      >
        {/* Toggle player visibility */}
        <motion.button
          onClick={() => setShowControls(!showControls)}
          className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
          aria-label="Toggle music player"
          title="Toggle music player"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Music className="w-5 h-5" />
        </motion.button>

        {/* Play/Pause button */}
        {showControls && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={togglePlayPause}
            className="p-2 bg-primary/80 text-white rounded-full hover:bg-primary transition-all duration-300"
            aria-label={isPlaying ? 'Pause music' : 'Play music'}
            title={isPlaying ? 'Pause music' : 'Play music'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4" />
            )}
          </motion.button>
        )}

        {/* Mute button */}
        {showControls && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={toggleMute}
            className="p-2 bg-primary/80 text-white rounded-full hover:bg-primary transition-all duration-300"
            aria-label={isMuted ? 'Unmute music' : 'Mute music'}
            title={isMuted ? 'Unmute music' : 'Mute music'}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </motion.button>
        )}
      </motion.div>
    </>
  );
}
