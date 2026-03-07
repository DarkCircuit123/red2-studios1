/**
 * Optimized callback hook with memoization
 * Prevents unnecessary re-renders and function recreations
 */

import { useCallback, useRef, useEffect } from 'react';

interface UseOptimizedCallbackOptions {
  debounceMs?: number;
  throttleMs?: number;
  memoizeArgs?: boolean;
}

export function useOptimizedCallback<T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList,
  options: UseOptimizedCallbackOptions = {}
): T {
  const { debounceMs = 0, throttleMs = 0, memoizeArgs = true } = options;
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallRef = useRef<number>(0);
  const lastArgsRef = useRef<any[] | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // simple deep comparison optimized for most use cases
  const argsEqual = (a: any[], b: any[]): boolean => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) {
      const x = a[i];
      const y = b[i];
      if (x === y) continue;
      if (typeof x !== typeof y) return false;
      if (x && y && typeof x === 'object') {
        try {
          if (JSON.stringify(x) !== JSON.stringify(y)) return false;
        } catch {
          return false;
        }
      } else {
        return false;
      }
    }
    return true;
  };

  return useCallback(
    ((...args: any[]) => {
      // Memoize args to prevent unnecessary calls
      if (memoizeArgs && lastArgsRef.current && argsEqual(lastArgsRef.current, args)) {
        return;
      }
      lastArgsRef.current = args;

      const execute = () => callback(...args);

      if (throttleMs > 0) {
        const now = Date.now();
        if (now - lastCallRef.current >= throttleMs) {
          lastCallRef.current = now;
          execute();
        }
      } else if (debounceMs > 0) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(execute, debounceMs);
      } else {
        execute();
      }
    }) as T,
    deps
  );
}
