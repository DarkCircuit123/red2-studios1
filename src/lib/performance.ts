/**
 * Performance optimization utilities
 * Implements modern web performance best practices
 */

// Debounce utility with proper typing
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  immediate = false
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      if (!immediate) func(...args);
    };

    const callNow = immediate && !timeout;
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func(...args);
  };
}

// Throttle utility with proper typing
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// Intersection Observer utility for lazy loading
export function createIntersectionObserver(
  callback: (isVisible: boolean) => void,
  options: IntersectionObserverInit = {}
): IntersectionObserver {
  const defaultOptions: IntersectionObserverInit = {
    threshold: 0.1,
    rootMargin: '50px',
    ...options,
  };

  return new IntersectionObserver(([entry]) => {
    callback(entry.isIntersecting);
  }, defaultOptions);
}

// Request Animation Frame utility
export function requestAnimationFrameThrottle(callback: FrameRequestCallback): () => void {
  let rafId: number | null = null;
  let isScheduled = false;

  const throttledCallback = () => {
    if (!isScheduled) {
      isScheduled = true;
      rafId = requestAnimationFrame(() => {
        callback(performance.now());
        isScheduled = false;
      });
    }
  };

  return () => {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  };
}

// Performance monitoring
export class PerformanceMonitor {
  private marks: Map<string, number> = new Map();

  mark(name: string): void {
    this.marks.set(name, performance.now());
  }

  measure(name: string, startMark: string): number {
    const startTime = this.marks.get(startMark);
    if (!startTime) {
      console.warn(`Start mark "${startMark}" not found`);
      return 0;
    }
    const duration = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${name}: ${duration.toFixed(2)}ms`);
    }
    return duration;
  }

  clear(): void {
    this.marks.clear();
  }
}

// Memory-efficient event listener management
export class EventListenerManager {
  private listeners: Array<{
    element: EventTarget;
    event: string;
    handler: EventListener;
  }> = [];

  addEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | AddEventListenerOptions
  ): void {
    element.addEventListener(event, handler, options);
    this.listeners.push({ element, event, handler });
  }

  removeEventListener(
    element: EventTarget,
    event: string,
    handler: EventListener,
    options?: boolean | EventListenerOptions
  ): void {
    element.removeEventListener(event, handler, options);
    this.listeners = this.listeners.filter(
      (l) => !(l.element === element && l.event === event && l.handler === handler)
    );
  }

  removeAll(): void {
    this.listeners.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this.listeners = [];
  }
}

// Batch DOM updates for better performance
export function batchDOMUpdates(updates: () => void): void {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(updates, { timeout: 2000 });
  } else {
    setTimeout(updates, 0);
  }
}
