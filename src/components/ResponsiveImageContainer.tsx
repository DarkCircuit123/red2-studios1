import React, { useState, useRef, useEffect } from 'react';
import { Image } from '@/components/ui/image';
import { useImageFitting } from '@/hooks/useImageFitting';

interface ResponsiveImageContainerProps {
  src: string;
  alt: string;
  containerClassName?: string;
  imageClassName?: string;
  focalPointX?: number;
  focalPointY?: number;
  fitMode?: 'cover' | 'contain';
  width?: number;
  height?: number;
  onImageLoad?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
}

/**
 * Professional responsive image container with focal point preservation
 * Automatically handles image fitting for different screen sizes
 */
export const ResponsiveImageContainer = React.forwardRef<
  HTMLDivElement,
  ResponsiveImageContainerProps
>(
  (
    {
      src,
      alt,
      containerClassName = '',
      imageClassName = '',
      focalPointX = 50,
      focalPointY = 50,
      fitMode = 'cover',
      width = 1920,
      height = 1080,
      onImageLoad,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const [containerDims, setContainerDims] = useState({ width: 1920, height: 1080 });
    const [imageDims, setImageDims] = useState({ width, height });

    // Use the forwarded ref or internal ref
    const finalRef = (ref as React.RefObject<HTMLDivElement>) || containerRef;

    // Update container dimensions on mount and resize
    useEffect(() => {
      const updateDimensions = () => {
        if (finalRef.current) {
          const rect = finalRef.current.getBoundingClientRect();
          setContainerDims({
            width: rect.width || 1920,
            height: rect.height || 1080,
          });
        }
      };

      updateDimensions();

      const resizeObserver = new ResizeObserver(updateDimensions);
      if (finalRef.current) {
        resizeObserver.observe(finalRef.current);
      }

      return () => {
        resizeObserver.disconnect();
      };
    }, [finalRef]);

    const { fitting } = useImageFitting({
      imageWidth: imageDims.width,
      imageHeight: imageDims.height,
      containerWidth: containerDims.width,
      containerHeight: containerDims.height,
      focalPoint: {
        x: focalPointX,
        y: focalPointY,
      },
      fitMode,
    });

    const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
      const img = e?.currentTarget;
      if (!img) return;

      const naturalWidth = img.naturalWidth;
      const naturalHeight = img.naturalHeight;

      if (!naturalWidth || !naturalHeight) return;

      setImageDims({
        width: naturalWidth,
        height: naturalHeight,
      });
      onImageLoad?.(e);
    };

    return (
      <div
        ref={finalRef}
        className={`relative w-full h-full overflow-hidden ${containerClassName}`}
      >
        <Image
          src={src}
          alt={alt}
          onLoad={handleImageLoad}
          width={width}
          height={height}
          className={`w-full h-full ${imageClassName}`}
          style={{
            objectFit: fitting.objectFit as any,
            objectPosition: fitting.objectPosition,
          }}
        />
      </div>
    );
  }
);

ResponsiveImageContainer.displayName = 'ResponsiveImageContainer';
