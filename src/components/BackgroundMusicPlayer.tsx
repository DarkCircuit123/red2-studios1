import { useEffect, useRef, useState, useCallback } from 'react';
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
  const interactionHandlerRef = useRef<((e: Event) => void) | null>(null);

  // Load all music tracks from CMS
  useEffect(() => {
    const loadMusicTracks = async () => {
      try {
        const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });
        const enabledTracks = result.items?.filter(track => track.isEnabled && track.musicUrl) || [];
        
        if (enabledTracks.length > 0) {
          setMusicTracks(enabledTracks);
          console.log('[AUDIO_DIAGNOSTIC] Loaded music tracks:', {
            count: enabledTracks.length,
            tracks: enabledTracks.map(t => ({ 
              title: t.musicTitle, 
              url: t.musicUrl,
              urlType: t.musicUrl?.startsWith('wix:') ? 'wix:image://' : 'https://',
              urlLength: t.musicUrl?.length
            }))
          });
          // Get volume from first track if available
          if (enabledTracks[0]?.volume) {
            setVolume(enabledTracks[0].volume);
          }
        }
      } catch (error) {
        // Silently fail - music is optional
        console.log('[AUDIO_DIAGNOSTIC] Failed to load music tracks:', error);
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

  // Attempt to play audio
  const attemptPlay = useCallback(async () => {
    if (!audioRef.current || musicTracks.length === 0) return;
    
    try {
      // Log audio element state before play attempt
      console.log('[AUDIO_DIAGNOSTIC] Attempting play:', {
        src: audioRef.current.src,
        readyState: audioRef.current.readyState,
        networkState: audioRef.current.networkState,
        error: audioRef.current.error?.message
      });
      
      // Ensure audio element is ready
      if (audioRef.current.readyState === 0) {
        audioRef.current.load();
      }
      
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        await playPromise;
        setIsPlaying(true);
        setAudioError(false);
        console.log('[AUDIO_DIAGNOSTIC] Play successful');
      }
    } catch (err) {
      // Log play() rejection - expected if no user gesture yet
      console.log('[AUDIO_DIAGNOSTIC] Play rejected (expected if no user gesture):', err instanceof Error ? err.message : String(err));
      setAudioError(true);
    }
  }, [musicTracks.length]);

  // Setup user interaction listener for first play
  useEffect(() => {
    if (isLoadingSettings || musicTracks.length === 0 || hasInteracted) return;

    const handleUserInteraction = async (e: Event) => {
      if (!hasInteracted) {
        setHasInteracted(true);
        await attemptPlay();
        
        // Remove all listeners after first interaction
        document.removeEventListener('click', handleUserInteraction);
        document.removeEventListener('touchstart', handleUserInteraction);
        document.removeEventListener('keydown', handleUserInteraction);
      }
    };

    // Store reference for cleanup
    interactionHandlerRef.current = handleUserInteraction;

    // Add listeners for first user interaction
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction, { passive: true });
    document.addEventListener('keydown', handleUserInteraction);

    return () => {
      if (interactionHandlerRef.current) {
        document.removeEventListener('click', interactionHandlerRef.current);
        document.removeEventListener('touchstart', interactionHandlerRef.current);
        document.removeEventListener('keydown', interactionHandlerRef.current);
      }
    };
  }, [isLoadingSettings, musicTracks.length, hasInteracted, attemptPlay]);

  const toggleMute = useCallback(() => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      
      // If unmuting and not playing, try to play
      if (!newMutedState && !isPlaying && musicTracks.length > 0) {
        attemptPlay();
      }
    }
  }, [isMuted, isPlaying, musicTracks.length, attemptPlay]);

  const handleAudioPlay = () => {
    setIsPlaying(true);
    setAudioError(false);
    console.log('[AUDIO_DIAGNOSTIC] Audio play event fired');
  };

  const handleAudioPause = () => {
    setIsPlaying(false);
    console.log('[AUDIO_DIAGNOSTIC] Audio pause event fired');
  };

  const handleAudioError = (event: Event) => {
    const audio = event.target as HTMLAudioElement;
    const errorCode = audio.error?.code;
    
    // Log audio error diagnostics
    console.error('[AUDIO_DIAGNOSTIC] Audio error event:', {
      errorCode,
      errorMessage: audio.error?.message,
      src: audio.src,
      srcType: audio.src?.startsWith('wix:') ? 'wix:image://' : 'https://',
      readyState: audio.readyState,
      networkState: audio.networkState,
      currentTrack: currentTrackIndex,
      totalTracks: musicTracks.length
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
        onLoadedMetadata={() => console.log('[AUDIO_DIAGNOSTIC] loadedmetadata event fired')}
        onCanPlay={() => console.log('[AUDIO_DIAGNOSTIC] canplay event fired')}
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
