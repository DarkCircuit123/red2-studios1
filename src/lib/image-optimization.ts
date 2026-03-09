/**
 * Image Optimization & Progressive Loading
 * Implements lazy loading, responsive images, and progressive enhancement
 */

/**
 * Setup lazy loading for images
 */
export function setupLazyLoading(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const images = document.querySelectorAll('img[data-src], img[loading="lazy"]');

  const imageObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        
        // Load the actual image
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }

        // Load srcset if available
        if (img.dataset.srcset) {
          img.srcSet = img.dataset.srcset;
          img.removeAttribute('data-srcset');
        }

        // Add loaded class for fade-in animation
        img.classList.add('loaded');
        observer.unobserve(img);
      }
    });
  }, {
    rootMargin: '50px',
  });

  images.forEach((img) => imageObserver.observe(img));
}

/**
 * Progressive image loading with blur-up effect
 */
export function setupProgressiveImageLoading(): void {
  if (typeof window === 'undefined') return;

  const images = document.querySelectorAll('img[data-blur-src]');

  images.forEach((img: Element) => {
    const htmlImg = img as HTMLImageElement;
    const blurSrc = htmlImg.dataset.blurSrc;
    const fullSrc = htmlImg.dataset.src || htmlImg.src;

    if (blurSrc) {
      // Load blur placeholder first
      const blurImg = new Image();
      blurImg.onload = () => {
        htmlImg.style.backgroundImage = `url(${blurSrc})`;
        htmlImg.classList.add('blur-loaded');
      };
      blurImg.src = blurSrc;

      // Load full image
      const fullImg = new Image();
      fullImg.onload = () => {
        htmlImg.src = fullSrc;
        htmlImg.classList.add('full-loaded');
      };
      fullImg.src = fullSrc;
    }
  });
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
  baseUrl: string,
  sizes: number[] = [320, 640, 960, 1280, 1920]
): string {
  return sizes
    .map((size) => {
      const url = baseUrl.includes('?') 
        ? `${baseUrl}&w=${size}` 
        : `${baseUrl}?w=${size}`;
      return `${url} ${size}w`;
    })
    .join(', ');
}

/**
 * Create picture element for responsive images
 */
export function createPictureElement(
  sources: Array<{
    srcset: string;
    media?: string;
    type?: string;
  }>,
  fallbackSrc: string,
  alt: string,
  className?: string
): HTMLPictureElement {
  const picture = document.createElement('picture');

  sources.forEach((source) => {
    const sourceEl = document.createElement('source');
    sourceEl.srcSet = source.srcset;
    if (source.media) sourceEl.media = source.media;
    if (source.type) sourceEl.type = source.type;
    picture.appendChild(sourceEl);
  });

  const img = document.createElement('img');
  img.src = fallbackSrc;
  img.alt = alt;
  if (className) img.className = className;
  picture.appendChild(img);

  return picture;
}

/**
 * Optimize SVG rendering
 */
export function optimizeSVGRendering(): void {
  if (typeof document === 'undefined') return;

  const svgs = document.querySelectorAll('svg');

  svgs.forEach((svg) => {
    // Add GPU acceleration
    svg.style.willChange = 'transform';
    svg.style.transform = 'translateZ(0)';

    // Optimize paths
    const paths = svg.querySelectorAll('path');
    paths.forEach((path) => {
      // Simplify path data if possible
      const d = path.getAttribute('d');
      if (d) {
        // Remove unnecessary decimals
        const simplified = d.replace(/(\d+\.\d{2})\d+/g, '$1');
        path.setAttribute('d', simplified);
      }
    });
  });
}

/**
 * Setup critical CSS loading
 */
export function setupCriticalCSS(): void {
  if (typeof document === 'undefined') return;

  // Mark critical styles
  const styles = document.querySelectorAll('style[data-critical]');
  styles.forEach((style) => {
    style.media = 'all';
  });

  // Defer non-critical styles
  const links = document.querySelectorAll('link[rel="stylesheet"]:not([data-critical])');
  links.forEach((link) => {
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
 * Preload critical images
 */
export function preloadCriticalImages(urls: string[]): void {
  if (typeof document === 'undefined') return;

  urls.forEach((url) => {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Setup image intersection observer for analytics
 */
export function setupImageAnalytics(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const images = document.querySelectorAll('img[data-analytics]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const analyticsId = img.dataset.analytics;

        // Track image view
        if (window.gtag) {
          window.gtag('event', 'image_view', {
            image_id: analyticsId,
            image_url: img.src,
          });
        }

        observer.unobserve(img);
      }
    });
  });

  images.forEach((img) => observer.observe(img));
}

/**
 * Optimize WebP support with fallback
 */
export function setupWebPSupport(): void {
  if (typeof document === 'undefined') return;

  // Check WebP support
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const imageData = ctx.createImageData(1, 1);
  const data = imageData.data;
  data[0] = 0;
  data[1] = 0;
  data[2] = 0;
  data[3] = 255;
  ctx.putImageData(imageData, 0, 0);

  const supportsWebP = canvas.toDataURL('image/webp').indexOf('image/webp') === 5;

  if (supportsWebP) {
    document.documentElement.classList.add('webp');
  } else {
    document.documentElement.classList.add('no-webp');
  }
}

/**
 * Initialize all image optimizations
 */
export function initializeImageOptimizations(): void {
  if (typeof window === 'undefined') return;

  setupWebPSupport();
  setupCriticalCSS();
  optimizeSVGRendering();

  // Defer lazy loading to avoid blocking initial render
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupLazyLoading();
      setupProgressiveImageLoading();
      setupImageAnalytics();
    });
  } else {
    setupLazyLoading();
    setupProgressiveImageLoading();
    setupImageAnalytics();
  }
}
