import { forwardRef, type ImgHTMLAttributes, useEffect, useRef, useState } from 'react'
import { useSize } from '@/hooks/use-size'
import WixImageResolver from '@/lib/wix-image-resolver'

const FALLBACK_IMAGE_URL = "https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png";

// Inline CSS for image animation
const imageStyles = `
  @keyframes scanMask {
    0% {
        mask-position: 0% 200%;
    }
    100% {
        mask-position: 0% -100%;
    }
  }

  img[src*='12d367_71ebdd7141d041e4be3d91d80d4578dd'] {
    mask-image: linear-gradient(to bottom, transparent 0%, rgba(255, 255, 255, 1) 50%, transparent 100%);
    mask-size: 100% 200%;
    mask-repeat: no-repeat;
    animation: scanMask 2s linear infinite;
  }
`;

// Inject styles into document head
if (typeof document !== 'undefined' && !document.getElementById('image-styles')) {
  const styleElement = document.createElement('style');
  styleElement.id = 'image-styles';
  styleElement.textContent = imageStyles;
  document.head.appendChild(styleElement);
}

type ImageData = {
  id: string
  width: number
  height: number
}

const getImageData = (url: string): ImageData | undefined => {
  // Use WixImageResolver to validate and normalize the URL first
  const resolved = WixImageResolver.resolve(url);
  
  // If URL is not valid or is a fallback, don't try to parse it
  if (!resolved.isValid || resolved.isFallback) {
    return undefined;
  }

  const normalizedUrl = resolved.url;

  // Extract dimensions from HTTPS URL (WixImageResolver already converted wix:image:// to HTTPS)
  if (normalizedUrl.startsWith('https://static.wixstatic.com/media/')) {
    try {
      const urlObj = new URL(normalizedUrl)
      if (urlObj.searchParams.get('originWidth') && urlObj.searchParams.get('originHeight')) {
        const uri = urlObj.pathname.split('/').slice(2).join('/')
        const width = parseInt(urlObj.searchParams.get('originWidth') || '0', 10)
        const height = parseInt(urlObj.searchParams.get('originHeight') || '0', 10)
        return { id: uri, width, height }
      }
    } catch (e) {
      // Invalid URL, return undefined
      return undefined;
    }
  }
  return undefined;
}

export type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fittingType?: 'fill' | 'fit'
}

export const Image = forwardRef<HTMLImageElement, ImageProps>(({ src, ...props }, ref) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(() => {
    // Initialize with resolved URL from WixImageResolver
    // WixImageResolver automatically converts wix:image:// to HTTPS
    if (src) {
      const resolved = WixImageResolver.resolve(src);
      // CRITICAL: Validate that URL is HTTPS and never wix:image://
      if (resolved.url && !resolved.url.startsWith('wix:image://')) {
        return resolved.url;
      }
      // If resolution failed or returned wix:image://, use fallback
      return FALLBACK_IMAGE_URL;
    }
    return undefined;
  })

  useEffect(() => {
    // If src prop changes, resolve it through WixImageResolver
    if (src) {
      const resolved = WixImageResolver.resolve(src, {
        fieldName: props['data-field-name'] as string | undefined,
        recordId: props['data-record-id'] as string | undefined
      });
      // CRITICAL: Validate that URL is HTTPS and never wix:image://
      if (resolved.url && !resolved.url.startsWith('wix:image://')) {
        setImgSrc(resolved.url);
      } else {
        setImgSrc(FALLBACK_IMAGE_URL);
      }
    } else {
      setImgSrc(undefined);
    }
  }, [src, props['data-field-name'], props['data-record-id']])

  if (!imgSrc) {
    return <div data-empty-image ref={ref} {...props} />
  }

  // CRITICAL: Ensure imgSrc is never a wix:image:// URL before rendering
  if (imgSrc.startsWith('wix:image://')) {
    console.error('[Image] CRITICAL CSP VIOLATION: wix:image:// URL reached render. This should never happen.', imgSrc);
    return <img data-error-image ref={ref} src={FALLBACK_IMAGE_URL} {...props} />
  }

  // Final validation: ensure URL is safe for browser rendering
  if (!imgSrc.startsWith('https://') && !imgSrc.startsWith('http://') && !imgSrc.startsWith('data:')) {
    console.error('[Image] CRITICAL: Invalid URL format in final render:', imgSrc);
    return <img data-error-image ref={ref} src={FALLBACK_IMAGE_URL} {...props} />
  }

  // Destructure priority out of props before spreading to avoid passing boolean to DOM
  const { priority, ...restProps } = props;

  const imageProps = {
    ...restProps,
    onError: (e: any) => {
      // On error, fall back to the fallback image only if not already fallback
      if (imgSrc !== FALLBACK_IMAGE_URL) {
        setImgSrc(FALLBACK_IMAGE_URL);
      }
      // Call original onError if provided
      if (props.onError && typeof props.onError === 'function') {
        props.onError(e);
      }
    }
  };

  // Render as regular img tag
  return <img data-error-image={imgSrc === FALLBACK_IMAGE_URL} ref={ref} src={imgSrc || FALLBACK_IMAGE_URL} {...imageProps} />
})
Image.displayName = 'Image'
