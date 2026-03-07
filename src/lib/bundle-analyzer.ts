/**
 * Bundle analysis and optimization utilities
 * Helps identify and optimize large dependencies
 */

interface BundleMetrics {
  totalSize: number;
  gzipSize: number;
  modules: ModuleInfo[];
  largestModules: ModuleInfo[];
}

interface ModuleInfo {
  name: string;
  size: number;
  gzipSize: number;
  percentage: number;
}

/**
 * Analyze bundle size
 */
export function analyzeBundleSize(): BundleMetrics {
  const metrics: BundleMetrics = {
    totalSize: 0,
    gzipSize: 0,
    modules: [],
    largestModules: [],
  };

  // This would typically be populated by build-time analysis
  // For now, we provide a framework for runtime analysis

  if (process.env.NODE_ENV === 'development') {
    console.log('📦 Bundle Analysis:', metrics);
  }

  return metrics;
}

/**
 * Lazy load a module dynamically
 */
export async function lazyLoadModule<T>(
  importFn: () => Promise<{ default: T }>,
  moduleName: string
): Promise<T> {
  try {
    const startTime = performance.now();
    const module = await importFn();
    const loadTime = performance.now() - startTime;

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ Lazy loaded ${moduleName} in ${loadTime.toFixed(2)}ms`);
    }

    return module.default;
  } catch (error) {
    console.error(`Failed to lazy load module ${moduleName}:`, error);
    throw error;
  }
}

/**
 * Code splitting strategy
 */
export const codeSpittingStrategy = {
  // Split by route
  routes: {
    home: () => import('@/components/pages/HomePage'),
    portfolio: () => import('@/components/pages/PortfolioPage'),
    booking: () => import('@/components/pages/BookingPage'),
    galleries: () => import('@/components/pages/ClientGalleriesPage'),
    blog: () => import('@/components/pages/BlogPage'),
    profile: () => import('@/components/pages/ProfilePage'),
    private: () => import('@/components/pages/PrivatePage'),
    play: () => import('@/components/pages/HangmanGamePage'),
  },

  // Split by feature
  features: {
    gallery: () => import('@/components/sections/Interactive3DGallerySection'),
    blog: () => import('@/components/sections/BlogSection'),
    contact: () => import('@/components/sections/ContactSection'),
  },

  // Split by vendor
  vendors: {
    framerMotion: () => import('framer-motion'),
    recharts: () => import('recharts'),
  },
};

/**
 * Monitor chunk loading performance
 */
export class ChunkLoadingMonitor {
  private chunkMetrics: Map<string, { startTime: number; endTime?: number; size?: number }> =
    new Map();

  startChunkLoad(chunkName: string): void {
    this.chunkMetrics.set(chunkName, { startTime: performance.now() });
  }

  endChunkLoad(chunkName: string, size?: number): void {
    const metric = this.chunkMetrics.get(chunkName);
    if (metric) {
      metric.endTime = performance.now();
      metric.size = size;

      const loadTime = metric.endTime - metric.startTime;
      if (process.env.NODE_ENV === 'development') {
        console.log(
          `📦 Chunk "${chunkName}" loaded in ${loadTime.toFixed(2)}ms${size ? ` (${(size / 1024).toFixed(2)}KB)` : ''}`
        );
      }
    }
  }

  getMetrics() {
    return Object.fromEntries(this.chunkMetrics);
  }

  clear(): void {
    this.chunkMetrics.clear();
  }
}

/**
 * Prefetch chunks for better performance
 */
export function prefetchChunk(chunkUrl: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'prefetch';
  link.href = chunkUrl;
  link.as = 'script';
  document.head.appendChild(link);
}

/**
 * Preload critical chunks
 */
export function preloadChunk(chunkUrl: string): void {
  if (typeof document === 'undefined') return;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.href = chunkUrl;
  link.as = 'script';
  document.head.appendChild(link);
}

// Global chunk loading monitor
export const chunkLoadingMonitor = new ChunkLoadingMonitor();
