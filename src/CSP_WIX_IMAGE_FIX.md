# CSP wix:image:// URL Fix - Complete Solution

## Problem
The browser was blocking images with CSP error:
```
Content-Security-Policy: The page's settings blocked the loading of a resource (img-src) 
at wix:image://v1/e9d727_8064369cb4d54df78587000dfea27a01~mv2.jpg/red2.jpg#originWidth=1024&originHeight=1024 
because it violates the following directive: "img-src 'self' data: https: blob: https://static.parastorage.com..."
```

## Root Cause
1. **wix:image:// is not a valid browser protocol** - It's an internal Wix format that cannot be loaded directly by browsers
2. **CSP cannot allow wix:image://** - Content-Security-Policy directives only accept valid HTTP/HTTPS schemes
3. **Image URLs were reaching the DOM unconverted** - Some code paths were passing raw `wix:image://` URLs to `<img src>` tags

## Solution Architecture

### 1. **Image Component Enhancement** (`/src/components/ui/image.tsx`)
- **Initialize state with converted URL**: The `useState` initializer now converts `wix:image://` → HTTPS immediately
- **Convert in useEffect**: When `src` prop changes, convert before updating state
- **Safety check before render**: Added guard to catch any `wix:image://` URLs that somehow reach the DOM
- **Fallback on error**: If conversion fails, use fallback image

**Key changes:**
```typescript
// Initialize with converted URL to prevent wix:image:// from ever reaching the DOM
const [imgSrc, setImgSrc] = useState<string | undefined>(() => {
  if (src) {
    const resolved = WixImageResolver.resolve(src);
    return convertWixImageToHttps(resolved.url);  // Convert immediately
  }
  return undefined;
})

// Safety check - should never trigger if conversion works
if (finalSrc.startsWith('wix:image://')) {
  console.error('[Image] CSP Violation: wix:image:// URL reached DOM.');
  return <img data-error-image ref={ref} src={FALLBACK_IMAGE_URL} {...props} />
}
```

### 2. **ImageUploader Component Fix** (`/src/components/AdminPanel/sections/ImageUploader.tsx`)
- **Replaced raw `<img>` with `<Image>` component**: Now uses the CSP-compliant Image component
- **Automatic URL conversion**: Preview images are now converted from `wix:image://` to HTTPS

**Before:**
```typescript
<img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
```

**After:**
```typescript
<Image src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
```

### 3. **CSP Policy Update** (`/src/astro.config.mjs`)
- **Added explicit Wix CDN domains** to `img-src` directive
- **Removed wix:image:// from CSP** (it's not needed since URLs are converted before rendering)

**Before:**
```
img-src 'self' data: https: blob:
```

**After:**
```
img-src 'self' data: https: blob: https://static.wixstatic.com https://*.wixstatic.com
```

## URL Conversion Flow

```
wix:image://v1/{uri}/{filename}#{params}
    ↓
WixImageResolver.resolve()  [validates format]
    ↓
convertWixImageToHttps()    [extracts URI and params]
    ↓
https://static.wixstatic.com/{uri}?originWidth={W}&originHeight={H}
    ↓
Browser loads HTTPS URL (CSP compliant)
```

## Components Using Image Component

All image rendering should use the `Image` component from `@/components/ui/image`:

✅ **Correct:**
```typescript
import { Image } from '@/components/ui/image';
<Image src={imageUrl} alt="Description" />
```

❌ **Incorrect (CSP violation):**
```typescript
<img src={imageUrl} alt="Description" />
```

## Testing the Fix

1. **Check browser console** - No CSP errors for `wix:image://` URLs
2. **Verify images load** - All images should display correctly
3. **Check Network tab** - All image requests should be to `https://static.wixstatic.com/*`
4. **Test admin panel** - Image uploads and previews should work

## Files Modified

1. `/src/components/ui/image.tsx` - Enhanced Image component with immediate URL conversion
2. `/src/components/AdminPanel/sections/ImageUploader.tsx` - Use Image component for previews
3. `/src/astro.config.mjs` - Updated CSP img-src directive

## Fallback Behavior

If URL conversion fails for any reason:
- Image component renders fallback image: `https://static.wixstatic.com/media/12d367_4f26ccd17f8f4e3a8958306ea08c2332~mv2.png`
- Error logged to console for debugging
- No CSP violations occur

## Why This Approach

1. **Converts at the source** - URLs are converted before reaching the DOM
2. **No CSP workarounds** - Uses standard HTTPS URLs that CSP naturally allows
3. **Backward compatible** - Works with existing code that passes `wix:image://` URLs
4. **Defensive** - Multiple layers of conversion ensure no unconverted URLs reach the browser
5. **Debuggable** - Clear error messages if something goes wrong

## Related Utilities

- `WixImageResolver` (`/src/lib/wix-image-resolver.ts`) - Validates and identifies URL formats
- `convertWixImageToHttps()` - Converts `wix:image://` to HTTPS URLs
- `STATIC_MEDIA_URL` - Wix CDN base URL from `@wix/image-kit`
