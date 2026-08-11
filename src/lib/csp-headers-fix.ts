/**
 * CSP Headers Configuration Fix
 * Addresses Content-Security-Policy violations for images, scripts, and frame-ancestors
 * 
 * PRODUCTION CSP POLICY:
 * - Strict default-src 'self' (no unsafe-inline, no unsafe-eval)
 * - script-src: Only self + FullStory CDN (no inline scripts)
 * - img-src: self + HTTPS + data: + blob: (for temporary previews)
 * - style-src: self + unsafe-inline (required for Tailwind/styled-components)
 * - font-src: self + Google Fonts
 * - connect-src: self + HTTPS + FullStory APIs
 * 
 * Issues Fixed:
 * 1. wix:image:// URLs are converted to HTTPS in Image component (not allowed in CSP)
 * 2. FullStory scripts loaded from CDN (allowed in script-src)
 * 3. frame-ancestors 'none' prevents clickjacking
 * 4. Deprecated MouseEvent.mozInputSource warning
 */

import { initEventPolyfills } from './event-polyfills';

export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://cdn.fullstory.com https://edge.fullstory.com",
    "img-src 'self' data: https: blob:",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https: wss: https://api.fullstory.com https://edge.fullstory.com https://rs.fullstory.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'"
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
