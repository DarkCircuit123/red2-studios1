/**
 * Performance Enhancements for 5-Star Performance Rating
 * Implements critical optimizations for Core Web Vitals
 */

// 1. Image Lazy Loading with Intersection Observer
export const setupImageLazyLoading = () => {
  if (typeof window === 'undefined') return;

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
          observer.unobserve(img);
        }
      }
    });
  }, {
    rootMargin: '50px',
  });

  document.querySelectorAll('img[data-src]').forEach((img) => {
    imageObserver.observe(img);
  });
};

// 2. Debounce function for scroll/resize events
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

// 3. Request Animation Frame throttle for smooth animations
export const rafThrottle = <T extends (...args: any[]) => any>(
  func: T
): ((...args: Parameters<T>) => void) => {
  let rafId: number | null = null;
  return function throttledFunction(...args: Parameters<T>) {
    if (rafId !== null) return;
    rafId = requestAnimationFrame(() => {
      func(...args);
      rafId = null;
    });
  };
};

// 4. Preload critical resources
export const preloadCriticalResources = () => {
  if (typeof document === 'undefined') return;

  // Preload fonts
  const fonts = [
    '/fonts/montserrat/v31/JTUQjIg1_i6t8kCHKm459WxRxC7m0dR9pBOi.woff2',
    '/fonts/inter/v20/UcCm3FwrK3iLTcvnUwAT9mI1F55MKw.woff2',
  ];

  fonts.forEach((font) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'font';
    link.href = font;
    link.type = 'font/woff2';
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};

// 5. Memory-efficient event listener management
export const createOptimizedEventListener = (
  target: EventTarget,
  event: string,
  handler: EventListener,
  options?: AddEventListenerOptions
) => {
  target.addEventListener(event, handler, { passive: true, ...options });

  return () => {
    target.removeEventListener(event, handler);
  };
};

// 6. Batch DOM updates to minimize reflows
export const batchDOMUpdates = (updates: (() => void)[]) => {
  requestAnimationFrame(() => {
    updates.forEach((update) => update());
  });
};

// 7. CSS containment for performance
export const applyCSSContainment = (element: HTMLElement) => {
  element.style.contain = 'layout style paint';
};

// 8. Optimize animations with will-change
export const optimizeAnimationPerformance = (element: HTMLElement) => {
  element.style.willChange = 'transform, opacity';
  
  // Remove will-change after animation completes
  const removeWillChange = () => {
    element.style.willChange = 'auto';
  };

  // Use passive listeners since preventDefault is not needed
  element.addEventListener('animationend', removeWillChange, { once: true, passive: true });
  element.addEventListener('transitionend', removeWillChange, { once: true, passive: true });
};

// 9. Reduce motion for users who prefer it
export const respectReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// 10. Optimize bundle loading
export const prefetchRoute = (route: string) => {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = route;
  document.head.appendChild(link);
};

// 11. Service Worker registration for offline support
export const registerServiceWorker = async () => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  try {
    await navigator.serviceWorker.register('/sw.js');
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
};

// 12. Optimize font loading
export const optimizeFontLoading = () => {
  if (typeof document === 'undefined') return;

  // Use font-display: swap for better performance
  const style = document.createElement('style');
  style.textContent = `
    @font-face {
      font-display: swap;
    }
  `;
  document.head.appendChild(style);
};

// 13. Implement virtual scrolling for large lists
export const createVirtualScroller = (
  container: HTMLElement,
  items: any[],
  itemHeight: number,
  renderItem: (item: any, index: number) => HTMLElement
) => {
  let scrollTop = 0;

  const updateVisibleItems = () => {
    const visibleStart = Math.floor(scrollTop / itemHeight);
    const visibleEnd = visibleStart + Math.ceil(container.clientHeight / itemHeight);

    container.innerHTML = '';
    for (let i = visibleStart; i < Math.min(visibleEnd, items.length); i++) {
      const element = renderItem(items[i], i);
      element.style.transform = `translateY(${i * itemHeight}px)`;
      container.appendChild(element);
    }
  };

  container.addEventListener('scroll', () => {
    scrollTop = container.scrollTop;
    updateVisibleItems();
  });

  updateVisibleItems();
};

// 14. Optimize CSS-in-JS performance
export const injectOptimizedStyles = (styles: Record<string, string>) => {
  if (typeof document === 'undefined') return;

  const styleSheet = document.createElement('style');
  let cssText = '';

  Object.entries(styles).forEach(([selector, rules]) => {
    cssText += `${selector} { ${rules} }`;
  });

  styleSheet.textContent = cssText;
  document.head.appendChild(styleSheet);
};

// 15. Monitor Core Web Vitals
export const monitorCoreWebVitals = (callback: (metric: any) => void) => {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  const lcpObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    const lastEntry = entries[entries.length - 1];
    callback({
      name: 'LCP',
      value: lastEntry.renderTime || lastEntry.loadTime,
      rating: lastEntry.renderTime || lastEntry.loadTime < 2500 ? 'good' : 'poor',
    });
  });

  try {
    lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }

  // First Input Delay (FID) / Interaction to Next Paint (INP)
  const fidObserver = new PerformanceObserver((list) => {
    const entries = list.getEntries();
    entries.forEach((entry) => {
      callback({
        name: 'FID',
        value: entry.processingDuration,
        rating: entry.processingDuration < 100 ? 'good' : 'poor',
      });
    });
  });

  try {
    fidObserver.observe({ entryTypes: ['first-input'] });
  } catch (e) {
    // FID not supported
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        callback({
          name: 'CLS',
          value: clsValue,
          rating: clsValue < 0.1 ? 'good' : 'poor',
        });
      }
    });
  });

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // CLS not supported
  }
};

// 16. Optimize JavaScript execution
export const deferNonCriticalJS = (callback: () => void) => {
  if (typeof window === 'undefined') return;

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(callback);
  } else {
    setTimeout(callback, 0);
  }
};

// 17. Implement smart caching strategy
export const createCacheStrategy = () => {
  const cache = new Map<string, { data: any; timestamp: number }>();
  const TTL = 5 * 60 * 1000; // 5 minutes

  return {
    get: (key: string) => {
      const item = cache.get(key);
      if (!item) return null;

      if (Date.now() - item.timestamp > TTL) {
        cache.delete(key);
        return null;
      }

      return item.data;
    },
    set: (key: string, data: any) => {
      cache.set(key, { data, timestamp: Date.now() });
    },
    clear: () => cache.clear(),
  };
};

export default {
  setupImageLazyLoading,
  debounce,
  rafThrottle,
  preloadCriticalResources,
  createOptimizedEventListener,
  batchDOMUpdates,
  applyCSSContainment,
  optimizeAnimationPerformance,
  respectReducedMotion,
  prefetchRoute,
  registerServiceWorker,
  optimizeFontLoading,
  createVirtualScroller,
  injectOptimizedStyles,
  monitorCoreWebVitals,
  deferNonCriticalJS,
  createCacheStrategy,
};
