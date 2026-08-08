import { useEffect, useRef, useState } from 'react';
import { BaseCrudService } from '@/integrations';
import { MusicSettings } from '@/entities/index';

export default function BackgroundMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [musicTracks, setMusicTracks] = useState<MusicSettings[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [volume, setVolume] = useState(30);
  const interactionListenersInstalledRef = useRef(false);

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

    console.log('[BackgroundMusicPlayer] Track loaded:', currentTrack.musicUrl);
    
    // Update the audio src attribute
    audioRef.current.src = currentTrack.musicUrl;
    
    // Always call load() when the source changes
    // This ensures the audio element reloads the source correctly
    audioRef.current.load();

    // If already playing, attempt to resume playback with new track
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[BackgroundMusicPlayer] Playback started successfully');
          })
          .catch((error) => {
            console.warn('[BackgroundMusicPlayer] Playback failed:', error);
            setAudioError(true);
          });
      }
    }
  }, [currentTrackIndex, musicTracks, isPlaying]);

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
          console.log('[BackgroundMusicPlayer] Playback started successfully');
          setIsPlaying(true);
          setAudioError(false);
        })
        .catch((err) => {
          // Autoplay was blocked by browser policy - expected behavior
          console.log('[BackgroundMusicPlayer] Autoplay blocked; waiting for first user interaction');
          
          // Install one-time interaction listeners if not already installed
          if (!interactionListenersInstalledRef.current) {
            interactionListenersInstalledRef.current = true;
            
            const handleFirstInteraction = (event: Event) => {
              if (!audioRef.current || isPlaying) return;
              
              console.log('[BackgroundMusicPlayer] First user interaction detected:', event.type);
              
              // Call play() directly inside the event handler (synchronous)
              const playPromise = audioRef.current!.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log('[BackgroundMusicPlayer] Playback started successfully');
                    setIsPlaying(true);
                    setAudioError(false);
                  })
                  .catch((error) => {
                    console.warn('[BackgroundMusicPlayer] Playback failed:', error);
                    setAudioError(true);
                  });
              }
              
              // Remove all temporary listeners after first successful attempt
              document.removeEventListener('pointerdown', handleFirstInteraction);
              document.removeEventListener('keydown', handleFirstInteraction);
              document.removeEventListener('touchstart', handleFirstInteraction);
            };
            
            // Install listeners for first user interaction
            document.addEventListener('pointerdown', handleFirstInteraction);
            document.addEventListener('keydown', handleFirstInteraction);
            document.addEventListener('touchstart', handleFirstInteraction, { passive: true });
          }
        });
    }
  }, [isLoadingSettings, musicTracks.length, currentTrackIndex, isPlaying]);

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
    </>
  );
}
