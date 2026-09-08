import { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX } from 'lucide-react';
import { motion } from 'framer-motion';
import type { MusicSettings } from '@/entities/index';
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

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const loadMusicTracks = async () => {
      try {
        const response = await fetch('/api/cms/get-musicsettings', {
          method: 'GET',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`Music settings request failed: ${response.status}`);

        const result = await response.json();
        if (cancelled) return;

        const enabledTracks = Array.isArray(result?.items)
          ? (result.items as MusicSettings[]).filter(track => track.isEnabled === true && !!track.musicUrl)
          : [];

        setMusicTracks(enabledTracks);
        if (enabledTracks[0]?.volume !== undefined) {
          setVolume(Math.max(0, Math.min(100, Number(enabledTracks[0].volume) || 0)));
        }
      } catch (error) {
        if (!cancelled && (error instanceof Error ? error.name !== 'AbortError' : true)) {
          console.error('[MUSIC_PLAYER] Error loading music tracks:', error);
        }
      } finally {
        clearTimeout(timeoutId);
        if (!cancelled) setIsLoadingSettings(false);
      }
    };

    loadMusicTracks();
    return () => {
      cancelled = true;
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (musicTracks.length === 0 || currentTrackIndex >= musicTracks.length) {
      setPlayableUrl(null);
      return;
    }

    const currentTrack = musicTracks[currentTrackIndex];
    setPlayableUrl(getPlayableAudioUrl(currentTrack.musicUrl, undefined));
  }, [musicTracks, currentTrackIndex]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = Math.max(0, Math.min(1, volume / 100));
    }
  }, [volume]);

  useEffect(() => {
    if (isLoadingSettings || musicTracks.length === 0 || !audioRef.current || !playableUrl) return;

    const attemptAutoplay = async () => {
      try {
        const audio = audioRef.current;
        if (!audio) return;
        if (audio.readyState === 0) audio.load();
        await audio.play();
        setAudioError(false);
        setHasInteracted(true);
      } catch {
        setAudioError(true);
      }
    };

    const autoplayTimer = setTimeout(attemptAutoplay, 100);

    const handleUserInteraction = async () => {
      if (!hasInteracted && audioRef.current && !isPlaying) {
        setHasInteracted(true);
        try {
          await audioRef.current.play();
          setAudioError(false);
        } catch {
          setAudioError(true);
          setIsPlaying(false);
        }
      }
    };

    document.addEventListener('click', handleUserInteraction, { once: true });
    document.addEventListener('touchstart', handleUserInteraction, { once: true, passive: true });
    document.addEventListener('keydown', handleUserInteraction, { once: true });

    return () => {
      clearTimeout(autoplayTimer);
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
      document.removeEventListener('keydown', handleUserInteraction);
    };
  }, [isLoadingSettings, musicTracks.length, isPlaying, hasInteracted, playableUrl]);

  const toggleMute = () => {
    if (!audioRef.current) return;
    const newMutedState = !isMuted;
    audioRef.current.muted = newMutedState;
    setIsMuted(newMutedState);

    if (!newMutedState && !isPlaying && musicTracks.length > 0) {
      audioRef.current.play()
        .then(() => setAudioError(false))
        .catch(() => {
          setAudioError(true);
          setIsPlaying(false);
        });
    }
  };

  const handleAudioPlay = () => {
    setIsPlaying(true);
    setAudioError(false);
  };

  const handleAudioPause = () => setIsPlaying(false);

  const handleAudioError = (event: React.SyntheticEvent<HTMLAudioElement>) => {
    const audio = event.currentTarget;
    console.error('[MUSIC_PLAYER] Audio playback error:', {
      errorCode: audio.error?.code,
      errorMessage: audio.error?.message,
      src: audio.src,
      readyState: audio.readyState,
      networkState: audio.networkState,
    });
    setAudioError(true);
    setIsPlaying(false);
  };

  if (isLoadingSettings || musicTracks.length === 0 || !playableUrl) return null;

  const currentTrack = musicTracks[currentTrackIndex];

  return (
    <>
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
        <source src={playableUrl} type="audio/mpeg" />
        <source src={playableUrl} type="audio/wav" />
        <source src={playableUrl} type="audio/ogg" />
      </audio>

      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.15, rotate: 10 }}
        whileTap={{ scale: 0.9 }}
        onClick={toggleMute}
        className={`fixed bottom-8 right-8 z-40 p-2 rounded-full transition-all duration-300 backdrop-blur-md border border-white/20 ${
          isMuted ? 'bg-gray-600/30 text-white hover:bg-gray-600/40' : 'bg-primary/30 text-white hover:bg-primary/40'
        }`}
        aria-label={isMuted ? 'Unmute music' : 'Mute music'}
        title={isMuted ? 'Click to unmute background music' : 'Click to mute background music'}
      >
        <motion.div
          animate={{
            scale: isPlaying && !isMuted ? [1, 1.1, 1] : 1,
            opacity: isPlaying && !isMuted ? [1, 0.8, 1] : 1,
          }}
          transition={{
            duration: 1.5,
            repeat: isPlaying && !isMuted ? Infinity : 0,
            repeatType: 'loop',
          }}
        >
          {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
        </motion.div>
      </motion.button>
    </>
  );
}
