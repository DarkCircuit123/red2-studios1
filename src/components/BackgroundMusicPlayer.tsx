import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { MusicSettings } from '@/entities/index';

export default function BackgroundMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [musicTracks, setMusicTracks] = useState<MusicSettings[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [volume, setVolume] = useState(30);

  // Load all music tracks from CMS
  useEffect(() => {
    const loadMusicTracks = async () => {
      try {
        const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });
        const enabledTracks = result.items?.filter(track => track.isEnabled && track.musicUrl) || [];
        
        if (enabledTracks.length > 0) {
          setMusicTracks(enabledTracks);
          // Get volume from first track if available
          if (enabledTracks[0]?.volume) {
            setVolume(enabledTracks[0].volume);
          }
        }
      } catch (error) {
        // Silently fail - music is optional
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadMusicTracks();
  }, []);

  // Set audio volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, volume / 100);
    }
  }, [volume]);

  // Attempt to autoplay music on site load
  useEffect(() => {
    if (isLoadingSettings || musicTracks.length === 0 || !audioRef.current) return;

    const attemptAutoplay = async () => {
      try {
        // Ensure audio element is ready
        if (audioRef.current!.readyState === 0) {
          audioRef.current!.load();
        }
        
        // Attempt to play immediately
        const playPromise = audioRef.current!.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setAudioError(false);
          setHasInteracted(true);
        }
      } catch (err) {
        // Autoplay was blocked, will retry on first user interaction
        // Silently fail - don't log errors
      }
    };

    // Try autoplay immediately
    attemptAutoplay();

    // Fallback: Listen for user interaction to retry playback if autoplay failed
    const handleUserInteraction = async () => {
      if (!hasInteracted && audioRef.current && !isPlaying) {
        setHasInteracted(true);
        
        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            setAudioError(false);
          }
        } catch (err) {
          // Silently fail - don't log errors
          setAudioError(true);
        }
      }
    };

    // Use { once: true } to automatically remove listener after first trigger
    document.addEventListener('click', handleUserInteraction, { once: true });
    // Use passive listener for touchstart since preventDefault is not needed
    document.addEventListener('touchstart', handleUserInteraction, { once: true, passive: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      // Cleanup listeners if component unmounts before interaction
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isLoadingSettings, musicTracks.length, isPlaying, hasInteracted]);

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      
      // If unmuting and not playing, try to play
      if (!newMutedState && !isPlaying && musicTracks.length > 0) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => setIsPlaying(true))
            .catch(() => setAudioError(true));
        }
      }
    }
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
    setAudioError(false);
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
  };

  const handleAudioError = (event: Event) => {
    const audio = event.target as HTMLAudioElement;
    const errorCode = audio.error?.code;
    
    // Silently fail - don't log errors for audio playback
    setAudioError(true);
  };

  // Don't render if music is disabled or settings not loaded
  if (isLoadingSettings || musicTracks.length === 0) {
    return null;
  }

  // Get current track
  const currentTrack = musicTracks[currentTrackIndex];

  // Validate music URL is available
  if (!currentTrack?.musicUrl) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element - background music */}
      <audio
        ref={audioRef}
        title="Background Music Player"
        autoPlay
        loop={currentTrack?.loopMusic !== false}
        preload="auto"
        crossOrigin="anonymous"
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onError={handleAudioError}
        style={{ display: 'none' }}
      >
        <source 
          src={currentTrack.musicUrl} 
          type="audio/mpeg"
        />
        {/* Fallback for other audio formats */}
        <source 
          src={currentTrack.musicUrl} 
          type="audio/wav"
        />
        {/* Fallback for OGG */}
        <source 
          src={currentTrack.musicUrl} 
          type="audio/ogg"
        />
      </audio>

      {/* Music control button - fixed position */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        onClick={toggleMute}
        className={`fixed bottom-8 right-8 z-40 p-3 rounded-full transition-all duration-300 shadow-lg ${
          isMuted 
            ? 'bg-gray-600 text-white hover:bg-gray-700' 
            : 'bg-primary text-white hover:bg-primary/90'
        }`}
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
