/**
 * Adaptive Image Loading with Perceptual Quality Optimization
 * Dynamically adjusts image resolution, format, and compression based on:
 * - Device pixel ratio (DPI)
 * - Screen size
 * - Network speed (4G, 3G, slow-2g)
 * - Available bandwidth
 */

export interface ImageLoadingConfig {
  url: string;
  width?: number;
  height?: number;
  alt?: string;
  priority?: 'high' | 'low' | 'auto';
}

export interface AdaptiveImageOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}

export interface DeviceCapabilities {
  dpr: number; // Device pixel ratio
  screenWidth: number;
  screenHeight: number;
  connectionSpeed: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
  effectiveType: string;
  saveData: boolean;
  isHighEndDevice: boolean;
}

export interface ImageVariant {
  url: string;
  width: number;
  height: number;
  format: string;
  quality: number;
  size: number; // Estimated file size in bytes
}

/**
 * Detect device capabilities and network conditions
 */
export function detectDeviceCapabilities(): DeviceCapabilities {
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;
  const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const screenHeight = typeof window !== 'undefined' ? window.innerHeight : 768;

  // Detect network speed
  let connectionSpeed: DeviceCapabilities['connectionSpeed'] = 'unknown';
  let effectiveType = '4g';
  let saveData = false;

  if (typeof navigator !== 'undefined') {
    const connection = (navigator as any).connection || (navigator as any).mozConnection;
    if (connection) {
      effectiveType = connection.effectiveType || '4g';
      connectionSpeed = connection.effectiveType || '4g';
      saveData = connection.saveData || false;
    }
  }

  // Detect high-end device (modern GPU, sufficient RAM)
  const isHighEndDevice = dpr >= 2 && screenWidth >= 1440;

  return {
    dpr,
    screenWidth,
    screenHeight,
    connectionSpeed,
    effectiveType,
    saveData,
    isHighEndDevice,
  };
}

/**
 * Calculate optimal image dimensions based on device
 */
export function calculateOptimalDimensions(
  originalWidth: number,
  originalHeight: number,
  capabilities: DeviceCapabilities
): { width: number; height: number } {
  const { dpr, screenWidth, saveData } = capabilities;

  // Base width is screen width, but cap at original width
  let targetWidth = Math.min(screenWidth * dpr, originalWidth);

  // If save-data is enabled, reduce by 20%
  if (saveData) {
    targetWidth = Math.floor(targetWidth * 0.8);
  }

  // Calculate height maintaining aspect ratio
  const aspectRatio = originalHeight / originalWidth;
  const targetHeight = Math.floor(targetWidth * aspectRatio);

  return {
    width: Math.max(targetWidth, 320), // Minimum 320px
    height: Math.max(targetHeight, 240), // Minimum 240px
  };
}

/**
 * Determine optimal image format based on device and network
 */
export function determineOptimalFormat(
  capabilities: DeviceCapabilities
): 'webp' | 'avif' | 'jpeg' {
  const { connectionSpeed, saveData, isHighEndDevice } = capabilities;

  // Check browser support
  const supportsAVIF = checkFormatSupport('avif');
  const supportsWebP = checkFormatSupport('webp');

  // On slow networks or with save-data, prefer JPEG
  if (saveData || connectionSpeed === 'slow-2g' || connectionSpeed === '2g') {
    return 'jpeg';
  }

  // On high-end devices with good connection, use AVIF
  if (supportsAVIF && isHighEndDevice && connectionSpeed === '4g') {
    return 'avif';
  }

  // Default to WebP if supported
  if (supportsWebP) {
    return 'webp';
  }

  return 'jpeg';
}

/**
 * Check if browser supports specific image format
 */
