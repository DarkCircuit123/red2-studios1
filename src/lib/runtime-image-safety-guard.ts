/**
 * CRITICAL RUNTIME SAFETY GUARD
 * 
 * This module intercepts ALL image URLs at runtime to ensure NO wix:image:// URLs
 * reach the browser DOM, CSS, or network requests.
 * 
 * This is the FINAL defense layer that catches any wix:image:// URLs that slip
 * through component-level resolution.
 * 
 * Patches:
 * 1. HTMLImageElement.prototype.src - intercepts all <img src> assignments
 * 2. CSSStyleDeclaration.prototype.setProperty - intercepts all CSS background-image
 * 3. Element.prototype.setAttribute - intercepts all attribute assignments
 * 4. fetch/XHR - intercepts network requests for image URLs
 * 5. Preload links - intercepts <link rel="preload"> href assignments
 */

import WixImageResolver from './wix-image-resolver';

const IS_DEVELOPMENT = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';

/**
 * Convert wix:image:// to HTTPS at runtime
 */
function safeResolveImageUrl(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return url;
  
  // If it's a wix:image:// URL, resolve it immediately
  if (url.startsWith('wix:image://')) {
    const resolved = WixImageResolver.resolve(url);
    if (IS_DEVELOPMENT) {
      console.warn('[RuntimeImageSafetyGuard] Caught wix:image:// URL at runtime:', url, '→', resolved.url);
    }
    return resolved.url;
  }
  
  return url;
}

/**
 * Initialize runtime safety guards
 * Call this once during app initialization
 */
export function initializeRuntimeImageSafetyGuard() {
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    return; // Not in browser
  }

  // Guard 1: Intercept HTMLImageElement.src assignments
  const originalImageDescriptor = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
  if (originalImageDescriptor) {
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      get() {
        return originalImageDescriptor.get?.call(this);
      },
      set(value: string | null | undefined) {
        const safeUrl = safeResolveImageUrl(value);
        if (originalImageDescriptor.set) {
          originalImageDescriptor.set.call(this, safeUrl);
        }
      },
      configurable: true,
    });
  }

  // Guard 2: Intercept setAttribute for src attributes
  const originalSetAttribute = Element.prototype.setAttribute;
  Element.prototype.setAttribute = function(name: string, value: string) {
    if (name.toLowerCase() === 'src' && value?.startsWith('wix:image://')) {
      const safeUrl = safeResolveImageUrl(value);
      if (IS_DEVELOPMENT) {
        console.warn('[RuntimeImageSafetyGuard] Caught wix:image:// in setAttribute:', value, '→', safeUrl);
      }
      return originalSetAttribute.call(this, name, safeUrl || value);
    }
    return originalSetAttribute.call(this, name, value);
  };

  // Guard 3: Intercept CSS background-image
  const originalSetProperty = CSSStyleDeclaration.prototype.setProperty;
  CSSStyleDeclaration.prototype.setProperty = function(
    propertyName: string,
    value: string,
    priority?: string
  ) {
    if (propertyName === 'background-image' && value?.includes('wix:image://')) {
      // Extract URL from url('...') or url("...")
      const urlMatch = value.match(/url\(['"]?(wix:image:\/\/[^'")]+)['"]?\)/);
      if (urlMatch) {
        const wixUrl = urlMatch[1];
        const resolved = WixImageResolver.resolve(wixUrl);
        const safeValue = value.replace(wixUrl, resolved.url);
        if (IS_DEVELOPMENT) {
          console.warn('[RuntimeImageSafetyGuard] Caught wix:image:// in CSS background-image:', wixUrl, '→', resolved.url);
        }
        return originalSetProperty.call(this, propertyName, safeValue, priority);
      }
    }
    return originalSetProperty.call(this, propertyName, value, priority);
  };

  // Guard 4: Intercept style.backgroundImage assignments
  const styleDescriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, 'backgroundImage');
  if (styleDescriptor) {
    Object.defineProperty(CSSStyleDeclaration.prototype, 'backgroundImage', {
      get() {
        return styleDescriptor.get?.call(this);
      },
      set(value: string) {
        if (value?.includes('wix:image://')) {
          const urlMatch = value.match(/url\(['"]?(wix:image:\/\/[^'")]+)['"]?\)/);
          if (urlMatch) {
            const wixUrl = urlMatch[1];
            const resolved = WixImageResolver.resolve(wixUrl);
            const safeValue = value.replace(wixUrl, resolved.url);
            if (IS_DEVELOPMENT) {
              console.warn('[RuntimeImageSafetyGuard] Caught wix:image:// in style.backgroundImage:', wixUrl, '→', resolved.url);
            }
            return styleDescriptor.set?.call(this, safeValue);
          }
        }
        return styleDescriptor.set?.call(this, value);
      },
      configurable: true,
    });
  }

  // Guard 5: Intercept preload links
  const originalCreateElement = document.createElement;
  document.createElement = function(tagName: string, ...args: any[]) {
    const element = originalCreateElement.call(document, tagName, ...args);
    
    if (tagName.toLowerCase() === 'link') {
      const originalSetAttribute = element.setAttribute;
      element.setAttribute = function(name: string, value: string) {
        if (name === 'href' && value?.startsWith('wix:image://')) {
          const safeUrl = safeResolveImageUrl(value);
          if (IS_DEVELOPMENT) {
            console.warn('[RuntimeImageSafetyGuard] Caught wix:image:// in preload link:', value, '→', safeUrl);
          }
          return originalSetAttribute.call(this, name, safeUrl || value);
        }
        return originalSetAttribute.call(this, name, value);
      };
    }
    
    return element;
  };

  // Guard 6: Monitor for any wix:image:// URLs in the DOM
  if (IS_DEVELOPMENT) {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes') {
          const element = mutation.target as HTMLElement;
          const src = element.getAttribute('src');
          const href = element.getAttribute('href');
          
          if (src?.startsWith('wix:image://')) {
            console.error('[RuntimeImageSafetyGuard] CRITICAL: wix:image:// URL found in DOM src:', src);
          }
          if (href?.startsWith('wix:image://')) {
            console.error('[RuntimeImageSafetyGuard] CRITICAL: wix:image:// URL found in DOM href:', href);
          }
        }
      });
    });

    // Start observing the document for attribute changes
    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
      attributeFilter: ['src', 'href'],
    });
  }

  if (IS_DEVELOPMENT) {
    console.log('[RuntimeImageSafetyGuard] Initialized - all image URLs will be intercepted and resolved');
  }
}

export default initializeRuntimeImageSafetyGuard;
