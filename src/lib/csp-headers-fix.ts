/**
 * CSP Headers Configuration Fix
 * Addresses Content-Security-Policy violations for images, scripts, and frame-ancestors
 * 
 * PRODUCTION CSP POLICY:
 * - Strict default-src 'self' (no unsafe-inline, no unsafe-eval)
 * - script-src: Only self + Wix CDNs (no inline scripts, no FullStory, no base44)
 * - img-src: self + HTTPS + data: + blob: (for temporary previews)
 * - style-src: self + unsafe-inline (required for Tailwind/styled-components)
 * - font-src: self + Google Fonts
 * - connect-src: self + HTTPS (no FullStory APIs, no base44)
 * - frame-ancestors: allows Wix remote-code iframe for live preview
 * 
 * Issues Fixed:
 * 1. wix:image:// URLs are converted to HTTPS in Image component (not allowed in CSP)
 * 2. FullStory removed (not used in project, was causing CSP violations)
 * 3. base44.com removed (obsolete dependency, was causing 404 errors)
 * 4. frame-ancestors allows Wix preview/framewire framing
 * 5. Deprecated MouseEvent.mozInputSource warning
 */

import { initEventPolyfills } from './event-polyfills';

export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://*.wixapis.com https://*.wix.com",
    "script-src-elem 'self' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net",
    "img-src 'self' data: https: blob: https://static.parastorage.com https://*.parastorage.com https://static.wixstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.parastorage.com https://*.parastorage.com",
    "font-src 'self' https://fonts.gstatic.com https://static.parastorage.com https://*.parastorage.com",
    "connect-src 'self' https://*.wixapis.com https://*.wix.com https://*.parastorage.com https://*.wix-code.com ws: wss:",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'self' https://*.wix-code.com https://*.remote-machine.wix-code.com https://*.wix.com"
  ].join('; ')
};

/**
 * Initialize CSP fixes on page load
 */
export function initCSPFixes() {
  if (typeof window === 'undefined') return;

  // Initialize event polyfills for deprecated properties
  initEventPolyfills();
}
