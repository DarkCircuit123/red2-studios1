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
    let isMounted = true;

    const loadMusicSettings = async () => {
      try {
        console.log('[MUSIC_PLAYER] Loading music settings from CMS...');
        const result = await Promise.race([
          BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 1 }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000))
        ]);
        
        if (!isMounted) return;
        
        if (result?.items && result.items.length > 0) {
          const settings = result.items[0];
          console.log('[MUSIC_PLAYER] Settings loaded:', {
            isEnabled: settings.isEnabled,
            musicUrl: settings.musicUrl ? `${settings.musicUrl.substring(0, 50)}...` : 'none',
            volume: settings.volume,
            loopMusic: settings.loopMusic
          });
          setMusicSettings(settings);
        } else {
          console.log('[MUSIC_PLAYER] No music settings found in CMS');
        }
      } catch (error) {
        if (isMounted) {
          console.error('[MUSIC_PLAYER] Failed to load music settings:', error);
        }
      } finally {
        if (isMounted) {
          setIsLoadingSettings(false);
        }
      }
    };

    loadMusicSettings();
    
    return () => {
      isMounted = false;
    };
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

    console.log('[MUSIC_PLAYER] Attempting autoplay...');

    const attemptAutoplay = async () => {
      try {
        // Ensure audio element is ready
        if (audioRef.current!.readyState === 0) {
          console.log('[MUSIC_PLAYER] Loading audio element...');
          audioRef.current!.load();
        }
        
        // Attempt to play immediately
        console.log('[MUSIC_PLAYER] Calling play()...');
        const playPromise = audioRef.current!.play();
        if (playPromise !== undefined) {
          await playPromise;
          console.log('[MUSIC_PLAYER] Autoplay successful');
          setIsPlaying(true);
          setAudioError(false);
          setHasInteracted(true);
        }
      } catch (err) {
        console.log('[MUSIC_PLAYER] Autoplay failed (expected), will retry on user interaction:', err);
        // Autoplay was blocked, will retry on first user interaction
      }
    };

    // Try autoplay immediately
    attemptAutoplay();

    // Fallback: Listen for user interaction to retry playback if autoplay failed
    const handleUserInteraction = async () => {
      if (!hasInteracted && audioRef.current && !isPlaying) {
        console.log('[MUSIC_PLAYER] User interaction detected, attempting playback...');
        setHasInteracted(true);
        
        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            console.log('[MUSIC_PLAYER] Playback successful after user interaction');
            setIsPlaying(true);
            setAudioError(false);
          }
        } catch (err) {
          console.error('[MUSIC_PLAYER] Audio playback failed on user interaction:', err);
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
      console.log(`[MUSIC_PLAYER] Mute toggled: ${newMutedState}`);
      
      // If unmuting and not playing, try to play
      if (!newMutedState && !isPlaying) {
        console.log('[MUSIC_PLAYER] Unmuted, attempting to play...');
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('[MUSIC_PLAYER] Playback started after unmute');
              setIsPlaying(true);
            })
            .catch((err) => {
              console.error('[MUSIC_PLAYER] Playback failed after unmute:', err);
              setAudioError(true);
            });
        }
      }
    }
  };

  const handleAudioPlay = () => {
    console.log('[MUSIC_PLAYER] Audio playing');
    setIsPlaying(true);
    setAudioError(false);
  };

  const handleAudioPause = () => {
    console.log('[MUSIC_PLAYER] Audio paused');
    setIsPlaying(false);
  };

  const handleAudioError = () => {
    console.error('[MUSIC_PLAYER] Audio element error');
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
        <source 
          src={musicSettings?.musicUrl || 'https://static.wixstatic.com/media/12d367_71ebdd7141d041e4be3d91d80d4578dd~mv2.mp3'} 
          type="audio/mpeg"
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
