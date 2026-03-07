/**
 * Performance monitoring and analytics
 * Tracks Core Web Vitals and application performance metrics
 */

export interface PerformanceMetrics {
  fcp?: number; // First Contentful Paint
  lcp?: number; // Largest Contentful Paint
  cls?: number; // Cumulative Layout Shift
  fid?: number; // First Input Delay
  ttfb?: number; // Time to First Byte
  domContentLoaded?: number;
  loadComplete?: number;
  memoryUsage?: number;
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics = {};
  private observers: Set<(metrics: PerformanceMetrics) => void> = new Set();

  constructor() {
    this.initializeMetrics();
  }

  private initializeMetrics(): void {
    // Measure navigation timing
    if (typeof window !== 'undefined' && window.performance) {
      const perfData = window.performance.timing;
      const perfDataNav = window.performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

      if (perfData) {
        this.metrics.ttfb = perfData.responseStart - perfData.fetchStart;
        this.metrics.domContentLoaded = perfData.domContentLoadedEventEnd - perfData.fetchStart;
        this.metrics.loadComplete = perfData.loadEventEnd - perfData.fetchStart;
      }

      if (perfDataNav) {
        this.metrics.ttfb = perfDataNav.responseStart - perfDataNav.fetchStart;
      }
    }

    // Observe Web Vitals
    this.observeWebVitals();

    // Monitor memory usage
    this.monitorMemory();
  }

  private observeWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Observe Largest Contentful Paint
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          this.metrics.lcp = lastEntry.renderTime || lastEntry.loadTime;
          this.notifyObservers();
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Observe Cumulative Layout Shift
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              this.metrics.cls = clsValue;
              this.notifyObservers();
            }
          }
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.warn('CLS observer not supported');
      }

      // Observe First Input Delay
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const firstInput = entries[0];
          this.metrics.fid = (firstInput as any).processingDuration;
          this.notifyObservers();
        });
        fidObserver.observe({ entryTypes: ['first-input'] });
      } catch (e) {
        console.warn('FID observer not supported');
      }

      // Observe First Contentful Paint
      try {
        const fcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const fcp = entries.find((entry) => entry.name === 'first-contentful-paint');
          if (fcp) {
            this.metrics.fcp = fcp.startTime;
            this.notifyObservers();
          }
        });
        fcpObserver.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.warn('FCP observer not supported');
      }
    }
  }

  private monitorMemory(): void {
    if (typeof window !== 'undefined' && (performance as any).memory) {
      setInterval(() => {
        const memory = (performance as any).memory;
        this.metrics.memoryUsage = Math.round(memory.usedJSHeapSize / 1048576); // Convert to MB
        this.notifyObservers();
      }, 5000);
    }
  }

  subscribe(callback: (metrics: PerformanceMetrics) => void): () => void {
    this.observers.add(callback);
    return () => this.observers.delete(callback);
  }

  private notifyObservers(): void {
    this.observers.forEach((callback) => callback(this.metrics));
  }

  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  logMetrics(): void {
    if (process.env.NODE_ENV === 'development') {
      console.table(this.metrics);
    }
  }

  isGoodPerformance(): boolean {
    return (
      (this.metrics.fcp ?? 0) < 1800 &&
      (this.metrics.lcp ?? 0) < 2500 &&
      (this.metrics.cls ?? 0) < 0.1 &&
      (this.metrics.fid ?? 0) < 100
    );
  }
}

/**
 * Error tracking and reporting
 */
export class ErrorTracker {
  private errors: Array<{
    message: string;
    stack?: string;
    timestamp: number;
    severity: 'error' | 'warning' | 'info';
  }> = [];

  private maxErrors = 50;

  captureError(error: Error | string, severity: 'error' | 'warning' | 'info' = 'error'): void {
    const errorEntry = {
      message: typeof error === 'string' ? error : error.message,
      stack: typeof error === 'string' ? undefined : error.stack,
      timestamp: Date.now(),
      severity,
    };

    this.errors.push(errorEntry);

    // Keep only recent errors
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    if (process.env.NODE_ENV === 'development') {
      console.error(`[${severity.toUpperCase()}]`, errorEntry);
    }
  }

  getErrors(): typeof this.errors {
    return [...this.errors];
  }

  clear(): void {
    this.errors = [];
  }

  report(): string {
    return JSON.stringify(this.errors, null, 2);
  }
}

// Global instances
export const performanceMonitor = new PerformanceMonitor();
export const errorTracker = new ErrorTracker();

// Setup global error handlers
if (typeof window !== 'undefined') {
  window.addEventListener('error', (event) => {
    errorTracker.captureError(event.error || event.message, 'error');
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorTracker.captureError(event.reason, 'error');
  });
}
