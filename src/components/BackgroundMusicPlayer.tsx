import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { MusicSettings } from '@/entities/index';
import { getPlayableAudioUrl } from '@/lib/wix-audio-resolver';

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
  const [playableUrl, setPlayableUrl] = useState<string | null>(null);

  // Load all music tracks from CMS on every site load
  useEffect(() => {
    const loadMusicTracks = async () => {
      try {
        console.log('[MUSIC_PLAYER] Starting to load music tracks from CMS...');
        const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });
        
        console.log('[MUSIC_PLAYER] Query result:', {
          totalCount: result.totalCount,
          itemCount: result.items?.length,
          items: result.items?.map(t => ({
            _id: t._id,
            musicTitle: t.musicTitle,
            isEnabled: t.isEnabled,
            audio: t.audio ? '✓ (present)' : '✗ (missing)',
            volume: t.volume,
            loopMusic: t.loopMusic,
            autoplayEnabled: t.autoplayEnabled
          }))
        });
        
        // Filter for enabled tracks with canonical audio field
        const enabledTracks = result.items?.filter(track => {
          const isEnabled = track.isEnabled === true;
          // Use canonical audio field for playable URL
          const hasAudio = !!track.audio;
          console.log('[MUSIC_PLAYER] Filtering track:', {
            title: track.musicTitle,
            isEnabled,
            hasAudio,
            included: isEnabled && hasAudio
          });
          return isEnabled && hasAudio;
        }) || [];
        
        if (enabledTracks.length > 0) {
          console.log('[MUSIC_PLAYER] Found enabled tracks:', enabledTracks.length);
          console.log('[MUSIC_PLAYER] First track details:', {
            title: enabledTracks[0].musicTitle,
            audio: enabledTracks[0].audio,
            volume: enabledTracks[0].volume,
            loop: enabledTracks[0].loopMusic,
            autoplay: enabledTracks[0].autoplayEnabled
          });
          
          setMusicTracks(enabledTracks);
          // Get volume from first track if available
          if (enabledTracks[0]?.volume) {
            setVolume(enabledTracks[0].volume);
          }
          console.log('[MUSIC_PLAYER] Loaded enabled music tracks:', enabledTracks.length);
        } else {
          console.log('[MUSIC_PLAYER] No enabled music tracks found');
        }
      } catch (error) {
        // Silently fail - music is optional
        console.error('[MUSIC_PLAYER] Error loading music tracks:', error);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadMusicTracks();
  }, []);

  // Resolve playable URL from current track
  useEffect(() => {
    if (musicTracks.length === 0 || currentTrackIndex >= musicTracks.length) {
      setPlayableUrl(null);
      return;
    }

    const currentTrack = musicTracks[currentTrackIndex];
    // Use canonical audio field for playable URL
    const url = getPlayableAudioUrl(undefined, currentTrack.audio);
    
    console.log('[MUSIC_PLAYER] Resolved playable URL:', {
      trackTitle: currentTrack.musicTitle,
      audio: currentTrack.audio,
      playableUrl: url
    });
    
    setPlayableUrl(url);
  }, [musicTracks, currentTrackIndex]);

  // Set audio volume when it changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.min(1, volume / 100);
    }
  }, [volume]);

  // Attempt to autoplay music on site load
  // If browser autoplay policy blocks audible playback, initialize on first user interaction
  useEffect(() => {
    if (isLoadingSettings || musicTracks.length === 0 || !audioRef.current || !playableUrl) {
      console.log('[MUSIC_PLAYER] Skipping autoplay setup:', {
        isLoadingSettings,
        tracksCount: musicTracks.length,
        hasAudioRef: !!audioRef.current,
        hasPlayableUrl: !!playableUrl
      });
      return;
    }

    const attemptAutoplay = async () => {
      try {
        const audio = audioRef.current;
        if (!audio) return;

        // Ensure audio element is ready and has source
        if (audio.readyState === 0) {
          console.log('[MUSIC_PLAYER] Audio readyState is 0, calling load()');
          audio.load();
        }
        
        console.log('[MUSIC_PLAYER] Attempting autoplay on site load', {
          readyState: audio.readyState,
          src: audio.src,
          autoplay: audio.autoplay,
          muted: audio.muted
        });
        
        // Attempt to play immediately (muted first to bypass autoplay policy)
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          setIsPlaying(true);
          setAudioError(false);
          setHasInteracted(true);
          console.log('[MUSIC_PLAYER] Autoplay succeeded');
        }
      } catch (err) {
        // Autoplay was blocked by browser policy, will retry on first user interaction
        console.log('[MUSIC_PLAYER] Autoplay blocked by browser policy, waiting for user interaction', {
          error: err instanceof Error ? err.message : String(err)
        });
      }
    };

    // Small delay to ensure audio element is fully mounted and ready
    const autoplayTimer = setTimeout(() => {
      attemptAutoplay();
    }, 100);

    // Fallback: Listen for user interaction to retry playback if autoplay failed
    const handleUserInteraction = async () => {
      if (!hasInteracted && audioRef.current && !isPlaying) {
        console.log('[MUSIC_PLAYER] User interaction detected, attempting playback');
        setHasInteracted(true);
        
        try {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
            setIsPlaying(true);
            setAudioError(false);
            console.log('[MUSIC_PLAYER] Playback started on user interaction');
          }
        } catch (err) {
          console.error('[MUSIC_PLAYER] Playback failed on user interaction:', err);
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
      // Cleanup timer and listeners if component unmounts before interaction
      clearTimeout(autoplayTimer);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isLoadingSettings, musicTracks.length, isPlaying, hasInteracted, playableUrl]);

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
    console.log('[MUSIC_PLAYER] Audio started playing');
    setIsPlaying(true);
    setAudioError(false);
  };

  const handleAudioPause = () => {
    console.log('[MUSIC_PLAYER] Audio paused');
    setIsPlaying(false);
  };

  const handleAudioError = (event: Event) => {
    const audio = event.target as HTMLAudioElement;
    const errorCode = audio.error?.code;
    const errorMessage = audio.error?.message;
    
    console.error('[MUSIC_PLAYER] Audio playback error:', {
      errorCode,
      errorMessage,
      src: audio.src,
      readyState: audio.readyState,
      networkState: audio.networkState
    });
    setAudioError(true);
  };

  // Don't render if music is disabled or settings not loaded
  if (isLoadingSettings || musicTracks.length === 0) {
    console.log('[MUSIC_PLAYER] Not rendering - music disabled or not loaded:', {
      isLoadingSettings,
      tracksCount: musicTracks.length
    });
    return null;
  }

  // Get current track
  const currentTrack = musicTracks[currentTrackIndex];

  // Validate playable URL is available
  if (!playableUrl) {
    console.log('[MUSIC_PLAYER] Not rendering - no playable URL:', {
      trackIndex: currentTrackIndex,
      trackTitle: currentTrack?.musicTitle,
      audioField: currentTrack?.audio
    });
    return null;
  }

  console.log('[MUSIC_PLAYER] Rendering with track:', {
    title: currentTrack.musicTitle,
    playableUrl,
    isPlaying,
    isMuted
  });

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
          src={playableUrl} 
          type="audio/mpeg"
        />
        {/* Fallback for other audio formats */}
        <source 
          src={playableUrl} 
          type="audio/wav"
        />
        {/* Fallback for OGG */}
        <source 
          src={playableUrl} 
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
