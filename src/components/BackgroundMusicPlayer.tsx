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

  // Handle track changes - reload audio source whenever currentTrack.musicUrl changes
  useEffect(() => {
    if (!audioRef.current || musicTracks.length === 0) return;

    const currentTrack = musicTracks[currentTrackIndex];
    if (!currentTrack?.musicUrl) {
      console.warn('[BackgroundMusicPlayer] Track URL missing for index', currentTrackIndex);
      return;
    }

    console.log('[BackgroundMusicPlayer] Track URL:', currentTrack.musicUrl);
    
    // Update the audio src attribute
    audioRef.current.src = currentTrack.musicUrl;
    console.log('[BackgroundMusicPlayer] Audio src set to:', audioRef.current.src);
    
    // Always call load() when the source changes
    // This ensures the audio element reloads the source correctly
    audioRef.current.load();

    // If already playing, attempt to resume playback with new track
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[BackgroundMusicPlayer] Play resumed after track change');
          })
          .catch((error) => {
            console.warn('[BackgroundMusicPlayer] Play failed after track change:', error);
            setAudioError(true);
          });
      }
    }
  }, [currentTrackIndex, musicTracks]);

  // Attempt to autoplay music on site load
  useEffect(() => {
    if (isLoadingSettings || musicTracks.length === 0 || !audioRef.current) return;

    const currentTrack = musicTracks[currentTrackIndex];
    if (!currentTrack?.musicUrl) return;

    // Set the audio source
    audioRef.current.src = currentTrack.musicUrl;
    audioRef.current.load();

    // Attempt to play immediately
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[BackgroundMusicPlayer] Autoplay succeeded');
          setIsPlaying(true);
          setAudioError(false);
          setHasInteracted(true);
        })
        .catch((err) => {
          // Autoplay was blocked by browser policy - expected behavior
          console.log('[BackgroundMusicPlayer] Autoplay blocked by browser (expected)');
          setHasInteracted(false);
        });
    }

    // Fallback: Listen for user interaction to retry playback if autoplay failed
    const handleUserInteraction = () => {
      if (!hasInteracted && audioRef.current && !isPlaying) {
        setHasInteracted(true);
        
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('[BackgroundMusicPlayer] Play succeeded after user interaction');
              setIsPlaying(true);
              setAudioError(false);
            })
            .catch((err) => {
              console.warn('[BackgroundMusicPlayer] Play failed after user interaction:', err);
              setAudioError(true);
            });
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
  }, [isLoadingSettings, musicTracks.length, currentTrackIndex, isPlaying, hasInteracted]);

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      
      // If unmuting and not playing, try to play
      if (!newMutedState && !isPlaying && musicTracks.length > 0) {
        // Call play() directly in synchronous execution path from the click event
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('[BackgroundMusicPlayer] Play succeeded from mute toggle');
              setIsPlaying(true);
              setAudioError(false);
            })
            .catch((error) => {
              console.warn('[BackgroundMusicPlayer] Play failed from mute toggle:', error);
              setAudioError(true);
            });
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
    const errorMessage = audio.error?.message || 'Unknown error';
    
    console.warn('[BackgroundMusicPlayer] Audio error:', {
      code: errorCode,
      message: errorMessage,
      src: audio.src
    });
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
