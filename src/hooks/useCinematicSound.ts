import { useEffect, useRef, useCallback, useState } from 'react';
import { getCinematicSoundEngine } from '@/lib/cinematic-sound';

/**
 * Hook for managing cinematic sound engine
 * Provides easy access to sound playback and volume control
 */
export function useCinematicSound() {
  const soundEngineRef = useRef(getCinematicSoundEngine());
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.12);

  // Initialize audio context on user interaction
  useEffect(() => {
    const handleUserInteraction = async () => {
      await soundEngineRef.current.resumeAudioContext();
    };

    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);

    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);

  const playIntro = useCallback(async () => {
    if (!isMuted) {
      try {
        await soundEngineRef.current.playIntroSound();
      } catch (e) {
        console.warn('Failed to play intro sound:', e);
      }
    }
  }, [isMuted]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => {
      const newMuted = !prev;
      soundEngineRef.current.setVolume(newMuted ? 0 : volume);
      return newMuted;
    });
  }, [volume]);

  const setVolumeLevel = useCallback((newVolume: number) => {
    const clampedVolume = Math.max(0, Math.min(1, newVolume));
    setVolume(clampedVolume);
    if (!isMuted) {
      soundEngineRef.current.setVolume(clampedVolume);
    }
  }, [isMuted]);

  return {
    playIntro,
    toggleMute,
    setVolume: setVolumeLevel,
    isMuted,
    volume,
  };
}
