import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';

interface MusicSettings {
  _id: string;
  musicUrl?: string;
  isEnabled?: boolean;
  volume?: number;
  loopMusic?: boolean;
  musicTitle?: string;
}

export default function BackgroundMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [musicSettings, setMusicSettings] = useState<MusicSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);

  // Load music settings from CMS
  useEffect(() => {
    const loadMusicSettings = async () => {
      try {
        const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 1 });
        if (result?.items && result.items.length > 0) {
          const settings = result.items[0];
          console.log('[AUDIO] Loaded music settings:', {
            enabled: settings.isEnabled,
            hasUrl: !!settings.musicUrl,
            volume: settings.volume,
            loop: settings.loopMusic,
            title: settings.musicTitle
          });
          setMusicSettings(settings);
        } else {
          console.log('[AUDIO] No music settings found in CMS');
        }
      } catch (error) {
        // Suppress 403 errors from CMS - music is optional
        if (error instanceof Error && error.message.includes('403')) {
          console.log('[AUDIO] CMS access denied for music settings (expected in some environments)');
        } else {
          console.log('[AUDIO] Failed to load music settings:', error);
        }
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadMusicSettings();
  }, []);

  // Set audio volume when settings change
  useEffect(() => {
    if (audioRef.current && musicSettings?.volume) {
      audioRef.current.volume = Math.min(1, musicSettings.volume / 100);
    }
  }, [musicSettings?.volume]);

  // Attempt to autoplay music on site load
  useEffect(() => {
    if (isLoadingSettings || !musicSettings?.isEnabled || !audioRef.current) return;

    const attemptAutoplay = async () => {
      try {
        // Ensure audio element is ready
        if (audioRef.current!.readyState === 0) {
          audioRef.current!.load();
        }
        
        console.log('[AUDIO] Attempting autoplay...');
        // Attempt to play immediately
        const playPromise = audioRef.current!.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('[AUDIO] Autoplay successful');
          setIsPlaying(true);
          setAudioError(false);
          setHasInteracted(true);
        }
      } catch (err) {
        console.log('[AUDIO] Autoplay failed, will retry on user interaction:', err);
        // Autoplay was blocked, will retry on first user interaction
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
            console.log('[AUDIO] Playback started on user interaction');
            setIsPlaying(true);
            setAudioError(false);
          }
        } catch (err) {
          console.log('[AUDIO] Audio playback failed on user interaction:', err);
          setAudioError(true);
        }
      }
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isLoadingSettings, musicSettings?.isEnabled, isPlaying, hasInteracted]);

  const toggleMute = () => {
    if (audioRef.current) {
      const newMutedState = !isMuted;
      audioRef.current.muted = newMutedState;
      setIsMuted(newMutedState);
      
      // If unmuting and not playing, try to play
      if (!newMutedState && !isPlaying) {
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
    const errorMessage = audio.error?.message || 'Unknown error';
    
    console.error('[AUDIO] Audio element error:', {
      code: errorCode,
      message: errorMessage,
      networkState: audio.networkState,
      readyState: audio.readyState,
      src: musicSettings?.musicUrl
    });
    
    setAudioError(true);
  };

  // Don't render if music is disabled or settings not loaded
  if (isLoadingSettings || !musicSettings?.isEnabled) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element - background music */}
      <audio
        ref={audioRef}
        title="Background Music Player"
        autoPlay
        loop={musicSettings?.loopMusic !== false}
        preload="auto"
        crossOrigin="anonymous"
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onError={handleAudioError}
        style={{ display: 'none' }}
      >
        {musicSettings?.musicUrl && (
          <source 
            src={musicSettings.musicUrl} 
            type="audio/mpeg"
          />
        )}
        {/* Fallback for other audio formats */}
        {musicSettings?.musicUrl && (
          <source 
            src={musicSettings.musicUrl} 
            type="audio/wav"
          />
        )}
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
