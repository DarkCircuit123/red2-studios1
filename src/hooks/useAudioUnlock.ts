import { useEffect, useRef, useState } from 'react';

interface UseAudioUnlockReturn {
  unlocked: boolean;
  context: AudioContext | null;
  playSound: (fn: (ctx: AudioContext) => void) => void;
}

export function useAudioUnlock(): UseAudioUnlockReturn {
  const [unlocked, setUnlocked] = useState(false);
  const contextRef = useRef<AudioContext | null>(null);
  const listenerAttachedRef = useRef(false);

  const playSound = (fn: (ctx: AudioContext) => void) => {
    if (!contextRef.current) {
      return;
    }

    try {
      fn(contextRef.current);
    } catch (err) {
      console.error('[useAudioUnlock] playSound error:', err);
    }
  };

  useEffect(() => {
    if (listenerAttachedRef.current) {
      return;
    }

    const handleUserGesture = async () => {
      if (unlocked || contextRef.current?.state === 'running') {
        return;
      }

      try {
        if (!contextRef.current) {
          contextRef.current = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        }

        if (contextRef.current.state === 'suspended') {
          await contextRef.current.resume();
        }

        setUnlocked(true);

        // Remove listeners after first unlock
        document.removeEventListener('click', handleUserGesture);
        document.removeEventListener('keydown', handleUserGesture);
        listenerAttachedRef.current = false;
      } catch (err) {
        console.error('[useAudioUnlock] Failed to unlock audio:', err);
      }
    };

    document.addEventListener('click', handleUserGesture);
    document.addEventListener('keydown', handleUserGesture);
    listenerAttachedRef.current = true;

    return () => {
      document.removeEventListener('click', handleUserGesture);
      document.removeEventListener('keydown', handleUserGesture);
    };
  }, [unlocked]);

  useEffect(() => {
    return () => {
      if (contextRef.current && contextRef.current.state !== 'closed') {
        contextRef.current.close();
      }
    };
  }, []);

  return {
    unlocked,
    context: contextRef.current,
    playSound,
  };
}
