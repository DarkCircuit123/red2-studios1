import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BackgroundMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true); // Start muted
  const [hasInteracted, setHasInteracted] = useState(false);

  // Preload and attempt to play music on first user interaction
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasInteracted && audioRef.current) {
        setHasInteracted(true);
        // Unmute and try to play the audio
        audioRef.current.muted = false;
        setIsMuted(false);
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
              console.log('Background music started playing');
            })
            .catch((error) => {
              console.log('Autoplay prevented:', error);
            });
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
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setIsPlaying(true);
            })
            .catch((error) => {
              console.log('Play failed:', error);
            });
        }
      }
    }
  };

  const toggleMute = () => {
    if (audioRef.current) {
      audioRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  return (
    <>
      {/* Audio element - background music */}
      <audio
        ref={audioRef}
        title="Background Music Player"
        loop
        preload="auto"
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          // Restart the audio when it ends (in case loop doesn't work)
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {
              console.log('Failed to restart audio');
            });
          }
        }}
      >
        <source src="https://static.wixstatic.com/media/12d367_71ebdd7141d041e4be3d91d80d4578dd~mv2.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      {/* Music control buttons - fixed position */}
      <div className="fixed bottom-8 right-8 z-40 flex gap-2">
        {/* Play/Pause button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          onClick={togglePlayPause}
          className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-all duration-300 shadow-lg"
          aria-label={isPlaying ? 'Pause music' : 'Play music'}
          title={isPlaying ? 'Click to pause background music' : 'Click to play background music'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </motion.button>

        {/* Mute button */}
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6 }}
          onClick={toggleMute}
          className="p-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-all duration-300 shadow-lg"
          aria-label={isMuted ? 'Unmute music' : 'Mute music'}
          title={isMuted ? 'Click to unmute background music' : 'Click to mute background music'}
        >
          {isMuted ? (
            <VolumeX className="w-5 h-5" />
          ) : (
            <Volume2 className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </>
  );
}
