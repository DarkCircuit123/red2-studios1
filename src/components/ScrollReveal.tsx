import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

export type RevealDirection = 'left' | 'right' | 'up' | 'down' | 'center';

interface ScrollRevealProps {
  children: React.ReactNode;
  direction?: RevealDirection;
  delay?: number;
  duration?: number;
  className?: string;
  staggerChildren?: boolean;
  index?: number;
  baseDelay?: number;
}

const getInitialVariant = (direction: RevealDirection) => {
  const baseConfig = {
    opacity: 0,
    transition: { duration: 0 },
  };

  switch (direction) {
    case 'left':
      return { ...baseConfig, x: -160 };
    case 'right':
      return { ...baseConfig, x: 160 };
    case 'up':
      return { ...baseConfig, y: 130 };
    case 'down':
      return { ...baseConfig, y: -130 };
    case 'center':
    default:
      return { ...baseConfig, y: 90, scale: 0.9 };
  }
};

const getAnimateVariant = () => ({
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
});

const getExitVariant = (direction: RevealDirection) => {
  switch (direction) {
    case 'left':
      return { opacity: 0, x: -40 };
    case 'right':
      return { opacity: 0, x: 40 };
    case 'up':
      return { opacity: 0, y: -40 };
    case 'down':
      return { opacity: 0, y: 40 };
    case 'center':
    default:
      return { opacity: 0, y: 20, scale: 0.9 };
  }
};

export const ScrollReveal: React.FC<ScrollRevealProps> = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 800,
  className = '',
  staggerChildren = false,
  index = 0,
  baseDelay = 0,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    // Check for reduced motion preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
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
  }, []);

  if (prefersReducedMotion) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }

  const calculatedDelay = baseDelay + (staggerChildren ? index * 0.08 : delay / 1000);

  // Convert duration (ms) to spring stiffness: shorter duration = higher stiffness
  // 600ms → stiffness 130, 800ms → stiffness 110, 1000ms → stiffness 90
  const stiffness = Math.max(90, 1200 / (duration / 1000));
  // Maintain critical damping ratio (0.95-1.0 for text/buttons, 0.82-0.87 for images/cards)
  const damping = Math.sqrt(stiffness * 4) * 0.95;

  return (
    <motion.div
      ref={ref}
      initial={getInitialVariant(direction)}
      animate={isVisible ? getAnimateVariant() : getInitialVariant(direction)}
      exit={getExitVariant(direction)}
      transition={{
        type: 'spring',
        stiffness,
        damping,
        mass: 1,
        delay: calculatedDelay,
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Container component for staggered children
interface ScrollRevealContainerProps {
  children: React.ReactNode;
  className?: string;
  staggerDelay?: number;
}

export const ScrollRevealContainer: React.FC<ScrollRevealContainerProps> = ({
  children,
  className = '',
  staggerDelay = 0.08,
}) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0,
      },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      variants={containerVariants}
      className={className}
    >
      {children}
    </motion.div>
  );
};

export default ScrollReveal;
