/**
 * Premium Editorial Motion System for RED2 Studios
 * 
 * Implements a cinematic, luxury fashion editorial aesthetic with:
 * - Controlled, sophisticated motion hierarchy
 * - Image → Heading → Details sequencing
 * - Subtle, intentional movement (24-60px)
 * - Smooth, elegant easing
 * - Performance-optimized animations
 * - Reduced-motion accessibility support
 */

import { respectReducedMotion } from './performance-enhancements';

/**
 * Editorial motion easing curves
 * Designed for luxury, controlled, sophisticated feel
 */
export const editorialEasing = {
  // Smooth settle effect - images arrive first
  imageSettle: [0.25, 0.46, 0.45, 0.94],
  
  // Typography follows with elegant ease
  typographySettle: [0.23, 1, 0.32, 1],
  
  // Details settle last with subtle deceleration
  detailsSettle: [0.25, 0.46, 0.45, 0.94],
  
  // Smooth exit for page transitions
  pageExit: [0.25, 0.46, 0.45, 0.94],
};

/**
 * Editorial motion timing (in milliseconds)
 * Calibrated for luxury editorial feel
 */
export const editorialTiming = {
  // Image animations: 650-850ms
  imageEnter: 750,
  imageExit: 400,
  
  // Heading animations: 400-600ms, delayed after image
  headingDelay: 150,
  headingDuration: 500,
  
  // Details animations: 300-450ms, delayed after heading
  detailsDelay: 300,
  detailsDuration: 400,
  
  // Page transitions: fast, non-intrusive
  pageTransition: 300,
  
  // Hover effects: subtle, quick
  hoverDuration: 200,
};

/**
 * Editorial motion distances (in pixels)
 * Minimum necessary for premium feel
 */
export const editorialDistance = {
  // Image movement: 24-60px
  imageOffset: {
    small: 24,
    medium: 40,
    large: 60,
  },
  
  // Heading movement: 20-32px
  headingOffset: {
    small: 20,
    medium: 26,
    large: 32,
  },
  
  // Details movement: 12-20px
  detailsOffset: {
    small: 12,
    medium: 16,
    large: 20,
  },
  
  // Scale adjustments: subtle
  imageScale: {
    initial: 1.06,
    final: 1,
  },
};

/**
 * Editorial opacity ranges
 * Subtle fade-in for premium feel
 */
export const editorialOpacity = {
  imageInitial: 0.1,
  imageHidden: 0,
  imageFinal: 1,
  
  typographyInitial: 0,
  typographyFinal: 1,
  
  detailsInitial: 0,
  detailsFinal: 1,
};

/**
 * Check if animations should be reduced
 */
export const shouldReduceMotion = (): boolean => {
  return respectReducedMotion();
};

/**
 * Get animation configuration based on reduced-motion preference
 */
export const getEditorialAnimationConfig = (
  type: 'image' | 'heading' | 'details' | 'page'
) => {
  const prefersReduced = shouldReduceMotion();
  
  if (prefersReduced) {
    // Minimal animation for reduced-motion
    return {
      duration: 0,
      delay: 0,
      opacity: { initial: 0, final: 1 },
      transform: { initial: 0, final: 0 },
    };
  }
  
  switch (type) {
    case 'image':
      return {
        duration: editorialTiming.imageEnter,
        delay: 0,
        opacity: { initial: editorialOpacity.imageInitial, final: editorialOpacity.imageFinal },
        transform: editorialDistance.imageOffset.medium,
        scale: editorialDistance.imageScale,
        easing: editorialEasing.imageSettle,
      };
      
    case 'heading':
      return {
        duration: editorialTiming.headingDuration,
        delay: editorialTiming.headingDelay,
        opacity: { initial: editorialOpacity.typographyInitial, final: editorialOpacity.typographyFinal },
        transform: editorialDistance.headingOffset.medium,
        easing: editorialEasing.typographySettle,
      };
      
    case 'details':
      return {
        duration: editorialTiming.detailsDuration,
        delay: editorialTiming.detailsDelay + editorialTiming.headingDuration,
        opacity: { initial: editorialOpacity.detailsInitial, final: editorialOpacity.detailsFinal },
        transform: editorialDistance.detailsOffset.medium,
        easing: editorialEasing.detailsSettle,
      };
      
    case 'page':
      return {
        duration: editorialTiming.pageTransition,
        delay: 0,
        opacity: { initial: 0, final: 1 },
        transform: 0,
        easing: editorialEasing.pageExit,
      };
      
    default:
      return {
        duration: 0,
        delay: 0,
        opacity: { initial: 0, final: 1 },
        transform: 0,
      };
  }
};

/**
 * Framer Motion variants for editorial animations
 */
export const editorialMotionVariants = {
  // Image animation: arrives first with subtle scale and opacity
  image: {
    hidden: {
      opacity: editorialOpacity.imageHidden,
      scale: editorialDistance.imageScale.initial,
      y: editorialDistance.imageOffset.medium,
    },
    visible: {
      opacity: editorialOpacity.imageFinal,
      scale: editorialDistance.imageScale.final,
      y: 0,
      transition: {
        duration: editorialTiming.imageEnter / 1000,
        ease: editorialEasing.imageSettle,
      },
    },
  },
  
  // Heading animation: follows image with elegant ease
  heading: {
    hidden: {
      opacity: editorialOpacity.typographyInitial,
      y: editorialDistance.headingOffset.medium,
    },
    visible: {
      opacity: editorialOpacity.typographyFinal,
      y: 0,
      transition: {
        duration: editorialTiming.headingDuration / 1000,
        delay: editorialTiming.headingDelay / 1000,
        ease: editorialEasing.typographySettle,
      },
    },
  },
  
  // Details animation: settles last with subtle movement
  details: {
    hidden: {
      opacity: editorialOpacity.detailsInitial,
      y: editorialDistance.detailsOffset.medium,
    },
    visible: {
      opacity: editorialOpacity.detailsFinal,
      y: 0,
      transition: {
        duration: editorialTiming.detailsDuration / 1000,
        delay: (editorialTiming.detailsDelay + editorialTiming.headingDuration) / 1000,
        ease: editorialEasing.detailsSettle,
      },
    },
  },
  
  // Container for staggered children
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.05,
      },
    },
  },
  
  // Page transition: subtle fade
  pageTransition: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: {
      duration: editorialTiming.pageTransition / 1000,
      ease: editorialEasing.pageExit,
    },
  },
  
  // Hover effect: subtle lift
  hoverLift: {
    rest: { y: 0 },
    hover: { y: -4 },
    transition: {
      duration: editorialTiming.hoverDuration / 1000,
      ease: 'easeOut',
    },
  },
};

/**
 * Viewport trigger configuration for IntersectionObserver
 */
export const editorialViewportConfig = {
  threshold: 0.1,
  rootMargin: '-50px 0px -50px 0px',
  triggerOnce: true,
};

/**
 * Mobile-optimized motion (25% reduction)
 */
export const getMobileEditorialConfig = (config: any) => {
  return {
    ...config,
    duration: Math.ceil(config.duration * 0.75),
    imageOffset: Math.ceil(config.imageOffset * 0.75),
    headingOffset: Math.ceil(config.headingOffset * 0.75),
    detailsOffset: Math.ceil(config.detailsOffset * 0.75),
  };
};
