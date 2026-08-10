import { type FittingType, getPlaceholder, sdk, STATIC_MEDIA_URL } from '@wix/image-kit'
import { forwardRef, type ImgHTMLAttributes, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { useSize } from '@/hooks/use-size'
import WixImageResolver from '@/lib/wix-image-resolver'

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

const FALLBACK_IMAGE_URL = "https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png";

type ImageData = {
  id: string
  width: number
  height: number
}

/**
 * Convert wix:image:// URLs to HTTPS URLs for browser rendering
 * This resolves the CSP issue where browsers cannot load wix:image:// directly
 */
const convertWixImageToHttps = (url: string): string => {
  const wixImagePrefix = 'wix:image://v1/';
  if (url.startsWith(wixImagePrefix)) {
    // Extract the URI and parameters from wix:image://v1/{uri}/{filename}#{params}
    const withoutPrefix = url.replace(wixImagePrefix, '');
    const [uriPart, paramsString] = withoutPrefix.split('#');
    const uri = uriPart.split('/')[0];
    
    // Parse origin dimensions if available
    const params = new URLSearchParams(paramsString || '');
    const originWidth = params.get('originWidth');
    const originHeight = params.get('originHeight');
    
    // Build HTTPS URL using Wix static CDN
    let httpsUrl = `${STATIC_MEDIA_URL}${uri}`;
    
    // Add origin dimensions if available
    if (originWidth && originHeight) {
      httpsUrl += `?originWidth=${originWidth}&originHeight=${originHeight}`;
    }
    
    return httpsUrl;
  }
  return url;
};

const getImageData = (url: string): ImageData | undefined => {
  // Use WixImageResolver to validate and normalize the URL first
  const resolved = WixImageResolver.resolve(url);
  
  // If URL is not valid or is a fallback, don't try to parse it
  if (!resolved.isValid || resolved.isFallback) {
    return undefined;
  }

  const normalizedUrl = resolved.url;

  // wix:image://v1/${uri}/${filename}#originWidth=${width}&originHeight=${height}
  const wixImagePrefix = 'wix:image://v1/'
  if (normalizedUrl.startsWith(wixImagePrefix)) {
    const uri = normalizedUrl.replace(wixImagePrefix, '').split('#')[0].split('/')[0]

    const params = new URLSearchParams(normalizedUrl.split('#')[1] || '')
    const width = parseInt(params.get('originWidth') || '0', 10)
    const height = parseInt(params.get('originHeight') || '0', 10)

    return { id: uri, width, height }
  } else if (normalizedUrl.startsWith(STATIC_MEDIA_URL)) {
    const urlObj = new URL(normalizedUrl)
    if (urlObj.searchParams.get('originWidth') && urlObj.searchParams.get('originHeight')) {
      const uri = urlObj.pathname.split('/').slice(2).join('/')
      const width = parseInt(urlObj.searchParams.get('originWidth') || '0', 10)
      const height = parseInt(urlObj.searchParams.get('originHeight') || '0', 10)
      return { id: uri, width, height }
    }
  }
}

export type ImageProps = ImgHTMLAttributes<HTMLImageElement> & {
  fittingType?: FittingType
}

type WixImageProps = Omit<ImageProps, 'src'> & { data: ImageData }
const WixImage = forwardRef<HTMLImageElement, WixImageProps>(
  ({ data, fittingType = 'fill', ...imgProps }, parentRef) => {
    const ref = useRef<HTMLImageElement | null>(null)
    const size = useSize(ref)

    // Expose the ref to the parent component
    useImperativeHandle(parentRef, () => ref.current as HTMLImageElement)

    if (!size) {
      const { uri, ...placeholder } = getPlaceholder(fittingType ?? 'fit', data, { htmlTag: 'img' })
      // @ts-expect-error placeholder.css.img properties are not typed correctly.
      return <img ref={ref} src={`${STATIC_MEDIA_URL}${uri}`} style={placeholder.css.img} {...placeholder.attr}  {...imgProps} />
    }

    const scale = fittingType === 'fit' ? sdk.getScaleToFitImageURL : sdk.getScaleToFillImageURL
    const height = size.height || data.height * (size.width / data.width) || data.height
    const width = size.width || data.width * (size.height / data.height) || data.width
    const src = scale(data.id, data.width, data.height, width, height)

    return <img ref={ref} {...imgProps} src={src} />
  }
)
WixImage.displayName = 'WixImage'

export const Image = forwardRef<HTMLImageElement, ImageProps>(({ src, ...props }, ref) => {
  const [imgSrc, setImgSrc] = useState<string | undefined>(src)

  useEffect(() => {
    // If src prop changes, resolve it through WixImageResolver and update state
    if (src !== imgSrc) {
      const resolved = WixImageResolver.resolve(src, {
        fieldName: props['data-field-name'] as string | undefined,
        recordId: props['data-record-id'] as string | undefined
      });
      // Convert wix:image:// to HTTPS for browser rendering (CSP compliance)
      const browserUrl = convertWixImageToHttps(resolved.url);
      // Guard: only update state if the resolved URL is different
      setImgSrc(prevSrc => prevSrc === browserUrl ? prevSrc : browserUrl);
    }
  }, [src, props['data-field-name'], props['data-record-id']])

  if (!imgSrc) {
    return <div data-empty-image ref={ref} {...props} />
  }

  // Resolve the URL through WixImageResolver for consistency
  const resolved = WixImageResolver.resolve(imgSrc, {
    fieldName: props['data-field-name'] as string | undefined,
    recordId: props['data-record-id'] as string | undefined
  });
  // Convert wix:image:// to HTTPS for browser rendering (CSP compliance)
  const finalSrc = convertWixImageToHttps(resolved.url);

  // Destructure priority out of props before spreading to avoid passing boolean to DOM
  const { priority, ...restProps } = props;

  const imageProps = {
    ...restProps,
    onError: (e: any) => {
      // On error, fall back to the fallback image only if not already fallback
      if (finalSrc !== FALLBACK_IMAGE_URL) {
        setImgSrc(FALLBACK_IMAGE_URL);
      }
      // Call original onError if provided
      if (props.onError && typeof props.onError === 'function') {
        props.onError(e);
      }
    }
  };

  const imageData = getImageData(finalSrc);

  if (!imageData) {
    // If we can't parse as Wix image data, render as regular img
    return <img data-error-image={finalSrc === FALLBACK_IMAGE_URL} ref={ref} src={finalSrc} {...imageProps} />
  }

  return <WixImage ref={ref} data={imageData} {...imageProps} />
})
Image.displayName = 'Image'
