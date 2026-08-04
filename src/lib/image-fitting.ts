/**
 * Professional Image Fitting Utility
 * Handles responsive image fitting with focal point preservation
 */

export interface FocalPoint {
  x: number; // 0-100 (percentage from left)
  y: number; // 0-100 (percentage from top)
}

export interface ImageFittingConfig {
  containerWidth: number;
  containerHeight: number;
  imageWidth: number;
  imageHeight: number;
  focalPoint?: FocalPoint;
  fitMode: 'cover' | 'contain';
}

export interface ImageFittingResult {
  backgroundSize: string;
  backgroundPosition: string;
  objectFit: string;
  objectPosition: string;
}

/**
 * Calculate responsive image fitting with focal point preservation
 * Ensures images fill containers without distortion while protecting focal points
 */
export function calculateImageFitting(config: ImageFittingConfig): ImageFittingResult {
  const {
    containerWidth,
    containerHeight,
    imageWidth,
    imageHeight,
    focalPoint = { x: 50, y: 50 },
    fitMode = 'cover',
  } = config;

  const containerAspect = containerWidth / containerHeight;
  const imageAspect = imageWidth / imageHeight;

  if (fitMode === 'cover') {
    // For cover mode, image fills container and may be cropped
    // Calculate how much of the image will be visible
    let visibleWidth: number;
    let visibleHeight: number;

    if (containerAspect > imageAspect) {
      // Container is wider - scale image by width
      visibleWidth = imageWidth;
      visibleHeight = imageWidth / containerAspect;
    } else {
      // Container is taller - scale image by height
      visibleHeight = imageHeight;
      visibleWidth = imageHeight * containerAspect;
    }

    // Calculate crop offsets to center on focal point
    const horizontalCrop = imageWidth - visibleWidth;
    const verticalCrop = imageHeight - visibleHeight;

    // Position based on focal point (0-100%)
    const focalPointX = (focalPoint.x / 100) * imageWidth;
    const focalPointY = (focalPoint.y / 100) * imageHeight;

    // Calculate offset to keep focal point centered
    let offsetX = focalPointX - visibleWidth / 2;
    let offsetY = focalPointY - visibleHeight / 2;

    // Clamp offsets to valid range
    offsetX = Math.max(0, Math.min(offsetX, horizontalCrop));
    offsetY = Math.max(0, Math.min(offsetY, verticalCrop));

    // Convert back to percentage for CSS
    const positionX = (offsetX / imageWidth) * 100;
    const positionY = (offsetY / imageHeight) * 100;

    return {
      backgroundSize: 'cover',
      backgroundPosition: `${positionX}% ${positionY}%`,
      objectFit: 'cover',
      objectPosition: `${positionX}% ${positionY}%`,
    };
  } else {
    // For contain mode, entire image is visible
    return {
      backgroundSize: 'contain',
      backgroundPosition: 'center',
      objectFit: 'contain',
      objectPosition: 'center',
    };
  }
}

/**
 * Generate responsive image sizes string for srcset
 * Optimizes loading for different screen sizes
 */
export function generateResponsiveImageSizes(
  containerMaxWidth: number,
  breakpoints: number[] = [320, 640, 1024, 1280, 1920]
): string {
  return breakpoints
    .map((bp) => {
      const size = Math.min(bp, containerMaxWidth);
      if (bp === breakpoints[breakpoints.length - 1]) {
        return `${size}px`;
      }
      return `(max-width: ${bp}px) ${size}px`;
    })
    .join(', ');
}

/**
 * Get default focal point based on common photography composition rules
 */
export function getDefaultFocalPoint(imageAspect: number): FocalPoint {
  // Rule of thirds - place focal point at intersection
  // For landscape images, use right third
  // For portrait images, use upper third
  if (imageAspect > 1) {
    // Landscape
    return { x: 65, y: 45 };
  } else if (imageAspect < 1) {
    // Portrait
    return { x: 50, y: 35 };
  } else {
    // Square
    return { x: 50, y: 50 };
  }
}

/**
 * Validate and normalize focal point coordinates
 */
export function normalizeFocalPoint(focalPoint: Partial<FocalPoint>): FocalPoint {
  return {
    x: Math.max(0, Math.min(100, focalPoint.x ?? 50)),
    y: Math.max(0, Math.min(100, focalPoint.y ?? 50)),
  };
}

/**
 * Calculate optimal container dimensions for responsive design
 */
export function getResponsiveContainerDimensions(
  baseWidth: number,
  aspectRatio: number,
  screenWidth: number
): { width: number; height: number } {
  const width = Math.min(baseWidth, screenWidth);
  const height = width / aspectRatio;

  return { width, height };
}
