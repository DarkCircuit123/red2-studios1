import { useEffect, useState, useCallback, useRef } from 'react';
import {
  detectDeviceCapabilities,
  calculateOptimalDimensions,
  determineOptimalFormat,
  calculateOptimalQuality,
  generateSrcSet,
  buildImageUrl,
  monitorNetworkChanges,
  DeviceCapabilities,
  ImageVariant,
} from '@/lib/adaptive-image-loading';

export interface UseAdaptiveImageOptions {
  originalWidth: number;
  originalHeight: number;
  priority?: 'high' | 'low' | 'auto';
  onCapabilitiesChange?: (capabilities: DeviceCapabilities) => void;
}

export interface UseAdaptiveImageResult {
  src: string;
  srcSet: string;
  sizes: string;
  width: number;
  height: number;
  format: string;
  quality: number;
  capabilities: DeviceCapabilities;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for adaptive image loading with perceptual quality optimization
 */
export function useAdaptiveImage(
  baseUrl: string,
  options: UseAdaptiveImageOptions
): UseAdaptiveImageResult {
  const { originalWidth, originalHeight, priority = 'auto', onCapabilitiesChange } = options;

  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() =>
    detectDeviceCapabilities()
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Update capabilities on mount and when network changes
  useEffect(() => {
    const handleCapabilitiesChange = (newCapabilities: DeviceCapabilities) => {
      setCapabilities(newCapabilities);
      onCapabilitiesChange?.(newCapabilities);
    };

    // Monitor network changes
    unsubscribeRef.current = monitorNetworkChanges(handleCapabilitiesChange);

    // Handle window resize
    const handleResize = () => {
      const newCapabilities = detectDeviceCapabilities();
      if (
        newCapabilities.screenWidth !== capabilities.screenWidth ||
        newCapabilities.screenHeight !== capabilities.screenHeight
      ) {
        handleCapabilitiesChange(newCapabilities);
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribeRef.current?.();
    };
  }, [capabilities, onCapabilitiesChange]);

  // Calculate optimal dimensions
  const { width, height } = calculateOptimalDimensions(originalWidth, originalHeight, capabilities);

  // Determine format and quality
  const format = determineOptimalFormat(capabilities);
  const quality = calculateOptimalQuality(capabilities);

  // Generate image URLs
  const src = buildImageUrl(baseUrl, width, height, quality, format);
  const srcSet = generateSrcSet(baseUrl, originalWidth, originalHeight, capabilities);

  // Generate sizes attribute for responsive images
  const sizes = `(max-width: 640px) 100vw, (max-width: 1024px) 80vw, 60vw`;

  // Simulate loading completion
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [src]);

  return {
    src,
    srcSet,
    sizes,
    width,
    height,
    format,
    quality,
    capabilities,
    isLoading,
    error,
  };
}

/**
 * Hook to get current device capabilities
 */
export function useDeviceCapabilities(): DeviceCapabilities {
  const [capabilities, setCapabilities] = useState<DeviceCapabilities>(() =>
    detectDeviceCapabilities()
  );

  useEffect(() => {
    const unsubscribe = monitorNetworkChanges(setCapabilities);

    const handleResize = () => {
      setCapabilities(detectDeviceCapabilities());
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      unsubscribe();
    };
  }, []);

  return capabilities;
}

/**
 * Hook to preload multiple images
 */
export function usePreloadImages(urls: string[]): void {
  useEffect(() => {
    const capabilities = detectDeviceCapabilities();

    urls.forEach((url) => {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = url;
      document.head.appendChild(link);
    });
  }, [urls]);
}

/**
 * Hook for lazy loading with intersection observer
 */
export function useLazyImage(ref: React.RefObject<HTMLImageElement>): { isVisible: boolean } {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || !('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      {
        rootMargin: '50px',
      }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return { isVisible };
}
