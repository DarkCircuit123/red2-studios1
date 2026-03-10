/**
 * Advanced React hooks for production-grade optimization
 * Implements: useAsync, usePrevious, useDeepMemo, useLocalStorage, useDebounceCallback
 */

import { useEffect, useRef, useCallback, useMemo, useState, DependencyList } from 'react';
import { adaptiveLoadingManager, performanceMetricsCollector } from '@/lib/advanced-optimization';

/**
 * useAsync Hook
 * Handles async operations with loading, error, and data states
 */
export function useAsync<T, E = string>(
  asyncFunction: () => Promise<T>,
  immediate = true,
  deps?: DependencyList
) {
  const [status, setStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<E | null>(null);

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);
    try {
      const response = await asyncFunction();
      setData(response);
      setStatus('success');
      return response;
    } catch (error) {
      setError(error as E);
      setStatus('error');
    }
  }, deps ? deps : [asyncFunction]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { execute, status, data, error };
}

/**
 * usePrevious Hook
 * Stores previous value of a prop or state
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * useDeepMemo Hook
 * Memoizes value with deep comparison instead of reference equality
 */
export function useDeepMemo<T>(factory: () => T, deps: DependencyList): T {
  const ref = useRef<T>();
  const signalRef = useRef<DependencyList>();

  const isDeepEqual = (a: DependencyList, b: DependencyList): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;

    for (let i = 0; i < a.length; i++) {
      if (JSON.stringify(a[i]) !== JSON.stringify(b[i])) {
        return false;
      }
    }
    return true;
  };

  if (!isDeepEqual(deps, signalRef.current)) {
    signalRef.current = deps;
    ref.current = factory();
  }

  return ref.current!;
}

/**
 * useLocalStorage Hook
 * Syncs state with localStorage
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null;
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T) => {
      try {
        setStoredValue(value);
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(value));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key]
  );

  return [storedValue, setValue];
}

/**
 * useDebounceCallback Hook
 * Debounces callback execution
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: DependencyList
): T {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedCallback = useCallback(
    (...args: any[]) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    deps ? [...deps, delay] : [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
}

/**
 * useThrottleCallback Hook
 * Throttles callback execution
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps?: DependencyList
): T {
  const lastRunRef = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const throttledCallback = useCallback(
    (...args: any[]) => {
      const now = Date.now();
      const timeSinceLastRun = now - lastRunRef.current;

      if (timeSinceLastRun >= delay) {
        callback(...args);
        lastRunRef.current = now;
      } else {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          callback(...args);
          lastRunRef.current = Date.now();
        }, delay - timeSinceLastRun);
      }
    },
    deps ? [...deps, delay] : [callback, delay]
  ) as T;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return throttledCallback;
}

/**
 * useIntersectionObserverRef Hook
 * Efficiently observes element visibility
 */
export function useIntersectionObserverRef(
  callback: (isVisible: boolean) => void,
  options: IntersectionObserverInit = {}
) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      callback(entry.isIntersecting);
    }, options);

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [callback, options]);

  return ref;
}

/**
 * useAdaptiveLoading Hook
 * Adapts content loading based on network conditions
 */
export function useAdaptiveLoading() {
  const [connectionInfo, setConnectionInfo] = useState(() =>
    adaptiveLoadingManager.getConnectionInfo()
  );

  useEffect(() => {
    const updateConnectionInfo = () => {
      setConnectionInfo(adaptiveLoadingManager.getConnectionInfo());
    };

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateConnectionInfo);
      return () => connection.removeEventListener('change', updateConnectionInfo);
    }
  }, []);

  return connectionInfo;
}

/**
 * usePerformanceMetrics Hook
 * Tracks performance metrics
 */
export function usePerformanceMetrics() {
  const [metrics, setMetrics] = useState(() => performanceMetricsCollector.getMetrics());

  useEffect(() => {
    performanceMetricsCollector.startTracking();

    const interval = setInterval(() => {
      setMetrics(performanceMetricsCollector.getMetrics());
    }, 5000);

    return () => {
      clearInterval(interval);
      performanceMetricsCollector.stopTracking();
    };
  }, []);

  return metrics;
}

/**
 * useRenderCount Hook
 * Tracks component render count (development only)
 */
export function useRenderCount(componentName: string) {
  const renderCount = useRef(0);

  useEffect(() => {
    renderCount.current++;
    if (process.env.NODE_ENV === 'development') {
      console.log(`🔄 ${componentName} rendered ${renderCount.current} times`);
    }
  });

  return renderCount.current;
}

/**
 * useMemoizedCallback Hook
 * Memoizes callback with deep dependency comparison
 */
export function useMemoizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: DependencyList
): T {
  const memoizedCallback = useDeepMemo(() => callback, deps);
  return useCallback(memoizedCallback, [memoizedCallback]) as T;
}

/**
 * useWindowSize Hook
 * Tracks window size with throttling
 */
export function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  const handleResize = useThrottleCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, 150);

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [handleResize]);

  return windowSize;
}

/**
 * useIsMounted Hook
 * Safely checks if component is mounted
 */
export function useIsMounted() {
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  return useCallback(() => isMountedRef.current, []);
}

/**
 * useEffectOnce Hook
 * Runs effect only once on mount
 */
export function useEffectOnce(effect: () => void | (() => void)) {
  useEffect(effect, []);
}

/**
 * useUpdateEffect Hook
 * Runs effect only on updates, not on mount
 */
export function useUpdateEffect(effect: () => void | (() => void), deps: DependencyList) {
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    return effect();
  }, deps);
}
