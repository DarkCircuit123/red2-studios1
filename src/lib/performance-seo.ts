/**
 * Performance & SEO Optimization
 * Implements Core Web Vitals and performance best practices
 */

import { initializeCoreWebVitals } from '@/lib/core-web-vitals';

/**
 * Report Web Vitals to analytics
 */
export function reportWebVitals() {
  if (typeof window === 'undefined') return;

  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('LCP:', entry);
    }
  });

  try {
    observer.observe({ entryTypes: ['largest-contentful-paint'] });
  } catch (e) {
    // LCP not supported
  }

  // Cumulative Layout Shift (CLS)
  let clsValue = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsValue += (entry as any).value;
        console.log('CLS:', clsValue);
      }
    }
  });

  try {
    clsObserver.observe({ entryTypes: ['layout-shift'] });
  } catch (e) {
    // CLS not supported
  }

  // First Input Delay (FID) / Interaction to Next Paint (INP)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log('FID/INP:', entry);
    }
  });

  try {
    fidObserver.observe({ entryTypes: ['first-input', 'event'] });
  } catch (e) {
    // FID/INP not supported
  }
}

/**
 * Optimize image loading with lazy loading
 */
export function optimizeImageLoading() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const images = document.querySelectorAll('img[data-src]');

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        img.src = img.dataset.src || '';
        img.removeAttribute('data-src');
        observer.unobserve(img);
      }
    });
  });

  images.forEach((img) => imageObserver.observe(img));
}

/**
 * Prefetch DNS for external resources
 */
export function prefetchDNS(domains: string[]) {
  if (typeof document === 'undefined') return;

  domains.forEach((domain) => {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = `//${domain}`;
    document.head.appendChild(link);
  });
}

/**
 * Preconnect to critical resources
 */
export function preconnectResources(urls: string[]) {
  if (typeof document === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
}

/**
 * Prefetch important pages
 */
export function prefetchPages(paths: string[]) {
  if (typeof document === 'undefined') return;

  paths.forEach((path) => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    link.as = 'document';
    document.head.appendChild(link);
  });
}

/**
 * Enable resource hints for performance
 */
export function setupResourceHints() {
  if (typeof document === 'undefined') return;

  // Preconnect to CDNs and external services
  preconnectResources([
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net',
    'https://static.parastorage.com',
  ]);

  // Prefetch important pages
  prefetchPages(['/portfolio', '/booking', '/galleries']);
}

/**
 * Optimize font loading
 */
export function optimizeFontLoading() {
  if (typeof document === 'undefined') return;

  // Add font-display: swap to prevent FOUT
  const styles = document.querySelectorAll('style');
  styles.forEach((style) => {
    if (style.textContent && style.textContent.includes('@font-face')) {
      style.textContent = style.textContent.replace(
        /@font-face\s*{/g,
        '@font-face { font-display: swap;'
      );
    }
  });
}

/**
 * Monitor performance metrics
 */
export function monitorPerformance() {
  if (typeof window === 'undefined') return;

  // Navigation Timing
  window.addEventListener('load', () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    console.log('Page Load Time:', pageLoadTime, 'ms');

    // Report to analytics if needed
    if (window.gtag) {
      window.gtag('event', 'page_load_time', {
        value: pageLoadTime,
      });
    }
  });

  // Resource Timing
  const resources = window.performance.getEntriesByType('resource');
  console.log('Resources loaded:', resources.length);
}

/**
 * Initialize all SEO performance optimizations
 */
export function initializeSEOPerformance() {
  if (typeof window === 'undefined') return;

  setupResourceHints();
  optimizeFontLoading();
  reportWebVitals();
  monitorPerformance();
  initializeCoreWebVitals();

  // Lazy load images after page load
  window.addEventListener('load', () => {
    optimizeImageLoading();
  });
}
