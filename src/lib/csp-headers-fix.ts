/**
 * CSP Headers Configuration Fix
 * Addresses Content-Security-Policy violations for images, scripts, and frame-ancestors
 * 
 * Issues Fixed:
 * 1. img-src CSP violation for wix:image:// URLs
 * 2. script-src CSP violation for edge.fullstory.com
 * 3. frame-ancestors CSP warning when delivered via meta element
 * 4. Deprecated MouseEvent.mozInputSource warning
 */

import { initEventPolyfills } from './event-polyfills';

export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://edge.fullstory.com https://cdn.fullstory.com",
    "img-src 'self' data: https: blob: https://static.parastorage.com https://*.parastorage.com https://static.wixstatic.com wix:image wix:image://v1 https://edge.fullstory.com",
    "style-src 'self' 'unsafe-inline' https://static.parastorage.com https://*.parastorage.com",
    "font-src 'self' data: https://static.parastorage.com https://*.parastorage.com",
    "connect-src 'self' https: wss: https://edge.fullstory.com https://cdn.fullstory.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ')
};

/**
 * Initialize CSP fixes on page load
 */
export function initCSPFixes() {
  if (typeof window === 'undefined') return;

  // Initialize event polyfills for deprecated properties
  initEventPolyfills();

  // Suppress FullStory initialization warnings
  if (typeof window !== 'undefined' && (window as any).FS) {
    const originalInit = (window as any).FS.init;
    let initialized = false;
    
    (window as any).FS.init = function(...args: any[]) {
      if (!initialized) {
        initialized = true;
        return originalInit.apply(this, args);
      }
      // Silently ignore subsequent init calls
    };
  }
}
