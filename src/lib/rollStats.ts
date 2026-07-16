/**
 * rollStats - Slot Machine Rolling Effect for Stats
 * Animates counter values with a slot machine rolling effect
 */

export interface RollStatsConfig {
  duration?: number; // Total animation duration in ms
  steps?: number; // Number of intermediate values to show
  easing?: (t: number) => number; // Easing function
}

export const defaultConfig: RollStatsConfig = {
  duration: 600,
  steps: 10,
  easing: (t: number) => t, // Linear by default
};

/**
 * Easing functions for smooth animations
 */
export const easings = {
  linear: (t: number) => t,
  easeOut: (t: number) => 1 - Math.pow(1 - t, 3),
  easeIn: (t: number) => t * t * t,
  easeInOut: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
  cubic: (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
};

/**
 * Generate intermediate values for rolling animation
 */
export const generateRollSequence = (
  startValue: number,
  endValue: number,
  config: RollStatsConfig = {}
): number[] => {
  const { steps = 10, easing = easings.easeOut } = { ...defaultConfig, ...config };
  
  const sequence: number[] = [];
  const difference = endValue - startValue;

  for (let i = 0; i <= steps; i++) {
    const progress = i / steps;
    const easedProgress = easing(progress);
    const value = Math.round(startValue + difference * easedProgress);
    sequence.push(value);
  }

  return sequence;
};

/**
 * Create a rolling animation callback
 */
export const createRollAnimation = (
  startValue: number,
  endValue: number,
  onFrame: (value: number) => void,
  config: RollStatsConfig = {}
): (() => void) => {
  const { duration = 600, steps = 10, easing = easings.easeOut } = { ...defaultConfig, ...config };
  
  const sequence = generateRollSequence(startValue, endValue, { steps, easing });
  const frameInterval = duration / steps;
  let currentStep = 0;
  let animationId: NodeJS.Timeout | null = null;

  const animate = () => {
    if (currentStep < sequence.length) {
      onFrame(sequence[currentStep]);
      currentStep++;
      animationId = setTimeout(animate, frameInterval);
    }
  };

  // Start animation
  animate();

  // Return cleanup function
  return () => {
    if (animationId) {
      clearTimeout(animationId);
    }
  };
};

/**
 * Format number with commas for display
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('en-US');
};

/**
 * Slot machine style rolling effect for multiple stats
 */
export interface StatRoll {
  label: string;
  startValue: number;
  endValue: number;
  formatter?: (value: number) => string;
}

export const createMultiStatRoll = (
  stats: StatRoll[],
  onUpdate: (results: Record<string, string>) => void,
  config: RollStatsConfig = {}
): (() => void) => {
  const cleanupFunctions: Array<() => void> = [];
  const results: Record<string, string> = {};

  stats.forEach((stat) => {
    const formatter = stat.formatter || formatNumber;
    const cleanup = createRollAnimation(
      stat.startValue,
      stat.endValue,
      (value) => {
        results[stat.label] = formatter(value);
        onUpdate(results);
      },
      config
    );
    cleanupFunctions.push(cleanup);
  });

  // Return cleanup function that stops all animations
  return () => {
    cleanupFunctions.forEach((cleanup) => cleanup());
  };
};

/**
 * React Hook for rolling stats animation
 */
export const useRollStats = (
  startValue: number,
  endValue: number,
  config: RollStatsConfig = {}
) => {
  const [displayValue, setDisplayValue] = React.useState(startValue);
  const cleanupRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    // Cleanup previous animation
    if (cleanupRef.current) {
      cleanupRef.current();
    }

    // Start new animation
    cleanupRef.current = createRollAnimation(
      startValue,
      endValue,
      setDisplayValue,
      config
    );

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, [startValue, endValue, config]);

  return displayValue;
};

// Import React for the hook (this will be imported where needed)
import React from 'react';
