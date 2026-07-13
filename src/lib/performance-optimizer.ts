/**
 * Performance Optimizer
 * Optimizes Core Web Vitals and Lighthouse scores
 */

export class PerformanceOptimizer {
  static init(): void {
    // Enable resource hints
    this.addResourceHints();
    
    // Optimize images
    this.optimizeImages();
    
    // Defer non-critical scripts
    this.deferScripts();
    
    // Optimize fonts
    this.optimizeFonts();
    
    // Monitor Core Web Vitals
    this.monitorWebVitals();
  }

  private static addResourceHints(): void {
    if (typeof document === 'undefined') return;

    const hints = [
      { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
      { rel: 'preconnect', href: 'https://fonts.gstatic.com' },
      { rel: 'preconnect', href: 'https://w.soundcloud.com' },
      { rel: 'dns-prefetch', href: 'https://cdn.jsdelivr.net' },
    ];

    hints.forEach(hint => {
      const link = document.createElement('link');
      link.rel = hint.rel;
      link.href = hint.href;
      if (hint.rel === 'preconnect') {
        link.crossOrigin = 'anonymous';
      }
      document.head.appendChild(link);
    });
  }

  private static optimizeImages(): void {
    if (typeof document === 'undefined') return;

    const images = document.querySelectorAll('img');
    images.forEach(img => {
      // Add loading="lazy" for below-the-fold images
      if (!img.hasAttribute('loading')) {
        img.setAttribute('loading', 'lazy');
      }

      // Add decoding="async" for non-critical images
      if (!img.hasAttribute('decoding')) {
        img.setAttribute('decoding', 'async');
      }
    });
  }

  private static deferScripts(): void {
    if (typeof document === 'undefined') return;

    const scripts = document.querySelectorAll('script[src]');
    scripts.forEach(script => {
      // Don't defer critical scripts
      if (!script.hasAttribute('data-critical')) {
        script.setAttribute('defer', '');
      }
    });
  }

  private static optimizeFonts(): void {
    if (typeof document === 'undefined') return;

    // Add font-display: swap for Google Fonts
    const fontLinks = document.querySelectorAll('link[href*="fonts.googleapis"]');
    fontLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href && !href.includes('display=swap')) {
        const newHref = href + (href.includes('?') ? '&' : '?') + 'display=swap';
        link.setAttribute('href', newHref);
      }
    });
  }

  private static monitorWebVitals(): void {
    if (typeof window === 'undefined' || !('web-vital' in window)) return;

    // Monitor FCP (First Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            console.log('FCP:', entry.startTime);
          }
        });
        observer.observe({ entryTypes: ['paint'] });
      } catch (e) {
        console.log('FCP monitoring not available');
      }
    }

    // Monitor LCP (Largest Contentful Paint)
    if ('PerformanceObserver' in window) {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        });
        observer.observe({ entryTypes: ['largest-contentful-paint'] });
      } catch (e) {
        console.log('LCP monitoring not available');
      }
    }

    // Monitor CLS (Cumulative Layout Shift)
    if ('PerformanceObserver' in window) {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value;
              console.log('CLS:', clsValue);
            }
          }
        });
        observer.observe({ entryTypes: ['layout-shift'] });
      } catch (e) {
        console.log('CLS monitoring not available');
      }
    }
  }

  static getMetrics(): {
    fcp: number | null;
    lcp: number | null;
    cls: number | null;
    ttfb: number | null;
  } {
    const metrics = {
      fcp: null,
      lcp: null,
      cls: null,
      ttfb: null,
    };

    if (typeof window === 'undefined' || !('performance' in window)) {
      return metrics;
    }

    try {
      // Get TTFB
      const navigationTiming = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationTiming) {
        metrics.ttfb = navigationTiming.responseStart - navigationTiming.fetchStart;
      }

      // Get FCP
      const paintEntries = performance.getEntriesByType('paint');
      const fcpEntry = paintEntries.find(entry => entry.name === 'first-contentful-paint');
      if (fcpEntry) {
        metrics.fcp = fcpEntry.startTime;
      }
    } catch (e) {
      console.log('Error getting performance metrics:', e);
    }

    return metrics;
  }

  static generateReport(): string {
    const metrics = this.getMetrics();
    return `
Performance Report:
- TTFB: ${metrics.ttfb?.toFixed(2) || 'N/A'} ms
- FCP: ${metrics.fcp?.toFixed(2) || 'N/A'} ms
- LCP: ${metrics.lcp?.toFixed(2) || 'N/A'} ms
- CLS: ${metrics.cls?.toFixed(3) || 'N/A'}

Recommendations:
- Ensure TTFB < 600ms
- Ensure FCP < 1.8s
- Ensure LCP < 2.5s
- Ensure CLS < 0.1
    `;
  }
}

// Initialize on page load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    PerformanceOptimizer.init();
  });
}
