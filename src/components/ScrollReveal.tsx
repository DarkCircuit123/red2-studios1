import React, { useEffect, useRef } from 'react';

interface ScrollRevealOptions {
  threshold?: number;
  rootMargin?: string;
}

/**
 * Hook to add scroll reveal animations using IntersectionObserver
 * Adds .is-visible class when element enters viewport
 * Unobserves after first reveal to prevent re-animation on scroll back
 */
export const useScrollReveal = (options: ScrollRevealOptions = {}) => {
  const ref = useRef<HTMLElement>(null);
  const { threshold = 0.15, rootMargin = '0px 0px -10% 0px' } = options;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
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
    };
  }, [threshold, rootMargin]);

  return ref;
};

/**
 * Component wrapper for scroll reveal animations
 * Applies .reveal class and manages IntersectionObserver
 */
export const ScrollReveal: React.FC<{
  children: React.ReactNode;
  className?: string;
  revealClass?: 'reveal' | 'reveal-wipe';
  delay?: 1 | 2 | 3 | 4 | 5;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
}> = ({ children, className = '', revealClass = 'reveal', delay, direction, duration }) => {
  const ref = useScrollReveal();
  const delayClass = delay ? `reveal-delay-${delay}` : '';

  return (
    <div
      ref={ref}
      className={`${revealClass} ${delayClass} ${className}`.trim()}
    >
      {children}
    </div>
  );
};

export default ScrollReveal;
