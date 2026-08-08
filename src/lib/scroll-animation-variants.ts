/**
 * Reusable animation variants for scroll-triggered animations
 * Designed for luxury editorial aesthetic with smooth, intentional motion
 */

// Re-export from editorial-motion-system for backward compatibility
export { 
  editorialMotionVariants,
  getEditorialVariant,
  getStaggeredVariant,
} from './editorial-motion-system';

export const scrollAnimationVariants = {
  // Text elements: slide up with fade
  textSlideUp: {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94], // smooth easing
      },
    },
  },

  // Heading: larger slide with subtle snap
  headingSlideUp: {
    hidden: { opacity: 0, y: 60 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.9,
        ease: [0.23, 1, 0.32, 1], // cubic-bezier for settling effect
      },
    },
  },

  // Images: slide from left with scale
  imageSlideInLeft: {
    hidden: { opacity: 0, x: -60, scale: 0.98 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.9,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  // Images: slide from right with scale
  imageSlideInRight: {
    hidden: { opacity: 0, x: 60, scale: 0.98 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        duration: 0.9,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  // Cards/Gallery items: staggered appearance
  cardSlideUp: {
    hidden: { opacity: 0, y: 50, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  // Buttons: subtle upward snap
  buttonSlideUp: {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        ease: [0.23, 1, 0.32, 1], // settling effect
      },
    },
  },

  // Container for staggered children
  containerStagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.1,
      },
    },
  },

  // Fade only (for subtle elements)
  fadeIn: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.8,
        ease: 'easeOut',
      },
    },
  },

  // Horizontal slide for accent elements
  slideInHorizontal: {
    hidden: { opacity: 0, x: -40 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },

  // Scale + fade for emphasis
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.7,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  },
};

/**
 * Get staggered animation for multiple children
 * @param index - Index of the child element
 * @param baseDelay - Base delay in seconds
 * @param staggerDelay - Delay between each child in seconds
 */
export function getStaggeredVariant(
  index: number,
  baseDelay = 0.1,
  staggerDelay = 0.12
) {
  return {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.7,
        delay: baseDelay + index * staggerDelay,
        ease: [0.25, 0.46, 0.45, 0.94],
      },
    },
  };
}