export function checkFormatSupport(format: 'webp' | 'avif' | 'jpeg'): boolean {
  if (typeof document === 'undefined') return false;

  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;

  try {
    switch (format) {
      case 'webp':
        return canvas.toDataURL('image/webp').includes('webp');
      case 'avif':
        return canvas.toDataURL('image/avif').includes('avif');
      case 'jpeg':
        return true; // Always supported
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Calculate optimal quality based on network and device
 */
export function calculateOptimalQuality(capabilities: DeviceCapabilities): number {
  const { connectionSpeed, saveData, dpr } = capabilities;

  let baseQuality = 85; // Default quality

  // Adjust for network speed
  if (connectionSpeed === 'slow-2g' || connectionSpeed === '2g') {
    baseQuality = 60;
  } else if (connectionSpeed === '3g') {
    baseQuality = 75;
  }

  // Adjust for save-data
  if (saveData) {
    baseQuality = Math.max(baseQuality - 15, 50);
  }

  // High DPI devices can use slightly lower quality due to perceptual benefits
  if (dpr >= 2) {
    baseQuality = Math.max(baseQuality - 5, 60);
  }

  return baseQuality;
}

/**
 * Generate responsive image srcset
 */
export function generateSrcSet(
  baseUrl: string,
  originalWidth: number,
  originalHeight: number,
  capabilities: DeviceCapabilities
): string {
  const format = determineOptimalFormat(capabilities);
  const quality = calculateCalculatedQuality(capabilities);

  // Generate multiple sizes for responsive loading
  const sizes = [320, 640, 960, 1280, 1600, 1920];
  const srcSetParts: string[] = [];

  sizes.forEach((size) => {
    if (size <= originalWidth) {
      const url = buildImageUrl(baseUrl, size, Math.floor((size * originalHeight) / originalWidth), quality, format);
      srcSetParts.push(`${url} ${size}w`);
    }
  });

  return srcSetParts.join(', ');
}

/**
 * Build optimized image URL with parameters
 */
export function buildImageUrl(
  baseUrl: string,
  width: number,
  height: number,
  quality: number,
  format: string
): string {
  // If URL already has parameters, append with &
  const separator = baseUrl.includes('?') ? '&' : '?';

  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    q: quality.toString(),
    f: format,
  });

  return `${baseUrl}${separator}${params.toString()}`;
}

/**
 * Calculate quality based on capabilities
 */
function calculateCalculatedQuality(capabilities: DeviceCapabilities): number {
  return calculateOptimalQuality(capabilities);
}

/**
 * Estimate file size for different formats and qualities
 */
export function estimateFileSize(
  width: number,
  height: number,
  format: 'webp' | 'avif' | 'jpeg',
  quality: number
): number {
  const pixelCount = width * height;

  // Base bytes per pixel (rough estimates)
  const baseRates: Record<string, number> = {
    jpeg: 0.15,
    webp: 0.12,
    avif: 0.08,
  };

  const baseRate = baseRates[format] || 0.15;

  // Quality multiplier (lower quality = smaller file)
  const qualityMultiplier = quality / 100;

  return Math.ceil(pixelCount * baseRate * qualityMultiplier);
}

/**
 * Preload image with optimal settings
 */
export function preloadImage(config: ImageLoadingConfig): void {
  if (typeof document === 'undefined') return;

  const capabilities = detectDeviceCapabilities();
  const { width = 1200, height = 800 } = config;

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'image';
  link.href = config.url;

  // Add imagesrcset for responsive images
  const srcset = generateSrcSet(config.url, width, height, capabilities);
  if (srcset) {
    link.setAttribute('imagesrcset', srcset);
  }

  document.head.appendChild(link);
}

/**
 * Generate picture element with multiple format sources
 */
export function generatePictureElement(
  baseUrl: string,
  width: number,
  height: number,
  alt: string,
  capabilities?: DeviceCapabilities
): string {
  const caps = capabilities || detectDeviceCapabilities();
  const quality = calculateOptimalQuality(caps);

  const avifUrl = buildImageUrl(baseUrl, width, height, quality, 'avif');
  const webpUrl = buildImageUrl(baseUrl, width, height, quality, 'webp');
  const jpegUrl = buildImageUrl(baseUrl, width, height, quality, 'jpeg');

  return `
    <picture>
      <source srcset="${avifUrl}" type="image/avif" />
      <source srcset="${webpUrl}" type="image/webp" />
      <img src="${jpegUrl}" alt="${alt}" width="${width}" height="${height}" loading="lazy" />
    </picture>
  `;
}

/**
 * Monitor network changes and reload images if needed
 */
export function monitorNetworkChanges(callback: (capabilities: DeviceCapabilities) => void): () => void {
  if (typeof navigator === 'undefined') return () => {};

  const connection = (navigator as any).connection || (navigator as any).mozConnection;
  if (!connection) return () => {};

  const handleChange = () => {
    callback(detectDeviceCapabilities());
  };

  connection.addEventListener('change', handleChange);

  return () => {
    connection.removeEventListener('change', handleChange);
  };
}

/**
 * Lazy load images with intersection observer
 */
export function setupLazyLoading(): void {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;

  const images = document.querySelectorAll('img[data-adaptive-src]');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        const img = entry.target as HTMLImageElement;
        const adaptiveSrc = img.getAttribute('data-adaptive-src');

        if (adaptiveSrc) {
          const capabilities = detectDeviceCapabilities();
          const quality = calculateOptimalQuality(capabilities);
          const format = determineOptimalFormat(capabilities);

          img.src = buildImageUrl(adaptiveSrc, 1200, 800, quality, format);
          img.removeAttribute('data-adaptive-src');
          observer.unobserve(img);
        }
      }
    });
  });

  images.forEach((img) => observer.observe(img));
}
