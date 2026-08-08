/**
 * Hook for managing editorial motion animations
 * Provides viewport-based triggering with reduced-motion support
 */

import { useRef, useEffect, useState } from 'react';
import { shouldReduceMotion, editorialViewportConfig } from '@/lib/editorial-motion-system';

interface UseEditorialMotionOptions {
  threshold?: number;
  margin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook for scroll-triggered editorial animations
 * Respects reduced-motion preferences and ensures smooth performance
 */
export function useEditorialMotion(options: UseEditorialMotionOptions = {}) {
  const {
    threshold = editorialViewportConfig.threshold,
    margin = editorialViewportConfig.rootMargin,
    triggerOnce = editorialViewportConfig.triggerOnce,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimatedRef = useRef(false);
  const prefersReducedMotion = shouldReduceMotion();

  useEffect(() => {
    if (!ref.current) return;

    // If reduced motion is preferred, show content immediately
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          if (triggerOnce && hasAnimatedRef.current) return;
          
          setIsVisible(true);
          hasAnimatedRef.current = true;

          if (triggerOnce) {
            observer.unobserve(entry.target);
          }
        } else if (!triggerOnce) {
          setIsVisible(false);
        }
      },
      {
        threshold,
        rootMargin: margin,
      }
    );

    observer.observe(ref.current);

    return () => {
      if (ref.current) {
        observer.unobserve(ref.current);
      }
    };
  }, [threshold, margin, triggerOnce, prefersReducedMotion]);

  return { ref, isVisible, prefersReducedMotion };
}

/**
 * Hook for managing staggered animations across multiple elements
 */
export function useEditorialStagger(itemCount: number, baseDelay = 0.1, staggerDelay = 0.12) {
  const getItemDelay = (index: number) => baseDelay + index * staggerDelay;
  
  return { getItemDelay };
}
