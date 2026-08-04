import { useState, useCallback, useEffect } from 'react';
import {
  calculateImageFitting,
  generateResponsiveImageSizes,
  getDefaultFocalPoint,
  normalizeFocalPoint,
  FocalPoint,
  ImageFittingResult,
} from '@/lib/image-fitting';

interface UseImageFittingProps {
  imageWidth: number;
  imageHeight: number;
  containerWidth: number;
  containerHeight: number;
  focalPoint?: Partial<FocalPoint>;
  fitMode?: 'cover' | 'contain';
}

interface UseImageFittingResult {
  fitting: ImageFittingResult;
  responsiveSizes: string;
  focalPoint: FocalPoint;
}

/**
 * Hook for managing professional image fitting with focal point preservation
 */
export function useImageFitting({
  imageWidth,
  imageHeight,
  containerWidth,
  containerHeight,
  focalPoint: customFocalPoint,
  fitMode = 'cover',
}: UseImageFittingProps): UseImageFittingResult {
  const [fitting, setFitting] = useState<ImageFittingResult>({
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    objectFit: 'cover',
    objectPosition: 'center',
  });

  const [responsiveSizes, setResponsiveSizes] = useState<string>('');
  const [focalPoint, setFocalPoint] = useState<FocalPoint>(() => {
    if (customFocalPoint) {
      return normalizeFocalPoint(customFocalPoint);
    }
    return getDefaultFocalPoint(imageWidth / imageHeight);
  });

  // Recalculate fitting when dimensions change
  useEffect(() => {
    if (imageWidth && imageHeight && containerWidth && containerHeight) {
      const result = calculateImageFitting({
        containerWidth,
        containerHeight,
        imageWidth,
        imageHeight,
        focalPoint,
        fitMode,
      });
      setFitting(result);
    }
  }, [imageWidth, imageHeight, containerWidth, containerHeight, focalPoint, fitMode]);

  // Generate responsive sizes
  useEffect(() => {
    const sizes = generateResponsiveImageSizes(containerWidth);
    setResponsiveSizes(sizes);
  }, [containerWidth]);

  // Update focal point if custom one changes
  useEffect(() => {
    if (customFocalPoint) {
      setFocalPoint(normalizeFocalPoint(customFocalPoint));
    }
  }, [customFocalPoint]);

  return {
    fitting,
    responsiveSizes,
    focalPoint,
  };
}
