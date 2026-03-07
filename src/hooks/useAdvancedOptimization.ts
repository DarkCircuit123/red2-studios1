/**
 * Advanced React hooks for production-grade optimization
 * Implements: useAsync, usePrevious, useDeepMemo, useLocalStorage, useDebounceCallback
 */

import { useEffect, useRef, useCallback, useMemo, useState, DependencyList } from 'react';
import { adaptiveLoadingManager, performanceMetricsCollector } from '@/lib/advanced-optimization';
import { useOptimizedCallback } from './useOptimizedCallback';
import { useEventListener } from './useEventListener';

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

  // use shared isMounted hook to avoid updating after unmount
  const isMounted = useIsMounted();

  const execute = useCallback(async () => {
    setStatus('pending');
    setData(null);
    setError(null);
    try {
      const response = await asyncFunction();
      if (isMounted()) {
        setData(response);
        setStatus('success');
      }
      return response;
    } catch (error) {
      if (isMounted()) {
        setError(error as E);
        setStatus('error');
      }
    }
  }, deps ? deps : [asyncFunction, isMounted]);

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

  // naive recursive deep equal optimized for small dependency arrays
  const isDeepEqual = (a: DependencyList, b: DependencyList): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (a.length !== b.length) return false;

    const compare = (x: any, y: any): boolean => {
      if (x === y) return true;
      if (typeof x !== typeof y) return false;
      if (x && y && typeof x === 'object') {
        if (Array.isArray(x) && Array.isArray(y)) {
          if (x.length !== y.length) return false;
          for (let i = 0; i < x.length; i++) {
            if (!compare(x[i], y[i])) return false;
          }
          return true;
        }
        const keysX = Object.keys(x);
        const keysY = Object.keys(y);
        if (keysX.length !== keysY.length) return false;
        for (const key of keysX) {
          if (!compare(x[key], y[key])) return false;
        }
        return true;
      }
      return false;
    };

    for (let i = 0; i < a.length; i++) {
      if (!compare(a[i], b[i])) {
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
 * Debounces callback execution; now backed by useOptimizedCallback for
 * consistent memoization and option expansion.
 */
export function useDebounceCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList = []
): T {
  // include delay in deps so the wrapped hook can watch it
  return useOptimizedCallback(callback, [...deps, delay], { debounceMs: delay });
}

/**
 * useThrottleCallback Hook
 * Throttles callback execution; delegates to useOptimizedCallback for shared
 * logic.
 */
export function useThrottleCallback<T extends (...args: any[]) => any>(
  callback: T,
  delay: number,
  deps: DependencyList = []
): T {
  return useOptimizedCallback(callback, [...deps, delay], { throttleMs: delay });
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
  const { threshold, root, rootMargin } = options;

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      callback(entry.isIntersecting);
    }, { threshold, root, rootMargin });

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [callback, threshold, root, rootMargin]);

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

  const updateConnectionInfo = useCallback(() => {
    setConnectionInfo(adaptiveLoadingManager.getConnectionInfo());
  }, []);

  // useEventListener makes the cleanup automatic and the listener stable
  const connection = (navigator as any).connection;
  useEventListener('change', updateConnectionInfo, undefined, connection);

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

  const update = useCallback(() => {
    setWindowSize({
      width: window.innerWidth,
      height: window.innerHeight,
    });
  }, []);

  const handleResize = useThrottleCallback(update, 150, []);

  // use the generalized event listener helper instead of manual effect
  useEventListener('resize', handleResize, { passive: true });

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

/**
 * useDebouncedValue Hook
 * Returns a debounced version of a value that only updates after delay ms
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

/**
 * useThrottledValue Hook
 * Returns a value that only updates at most once per `limit` ms
 */
export function useThrottledValue<T>(value: T, limit: number): T {
  const [throttled, setThrottled] = useState(value);
  const lastRef = useRef(Date.now());

  useEffect(() => {
    const now = Date.now();
    if (now - lastRef.current >= limit) {
      setThrottled(value);
      lastRef.current = now;
    } else {
      const handle = setTimeout(() => {
        setThrottled(value);
        lastRef.current = Date.now();
      }, limit - (now - lastRef.current));
      return () => clearTimeout(handle);
    }
  }, [value, limit]);

  return throttled;
}

/**
 * useVirtualList
 * Provides start/end indices for rendering a windowed subset of an array.
 * Only supports fixed-height items.
 */
export function useVirtualList(
  itemCount: number,
  itemHeight: number,
  containerHeight: number,
  scrollTop: number
) {
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(itemCount - 1, Math.floor((scrollTop + containerHeight) / itemHeight));
  const offset = startIndex * itemHeight;

  return {
    startIndex,
    endIndex,
    offset,
  };
}
