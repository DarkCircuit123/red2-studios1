/**
 * Reusable animation variants for scroll-triggered animations
 * Designed for luxury editorial aesthetic with spring-snap physics
 * Damping ratios maintained between 0.82-1.0 for tactile settle without bounce
 */

export const scrollAnimationVariants = {
  // Text elements: slide up with fade (70px travel, critically damped)
  textSlideUp: {
    hidden: { opacity: 0, y: 70 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 19,
        mass: 1,
      },
    },
  },

  // Heading: larger slide with snap (120px travel, critically damped)
  headingSlideUp: {
    hidden: { opacity: 0, y: 120 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 80,
        damping: 15,
        mass: 1,
      },
    },
  },

  // Images: slide from left with scale (160px travel, slightly underdamped for tactile feel)
  imageSlideInLeft: {
    hidden: { opacity: 0, x: -160, scale: 0.98 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 16,
        mass: 1,
      },
    },
  },

  // Images: slide from right with scale (160px travel, slightly underdamped for tactile feel)
  imageSlideInRight: {
    hidden: { opacity: 0, x: 160, scale: 0.98 },
    visible: {
      opacity: 1,
      x: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 90,
        damping: 16,
        mass: 1,
      },
    },
  },

  // Cards/Gallery items: staggered appearance (90px travel, slightly underdamped)
  cardSlideUp: {
    hidden: { opacity: 0, y: 90, scale: 0.95 },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 18,
        mass: 1,
      },
    },
  },

  // Buttons: subtle upward snap (40px travel, critically damped)
  buttonSlideUp: {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 120,
        damping: 22,
        mass: 1,
      },
    },
  },

  // Container for staggered children (tighter stagger for cascade effect)
  containerStagger: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.09,
        delayChildren: 0.05,
      },
    },
  },

  // Fade only (for subtle elements, no position change)
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

  // Horizontal slide for accent elements (70px travel, critically damped)
  slideInHorizontal: {
    hidden: { opacity: 0, x: -70 },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 19,
        mass: 1,
      },
    },
  },

  // Scale + fade for emphasis (90px travel, slightly underdamped)
  scaleIn: {
    hidden: { opacity: 0, scale: 0.95, y: 90 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 18,
        mass: 1,
      },
    },
  },
};

/**
 * Get staggered animation for multiple children with spring physics
 * @param index - Index of the child element
 * @param baseDelay - Base delay in seconds (default 0.08)
 * @param staggerDelay - Delay between each child in seconds (default 0.09)
 */
export function getStaggeredVariant(
  index: number,
  baseDelay = 0.08,
  staggerDelay = 0.09
) {
  return {
    hidden: { opacity: 0, y: 70 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        type: 'spring',
        stiffness: 100,
        damping: 19,
        mass: 1,
        delay: baseDelay + index * staggerDelay,
      },
    },
  };
}
