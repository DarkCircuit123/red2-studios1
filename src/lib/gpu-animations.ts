/**
 * GPU-Accelerated Animations
 * Optimizes animations for 60fps performance using transform and opacity
 */

/**
 * Enable GPU acceleration on element
 */
export function enableGPUAcceleration(element: HTMLElement): void {
  element.style.willChange = 'transform, opacity';
  element.style.transform = 'translateZ(0)';
  element.style.backfaceVisibility = 'hidden';
  element.style.perspective = '1000px';
}

/**
 * Disable GPU acceleration (cleanup)
 */
export function disableGPUAcceleration(element: HTMLElement): void {
  element.style.willChange = 'auto';
  element.style.transform = 'none';
  element.style.backfaceVisibility = 'visible';
  element.style.perspective = 'none';
}

/**
 * Create GPU-optimized fade animation
 */
export function createFadeAnimation(
  element: HTMLElement,
  duration: number = 300,
  direction: 'in' | 'out' = 'in'
): Promise<void> {
  return new Promise((resolve) => {
    enableGPUAcceleration(element);

    const startOpacity = direction === 'in' ? 0 : 1;
    const endOpacity = direction === 'in' ? 1 : 0;

    element.style.opacity = startOpacity.toString();
    element.style.transition = `opacity ${duration}ms ease-in-out`;

    // Trigger reflow to ensure transition starts
    void element.offsetHeight;

    element.style.opacity = endOpacity.toString();

    setTimeout(() => {
      element.style.transition = 'none';
      disableGPUAcceleration(element);
      resolve();
    }, duration);
  });
}

/**
 * Create GPU-optimized slide animation
 */
export function createSlideAnimation(
  element: HTMLElement,
  direction: 'left' | 'right' | 'up' | 'down' = 'up',
  distance: number = 50,
  duration: number = 300
): Promise<void> {
  return new Promise((resolve) => {
    enableGPUAcceleration(element);

    const translateMap = {
      left: `translateX(${distance}px)`,
      right: `translateX(-${distance}px)`,
      up: `translateY(${distance}px)`,
      down: `translateY(-${distance}px)`,
    };

    element.style.transform = translateMap[direction];
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

    // Trigger reflow
    void element.offsetHeight;

    element.style.transform = 'translate(0, 0)';
    element.style.opacity = '1';

    setTimeout(() => {
      element.style.transition = 'none';
      disableGPUAcceleration(element);
      resolve();
    }, duration);
  });
}

/**
 * Create GPU-optimized scale animation
 */
export function createScaleAnimation(
  element: HTMLElement,
  startScale: number = 0.8,
  endScale: number = 1,
  duration: number = 300
): Promise<void> {
  return new Promise((resolve) => {
    enableGPUAcceleration(element);

    element.style.transform = `scale(${startScale})`;
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity ${duration}ms ease-out`;

    // Trigger reflow
    void element.offsetHeight;

    element.style.transform = `scale(${endScale})`;
    element.style.opacity = '1';

    setTimeout(() => {
      element.style.transition = 'none';
      disableGPUAcceleration(element);
      resolve();
    }, duration);
  });
}

/**
 * Create GPU-optimized rotate animation
 */
export function createRotateAnimation(
  element: HTMLElement,
  startRotation: number = -180,
  endRotation: number = 0,
  duration: number = 300
): Promise<void> {
  return new Promise((resolve) => {
    enableGPUAcceleration(element);

    element.style.transform = `rotate(${startRotation}deg)`;
    element.style.opacity = '0';
    element.style.transition = `transform ${duration}ms ease-out, opacity ${duration}ms ease-out`;

    // Trigger reflow
    void element.offsetHeight;

    element.style.transform = `rotate(${endRotation}deg)`;
    element.style.opacity = '1';

    setTimeout(() => {
      element.style.transition = 'none';
      disableGPUAcceleration(element);
      resolve();
    }, duration);
  });
}

/**
 * Create staggered animation for multiple elements
 */
export async function createStaggeredAnimation(
  elements: HTMLElement[],
  animationFn: (el: HTMLElement) => Promise<void>,
  staggerDelay: number = 100
): Promise<void> {
  for (let i = 0; i < elements.length; i++) {
    setTimeout(() => {
      animationFn(elements[i]);
    }, i * staggerDelay);
  }
}

/**
 * Create parallax scroll effect (GPU-optimized)
 */
export function setupParallaxScroll(
  element: HTMLElement,
  speed: number = 0.5
): void {
  enableGPUAcceleration(element);

  const handleScroll = () => {
    const scrollY = window.scrollY;
    const offset = scrollY * speed;
    element.style.transform = `translateY(${offset}px)`;
  };

  window.addEventListener('scroll', handleScroll, { passive: true });
}

/**
 * Create intersection observer animation trigger
 */
export function setupIntersectionAnimation(
  selector: string,
  animationFn: (el: HTMLElement) => Promise<void>,
  options?: IntersectionObserverInit
): IntersectionObserver {
  const elements = document.querySelectorAll(selector);

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        animationFn(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    });
  }, options || { threshold: 0.1 });

  elements.forEach((el) => observer.observe(el));

  return observer;
}

/**
 * Create smooth scroll behavior
 */
export function setupSmoothScroll(): void {
  if (typeof document === 'undefined') return;

  document.documentElement.style.scrollBehavior = 'smooth';
}

/**
 * Optimize animations for reduced motion preference
 */
export function respectReducedMotion(): void {
  if (typeof window === 'undefined') return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReducedMotion) {
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.classList.add('reduce-motion');
  }
}

/**
 * Create animation frame loop for continuous animations
 */
export function createAnimationLoop(
  callback: (progress: number) => void,
  duration: number = 1000,
  easing: (t: number) => number = (t) => t
): () => void {
  let startTime: number | null = null;
  let animationId: number;

  const animate = (currentTime: number) => {
    if (!startTime) startTime = currentTime;
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easedProgress = easing(progress);

    callback(easedProgress);

    if (progress < 1) {
      animationId = requestAnimationFrame(animate);
    }
  };

  animationId = requestAnimationFrame(animate);

  // Return cancel function
  return () => cancelAnimationFrame(animationId);
}

/**
 * Easing functions for animations
 */
export const easingFunctions = {
  linear: (t: number) => t,
  easeIn: (t: number) => t * t,
  easeOut: (t: number) => t * (2 - t),
  easeInOut: (t: number) => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
  easeInCubic: (t: number) => t * t * t,
  easeOutCubic: (t: number) => (--t) * t * t + 1,
  easeInQuart: (t: number) => t * t * t * t,
  easeOutQuart: (t: number) => 1 - (--t) * t * t * t,
  easeInQuint: (t: number) => t * t * t * t * t,
  easeOutQuint: (t: number) => 1 + (--t) * t * t * t * t,
};

/**
 * Initialize all GPU animation optimizations
 */
export function initializeGPUAnimations(): void {
  if (typeof window === 'undefined') return;

  setupSmoothScroll();
  respectReducedMotion();
}
