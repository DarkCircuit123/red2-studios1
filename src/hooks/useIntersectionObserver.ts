/**
 * Intersection Observer hook for lazy loading and visibility detection
 * Optimizes performance by only rendering visible elements
 */

import { useEffect, useRef, useState, useCallback } from 'react';

interface UseIntersectionObserverOptions {
  threshold?: number | number[];
  rootMargin?: string;
  triggerOnce?: boolean;
}

export function useIntersectionObserver<T extends HTMLElement>(
  callback: (isVisible: boolean) => void,
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
  } = options;

  const ref = useRef<T>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [hasBeenVisible, setHasBeenVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const visible = entry.isIntersecting;
        callback(visible);

        if (visible) {
          setIsVisible(true);
          setHasBeenVisible(true);

          if (triggerOnce && ref.current) {
            observer.unobserve(ref.current);
          }
        } else {
          if (!triggerOnce) {
            setIsVisible(false);
          }
        }
      },
      {
        threshold,
        rootMargin,
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
      observer.disconnect();
    };
  }, [callback, threshold, rootMargin, triggerOnce]);

  return {
    ref,
    isVisible: triggerOnce ? hasBeenVisible : isVisible,
    hasBeenVisible,
  };
}

// Variant for multiple elements
export function useIntersectionObserverMultiple(
  options: UseIntersectionObserverOptions = {}
) {
  const {
    threshold = 0.1,
    rootMargin = '50px',
    triggerOnce = true,
  } = options;

  const [visibleElements, setVisibleElements] = useState<Set<HTMLElement>>(new Set());
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        setVisibleElements((prev) => {
          const updated = new Set(prev);
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              updated.add(entry.target as HTMLElement);
            } else if (!triggerOnce) {
              updated.delete(entry.target as HTMLElement);
            }
          });
          return updated;
        });
      },
      {
        threshold,
        rootMargin,
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [threshold, rootMargin, triggerOnce]);

  const observe = useCallback((element: HTMLElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.observe(element);
    }
  }, []);

  const unobserve = useCallback((element: HTMLElement | null) => {
    if (element && observerRef.current) {
      observerRef.current.unobserve(element);
    }
  }, []);

  return {
    observe,
    unobserve,
    visibleElements,
    isVisible: (element: HTMLElement) => visibleElements.has(element),
  };
}
