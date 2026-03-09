import React, { useRef, forwardRef } from 'react';
import { useAdaptiveImage, useLazyImage } from '@/hooks/useAdaptiveImage';
import { Image } from '@/components/ui/image';

export interface AdaptiveImageProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: string;
  originalWidth: number;
  originalHeight: number;
  alt: string;
  priority?: 'high' | 'low' | 'auto';
  lazy?: boolean;
  onLoad?: () => void;
  onError?: (error: Error) => void;
}

/**
 * Adaptive Image Component with Perceptual Quality Optimization
 *
 * Features:
 * - Automatic format selection (AVIF, WebP, JPEG)
 * - Device-aware resolution scaling
 * - Network-aware quality adjustment
 * - Lazy loading support
 * - Responsive srcset generation
 * - High-DPI display optimization
 */
const AdaptiveImage = forwardRef<HTMLImageElement, AdaptiveImageProps>(
  (
    {
      src,
      originalWidth,
      originalHeight,
      alt,
      priority = 'auto',
      lazy = true,
      onLoad,
      onError,
      className,
      style,
      ...props
    },
    ref
  ) => {
    const imgRef = useRef<HTMLImageElement>(null);
    const { isVisible } = useLazyImage(imgRef);

    const { src: adaptiveSrc, srcSet, sizes, width, height, quality, format } = useAdaptiveImage(
      src,
      {
        originalWidth,
        originalHeight,
        priority,
      }
    );

    // Combine refs
    React.useImperativeHandle(ref, () => imgRef.current as HTMLImageElement);

    // Determine if we should load the image
    const shouldLoad = !lazy || isVisible;

    // Handle image load
    const handleLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      onLoad?.();
    };

    // Handle image error
    const handleError = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const error = new Error(`Failed to load image: ${src}`);
      onError?.(error);
    };

    return (
      <picture>
        {/* AVIF format for high-end devices */}
        <source
          srcSet={shouldLoad ? adaptiveSrc.replace(/f=avif/, 'f=avif') : undefined}
          type="image/avif"
          media="(min-width: 1024px)"
        />

        {/* WebP format for modern browsers */}
        <source
          srcSet={shouldLoad ? adaptiveSrc.replace(/f=webp/, 'f=webp') : undefined}
          type="image/webp"
        />

        {/* Fallback JPEG */}
        <Image
          ref={imgRef}
          src={shouldLoad ? adaptiveSrc : undefined}
          srcSet={shouldLoad ? srcSet : undefined}
          sizes={sizes}
          alt={alt}
          width={width}
          height={height}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={className}
          style={{
            ...style,
            aspectRatio: `${originalWidth} / ${originalHeight}`,
          }}
          {...props}
        />
      </picture>
    );
  }
);

AdaptiveImage.displayName = 'AdaptiveImage';

export default AdaptiveImage;
