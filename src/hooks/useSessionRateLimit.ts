import { useEffect, useRef, useState } from 'react';

interface UseSessionRateLimitReturn {
  recordAttempt: () => void;
  isLocked: boolean;
  remainingLockoutSec: number;
  reset: () => void;
}

interface RateLimitData {
  attempts: number[];
  lockedUntil: number | null;
}

export function useSessionRateLimit(
  key: string,
  maxAttempts: number,
  windowMs: number,
  lockoutMs: number
): UseSessionRateLimitReturn {
  const [isLocked, setIsLocked] = useState(false);
  const [remainingLockoutSec, setRemainingLockoutSec] = useState(0);

  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const storageKeyRef = useRef(`rateLimit:${key}`);

  const getRateLimitData = (): RateLimitData => {
    try {
      const stored = sessionStorage.getItem(storageKeyRef.current);
      return stored ? JSON.parse(stored) : { attempts: [], lockedUntil: null };
    } catch {
      return { attempts: [], lockedUntil: null };
    }
  };

  const setRateLimitData = (data: RateLimitData) => {
    try {
      sessionStorage.setItem(storageKeyRef.current, JSON.stringify(data));
    } catch (err) {
      console.error('[useSessionRateLimit] Failed to persist:', err);
    }
  };

  const recordAttempt = () => {
    const data = getRateLimitData();
    const now = Date.now();

    // Check if locked
    if (data.lockedUntil && now < data.lockedUntil) {
      return;
    }

    // Clear old attempts outside the window
    data.attempts = data.attempts.filter((ts) => now - ts < windowMs);

    // Add new attempt
    data.attempts.push(now);

    // Check if exceeded
    if (data.attempts.length >= maxAttempts) {
      data.lockedUntil = now + lockoutMs;
      setIsLocked(true);
      startCountdown();
    }

    setRateLimitData(data);
  };

  const reset = () => {
    try {
      sessionStorage.removeItem(storageKeyRef.current);
    } catch (err) {
      console.error('[useSessionRateLimit] Failed to reset:', err);
    }
    setIsLocked(false);
    setRemainingLockoutSec(0);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
  };

  const startCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      const data = getRateLimitData();
      const now = Date.now();

      if (data.lockedUntil && now < data.lockedUntil) {
        const remaining = Math.ceil((data.lockedUntil - now) / 1000);
        setRemainingLockoutSec(remaining);
      } else {
        setIsLocked(false);
        setRemainingLockoutSec(0);
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
        }
      }
    }, 100);
  };

  // Check initial state
  useEffect(() => {
    const data = getRateLimitData();
    const now = Date.now();

    if (data.lockedUntil && now < data.lockedUntil) {
      setIsLocked(true);
      startCountdown();
    }
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  return {
    recordAttempt,
    isLocked,
    remainingLockoutSec,
    reset,
  };
}
