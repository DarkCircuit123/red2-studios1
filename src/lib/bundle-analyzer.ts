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
 * Code splitting strategy - STATIC IMPORTS ONLY
 * All dynamic imports have been replaced with static imports to prevent repeated fetch attempts
 */
import HomePage from '@/components/pages/HomePage';
import PortfolioPage from '@/components/pages/PortfolioPage';
import BookingPage from '@/components/pages/BookingPage';
import ClientGalleriesPage from '@/components/pages/ClientGalleriesPage';
import BlogPage from '@/components/pages/BlogPage';
import ProfilePage from '@/components/pages/ProfilePage';
import PrivatePage from '@/components/pages/PrivatePage';
import HangmanGamePage from '@/components/pages/HangmanGamePage';
import Interactive3DGallerySection from '@/components/sections/Interactive3DGallerySection';
import BlogSection from '@/components/sections/BlogSection';
import ContactSection from '@/components/sections/ContactSection';

export const codeSpittingStrategy = {
  // Split by route - static imports
  routes: {
    home: () => Promise.resolve({ default: HomePage }),
    portfolio: () => Promise.resolve({ default: PortfolioPage }),
    booking: () => Promise.resolve({ default: BookingPage }),
    galleries: () => Promise.resolve({ default: ClientGalleriesPage }),
    blog: () => Promise.resolve({ default: BlogPage }),
    profile: () => Promise.resolve({ default: ProfilePage }),
    private: () => Promise.resolve({ default: PrivatePage }),
    play: () => Promise.resolve({ default: HangmanGamePage }),
  },

  // Split by feature - static imports
  features: {
    gallery: () => Promise.resolve({ default: Interactive3DGallerySection }),
    blog: () => Promise.resolve({ default: BlogSection }),
    contact: () => Promise.resolve({ default: ContactSection }),
  },

  // Split by vendor - static imports
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
