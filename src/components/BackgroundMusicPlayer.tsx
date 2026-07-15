import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BackgroundMusicPlayer() {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);

  // Preload and attempt to play music on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasInteracted) {
        setHasInteracted(true);
        // Trigger play via iframe postMessage
        if (iframeRef.current) {
          try {
            iframeRef.current.contentWindow?.postMessage(
              { method: 'play' },
              '*'
            );
            setIsPlaying(true);
          } catch (e) {
            console.log('Could not trigger SoundCloud playback');
          }
        }
      }
    };

    // Listen for any user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [hasInteracted]);

  const togglePlayPause = () => {
    if (iframeRef.current) {
      try {
        const method = isPlaying ? 'pause' : 'play';
        iframeRef.current.contentWindow?.postMessage(
          { method },
          '*'
        );
        setIsPlaying(!isPlaying);
      } catch (e) {
        console.log('Could not control SoundCloud playback');
      }
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  return (
    <>
      {/* Hidden SoundCloud iframe - preloaded */}
      <iframe
        ref={iframeRef}
        title="Background Music Player"
        width="0"
        height="0"
        scrolling="no"
        frameBorder="no"
        allow="autoplay"
        src="https://w.soundcloud.com/player/?url=https%3A//api.soundcloud.com/tracks/1234567890&color=%236F0809&auto_play=false&hide_related=false&show_comments=true&show_user=true&show_reposts=false&show_teaser=true&visual=true"
        style={{ display: 'none' }}
      />

      {/* Music control button - fixed position */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={toggleMute}
        className="fixed bottom-8 right-8 z-40 p-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-all duration-300 shadow-lg"
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
        title={isMuted ? 'Click to unmute background music' : 'Click to mute background music'}
      >
        {isMuted ? (
          <VolumeX className="w-5 h-5" />
        ) : (
          <Volume2 className="w-5 h-5" />
        )}
      </motion.button>
    </>
  );
}
