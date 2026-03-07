/**
 * Advanced optimization utilities
 * Implements code splitting, lazy loading, and resource optimization
 */

/**
 * Image optimization helper
 */
export function getOptimizedImageUrl(
  url: string,
  width?: number,
  height?: number,
  quality = 80
): string {
  if (!url) return '';

  // For Wix static images, add optimization parameters
  if (url.includes('wixstatic.com')) {
    const params = new URLSearchParams();
    if (width) params.append('w', width.toString());
    if (height) params.append('h', height.toString());
    params.append('q', quality.toString());

    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}${params.toString()}`;
  }

  return url;
}

/**
 * Responsive image srcset generator
 */
export function generateSrcSet(
  baseUrl: string,
  widths: number[] = [320, 640, 1024, 1280, 1920]
): string {
  return widths
    .map((width) => `${getOptimizedImageUrl(baseUrl, width)} ${width}w`)
    .join(', ');
}

/**
 * Lazy loading image with blur-up effect
 */
export function createLazyImageElement(
  src: string,
  alt: string,
  blurDataUrl?: string
): HTMLImageElement {
  const img = document.createElement('img');
  img.alt = alt;
  img.loading = 'lazy';

  if (blurDataUrl) {
    img.src = blurDataUrl;
    img.style.filter = 'blur(10px)';
  }

  // Load full image
  const fullImg = new Image();
  fullImg.onload = () => {
    img.src = src;
    img.style.filter = 'none';
    img.style.transition = 'filter 0.3s ease-out';
  };
  fullImg.src = src;

  return img;
}

/**
 * Prefetch resources for better performance
 */
export function prefetchResource(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = url;

  if (type === 'script') {
    link.as = 'script';
  } else if (type === 'style') {
    link.as = 'style';
  } else if (type === 'image') {
    link.as = 'image';
  }

  document.head.appendChild(link);
}

/**
 * Preload critical resources
 */
export function preloadResource(url: string, type: 'script' | 'style' | 'image' | 'font'): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = url;

  if (type === 'script') {
    link.as = 'script';
  } else if (type === 'style') {
    link.as = 'style';
  } else if (type === 'image') {
    link.as = 'image';
  } else if (type === 'font') {
    link.as = 'font';
    link.crossOrigin = 'anonymous';
  }

  document.head.appendChild(link);
}

/**
 * DNS prefetch for external domains
 */
export function dnsPrefetch(domain: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'dns-prefetch';
  link.href = `//${domain}`;
  document.head.appendChild(link);
}

/**
 * Preconnect to external domains
 */
export function preconnect(domain: string, crossOrigin = true): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = `//${domain}`;
  if (crossOrigin) {
    link.crossOrigin = 'anonymous';
  }
  document.head.appendChild(link);
}

/**
 * Optimize bundle by lazy loading components
 */
export async function lazyLoadModule<T>(
  importFn: () => Promise<{ default: T }>
): Promise<T> {
  try {
    const module = await importFn();
    return module.default;
  } catch (error) {
    console.error('Failed to lazy load module:', error);
    throw error;
  }
}

/**
 * Resource hints manager
 */
export class ResourceHintsManager {
  private hints: Set<string> = new Set();

  addDnsPrefetch(domain: string): void {
    if (!this.hints.has(`dns-prefetch:${domain}`)) {
      dnsPrefetch(domain);
      this.hints.add(`dns-prefetch:${domain}`);
    }
  }

  addPreconnect(domain: string): void {
    if (!this.hints.has(`preconnect:${domain}`)) {
      preconnect(domain);
      this.hints.add(`preconnect:${domain}`);
    }
  }

  addPrefetch(url: string, type: 'script' | 'style' | 'image' = 'script'): void {
    if (!this.hints.has(`prefetch:${url}`)) {
      prefetchResource(url, type);
      this.hints.add(`prefetch:${url}`);
    }
  }

  addPreload(url: string, type: 'script' | 'style' | 'image' | 'font'): void {
    if (!this.hints.has(`preload:${url}`)) {
      preloadResource(url, type);
      this.hints.add(`preload:${url}`);
    }
  }

  clear(): void {
    this.hints.clear();
  }
}

/**
 * Optimize CSS delivery
 */
export function optimizeCSSDelivery(): void {
  if (typeof document === 'undefined') return;

  const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
  stylesheets.forEach((sheet) => {
    // Load non-critical CSS asynchronously
    if (!sheet.hasAttribute('data-critical')) {
      sheet.setAttribute('media', 'print');
      sheet.onload = () => {
        sheet.setAttribute('media', 'all');
      };
    }
  });
}

/**
 * Defer non-critical JavaScript
 */
export function deferScript(src: string): void {
  if (typeof document === 'undefined') return;

  const script = document.createElement('script');
  script.src = src;
  script.defer = true;
  document.body.appendChild(script);
}

/**
 * Async script loading
 */
export function loadScriptAsync(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.body.appendChild(script);
  });
}

// Global resource hints manager
export const resourceHintsManager = new ResourceHintsManager();
