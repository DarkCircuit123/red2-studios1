import { useRef, useEffect, useState } from 'react';
import { respectReducedMotion } from '@/lib/performance-enhancements';

interface UseScrollAnimationOptions {
  threshold?: number;
  margin?: string;
  triggerOnce?: boolean;
}

/**
 * Hook for scroll-triggered animations with Intersection Observer
 * Respects reduced-motion preferences and ensures smooth performance
 */
export function useScrollAnimation(options: UseScrollAnimationOptions = {}) {
  const {
    threshold = 0.1,
    margin = '-50px',
    triggerOnce = true,
  } = options;

  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const hasAnimatedRef = useRef(false);
  const prefersReducedMotion = respectReducedMotion();

  useEffect(() => {
    if (!ref.current) return;

    // Skip animation setup if reduced motion is preferred
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

  return { ref, isVisible };
}
