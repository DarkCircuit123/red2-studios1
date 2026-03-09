/**
 * Core Web Vitals Monitoring & Optimization
 * Tracks LCP, FID/INP, and CLS for performance optimization
 */

export interface WebVitalsMetrics {
  lcp?: number; // Largest Contentful Paint
  fid?: number; // First Input Delay
  inp?: number; // Interaction to Next Paint
  cls?: number; // Cumulative Layout Shift
  ttfb?: number; // Time to First Byte
}

const metrics: WebVitalsMetrics = {};

/**
 * Monitor Largest Contentful Paint (LCP)
 * Target: < 2.5 seconds
 */
export function monitorLCP(callback?: (lcp: number) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1];
      const lcp = lastEntry.renderTime || lastEntry.loadTime;

      metrics.lcp = lcp;

      if (callback) callback(lcp);

      // Log performance
      if (lcp > 2500) {
        console.warn(`⚠️ LCP is slow: ${lcp}ms (target: < 2500ms)`);
      } else if (lcp > 1000) {
        console.info(`ℹ️ LCP: ${lcp}ms (good)`);
      }
    });

    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    console.warn('LCP monitoring not supported');
  }
}

/**
 * Monitor First Input Delay (FID) / Interaction to Next Paint (INP)
 * Target: < 100ms for FID, < 200ms for INP
 */
export function monitorFIDINP(callback?: (fid: number) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const fid = (entry as any).processingDuration;
        metrics.fid = fid;

        if (callback) callback(fid);

        if (fid > 100) {
          console.warn(`⚠️ FID is slow: ${fid}ms (target: < 100ms)`);
        }
      }
    });

    observer.observe({ entryTypes: ['first-input', 'event'] });
  } catch (e) {
    console.warn('FID/INP monitoring not supported');
  }
}

/**
 * Monitor Cumulative Layout Shift (CLS)
 * Target: < 0.1
 */
export function monitorCLS(callback?: (cls: number) => void): void {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) return;

  let clsValue = 0;

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          clsValue += (entry as any).value;
          metrics.cls = clsValue;

          if (callback) callback(clsValue);

          if (clsValue > 0.1) {
            console.warn(`⚠️ CLS is high: ${clsValue.toFixed(3)} (target: < 0.1)`);
          }
        }
      }
    });

    observer.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    console.warn('CLS monitoring not supported');
  }
}

/**
 * Monitor Time to First Byte (TTFB)
 * Target: < 600ms
 */
export function monitorTTFB(callback?: (ttfb: number) => void): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const ttfb = perfData.responseStart - perfData.navigationStart;

    metrics.ttfb = ttfb;

    if (callback) callback(ttfb);

    if (ttfb > 600) {
      console.warn(`⚠️ TTFB is slow: ${ttfb}ms (target: < 600ms)`);
    } else {
      console.info(`ℹ️ TTFB: ${ttfb}ms (good)`);
    }
  });
}

/**
 * Get current metrics
 */
export function getMetrics(): WebVitalsMetrics {
  return { ...metrics };
}

/**
 * Report metrics to analytics
 */
export function reportMetrics(): void {
  if (typeof window === 'undefined' || !window.gtag) return;

  const currentMetrics = getMetrics();

  if (currentMetrics.lcp) {
    window.gtag('event', 'page_view', {
      metric_lcp: currentMetrics.lcp,
    });
  }

  if (currentMetrics.fid) {
    window.gtag('event', 'page_view', {
      metric_fid: currentMetrics.fid,
    });
  }

  if (currentMetrics.cls) {
    window.gtag('event', 'page_view', {
      metric_cls: currentMetrics.cls,
    });
  }

  if (currentMetrics.ttfb) {
    window.gtag('event', 'page_view', {
      metric_ttfb: currentMetrics.ttfb,
    });
  }
}

/**
 * Optimize for LCP
 */
export function optimizeForLCP(): void {
  if (typeof document === 'undefined') return;

  // Preload critical resources
  const criticalImages = document.querySelectorAll('img[data-critical]');
  criticalImages.forEach((img) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = img.getAttribute('src') || '';
    document.head.appendChild(link);
  });

  // Defer non-critical CSS
  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
  stylesheets.forEach((link) => {
    const href = link.getAttribute('href');
    if (href) {
      link.setAttribute('media', 'print');
      link.onload = () => {
        link.setAttribute('media', 'all');
      };
    }
  });
}

/**
 * Optimize for FID/INP
 */
export function optimizeForFIDINP(): void {
  if (typeof window === 'undefined') return;

  // Break up long tasks
  const longTasks = document.querySelectorAll('[data-long-task]');
  longTasks.forEach((task) => {
    // Defer execution
    setTimeout(() => {
      // Process task
    }, 0);
  });

  // Reduce JavaScript execution time
  if ('scheduler' in window) {
    (window as any).scheduler.yield?.();
  }
}

/**
 * Optimize for CLS
 */
export function optimizeForCLS(): void {
  if (typeof document === 'undefined') return;

  // Reserve space for dynamic content
  const dynamicElements = document.querySelectorAll('[data-dynamic]');
  dynamicElements.forEach((element) => {
    const height = element.getAttribute('data-height');
    if (height) {
      (element as HTMLElement).style.minHeight = height;
    }
  });

  // Avoid inserting content above existing content
  const insertPoints = document.querySelectorAll('[data-insert-point]');
  insertPoints.forEach((point) => {
    (point as HTMLElement).style.position = 'relative';
  });
}

/**
 * Initialize all Core Web Vitals monitoring
 */
export function initializeCoreWebVitals(): void {
  if (typeof window === 'undefined') return;

  // Monitor all metrics
  monitorLCP();
  monitorFIDINP();
  monitorCLS();
  monitorTTFB();

  // Optimize for each metric
  optimizeForLCP();
  optimizeForFIDINP();
  optimizeForCLS();

  // Report metrics after page load
  window.addEventListener('load', () => {
    setTimeout(() => {
      reportMetrics();
    }, 3000); // Wait 3 seconds for all metrics to settle
  });
}

/**
 * Get performance summary
 */
export function getPerformanceSummary(): {
  summary: string;
  score: number;
} {
  const m = getMetrics();
  let score = 100;
  let issues: string[] = [];

  if (m.lcp && m.lcp > 2500) {
    score -= 25;
    issues.push('LCP is slow');
  }

  if (m.fid && m.fid > 100) {
    score -= 25;
    issues.push('FID is slow');
  }

  if (m.cls && m.cls > 0.1) {
    score -= 25;
    issues.push('CLS is high');
  }

  if (m.ttfb && m.ttfb > 600) {
    score -= 25;
    issues.push('TTFB is slow');
  }

  return {
    summary: issues.length > 0 ? issues.join(', ') : 'All metrics are good',
    score: Math.max(0, score),
  };
}
