import { useEffect, useRef, useState } from 'react';
import { BaseCrudService } from '@/integrations';
import { MusicSettings } from '@/entities/index';

export default function BackgroundMusicPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [currentTrack, setCurrentTrack] = useState<MusicSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const interactionListenersInstalledRef = useRef(false);

  // Load music tracks from CMS and select the default one
  useEffect(() => {
    const loadMusicTracks = async () => {
      try {
        const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });
        const allTracks = result.items || [];

        // FIRST: Find the enabled track where isDefaultHomepageTrack === true
        const defaultTrack = allTracks.find(
          (track) => track.isEnabled && track.musicUrl && track.isDefaultHomepageTrack
        );

        if (defaultTrack) {
          console.log('[BackgroundMusicPlayer] Using default track:', defaultTrack.musicTitle);
          setCurrentTrack(defaultTrack);
        } else {
          // FALLBACK: Use the first enabled track with a valid musicUrl
          const firstEnabledTrack = allTracks.find(
            (track) => track.isEnabled && track.musicUrl
          );

          if (firstEnabledTrack) {
            console.log('[BackgroundMusicPlayer] Using first enabled track:', firstEnabledTrack.musicTitle);
            setCurrentTrack(firstEnabledTrack);
          } else {
            console.log('[BackgroundMusicPlayer] No valid enabled track found');
            setCurrentTrack(null);
          }
        }
      } catch (error) {
        console.warn('[BackgroundMusicPlayer] Error loading tracks:', error);
        setCurrentTrack(null);
      } finally {
        setIsLoadingSettings(false);
      }
    };

    loadMusicTracks();
  }, []);

  // Handle track changes - reload audio source when track changes
  useEffect(() => {
    if (!audioRef.current || !currentTrack?.musicUrl) return;

    console.log('[BackgroundMusicPlayer] Loading track:', currentTrack.musicTitle, 'URL:', currentTrack.musicUrl);

    // Update the audio src attribute
    audioRef.current.src = currentTrack.musicUrl;

    // Call load() once when the source changes
    audioRef.current.load();

    // If already playing, attempt to resume playback with new track
    if (isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log('[BackgroundMusicPlayer] Playback resumed successfully');
          })
          .catch((error) => {
            console.warn('[BackgroundMusicPlayer] Playback failed:', error);
            setAudioError(true);
          });
      }
    }
  }, [currentTrack, isPlaying]);

  // Attempt to autoplay music on site load
  useEffect(() => {
    if (isLoadingSettings || !currentTrack?.musicUrl || !audioRef.current) return;

    console.log('[BackgroundMusicPlayer] Attempting autoplay for:', currentTrack.musicTitle);

    // Set the audio source
    audioRef.current.src = currentTrack.musicUrl;
    audioRef.current.load();

    // Attempt to play immediately
    const playPromise = audioRef.current.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          console.log('[BackgroundMusicPlayer] Autoplay successful');
          setIsPlaying(true);
          setAudioError(false);
        })
        .catch((err) => {
          // Autoplay was blocked by browser policy - expected behavior
          console.log('[BackgroundMusicPlayer] Autoplay blocked by browser; waiting for first user interaction');

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
                    console.log('[BackgroundMusicPlayer] Playback started after user interaction');
                    setIsPlaying(true);
                    setAudioError(false);
                  })
                  .catch((error) => {
                    console.warn('[BackgroundMusicPlayer] Playback failed after interaction:', error);
                    setAudioError(true);
                  });
              }

              // Remove all temporary listeners after first attempt
              document.removeEventListener('pointerdown', handleFirstInteraction);
              document.removeEventListener('click', handleFirstInteraction);
              document.removeEventListener('keydown', handleFirstInteraction);
              document.removeEventListener('touchstart', handleFirstInteraction);
            };

            // Install listeners for first user interaction
            document.addEventListener('pointerdown', handleFirstInteraction);
            document.addEventListener('click', handleFirstInteraction);
            document.addEventListener('keydown', handleFirstInteraction);
            document.addEventListener('touchstart', handleFirstInteraction, { passive: true });
          }
        });
    }
  }, [isLoadingSettings, currentTrack, isPlaying]);

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
      src: audio.src,
    });
    setAudioError(true);
  };

  // Don't render if settings not loaded or no valid track
  if (isLoadingSettings || !currentTrack?.musicUrl) {
    return null;
  }

  return (
    <>
      {/* Hidden audio element - background music */}
      <audio
        ref={audioRef}
        title="Background Music Player"
        autoPlay
        loop={currentTrack.loopMusic !== false}
        preload="auto"
        crossOrigin="anonymous"
        onPlay={handleAudioPlay}
        onPause={handleAudioPause}
        onError={handleAudioError}
        style={{ display: 'none' }}
      >
        <source src={currentTrack.musicUrl} type="audio/mpeg" />
        <source src={currentTrack.musicUrl} type="audio/wav" />
        <source src={currentTrack.musicUrl} type="audio/ogg" />
      </audio>
    </>
  );
}
