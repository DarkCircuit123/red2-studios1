/**
 * CSP Configuration Fix for Wix Platform Integration
 * This file provides the corrected Content Security Policy settings
 * 
 * CRITICAL FIXES:
 * - Added 'wix:image' to img-src to allow Wix Media Manager image rendering
 * - Added 'https://static.parastorage.com' and '*.parastorage.com' to script-src for framewire script injection
 * - Added 'blob:' to img-src for blob URL support
 * - Added 'script-src-elem' for explicit script element loading
 * - Added 'unsafe-eval' for dynamic script evaluation
 * - Added 'wss:' for WebSocket connections
 * - Added 'https://*.wixapis.com' and 'https://*.wix.com' for Wix API calls
 * - Added 'https://maps.gstatic.com' for Google Maps static resources
 * - Added 'https://*.wix-code.com' for Wix Code integration
 */

export const CSP_DIRECTIVES = {
  'default-src': ["'self'"],
  'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://static.parastorage.com', 'https://*.parastorage.com', 'https://cdn.jsdelivr.net', 'https://maps.googleapis.com', 'https://maps.gstatic.com', 'https://*.wixapis.com', 'https://*.wix.com'],
  'script-src-elem': ["'self'", "'unsafe-inline'", 'https://static.parastorage.com', 'https://*.parastorage.com', 'https://cdn.jsdelivr.net', 'https://maps.googleapis.com', 'https://maps.gstatic.com'],
  'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com', 'https://static.parastorage.com', 'https://*.parastorage.com'],
  'img-src': ["'self'", 'data:', 'https:', 'blob:', 'wix:image', 'https://static.parastorage.com', 'https://*.parastorage.com'],
  'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:', 'https://static.parastorage.com', 'https://*.parastorage.com'],
  'connect-src': ["'self'", 'https://*.wixapis.com', 'https://*.wix.com', 'https://*.parastorage.com', 'https://*.wix-code.com', 'https://maps.googleapis.com', 'ws:', 'wss:'],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
} as const;

/**
 * Generate CSP header string from directives
 */
export function generateCSPHeader(): string {
  return Object.entries(CSP_DIRECTIVES)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');
}

/**
 * Apply CSP to document head
 */
export function applyCSPToHead(): void {
  if (typeof document === 'undefined') return;

  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = generateCSPHeader();
  document.head.appendChild(meta);
}

/**
 * Apply all security headers to document head
 */
export function applyAllSecurityHeaders(): void {
  if (typeof document === 'undefined') return;

  // CSP
  applyCSPToHead();

  // X-UA-Compatible
  const xUA = document.createElement('meta');
  xUA.httpEquiv = 'X-UA-Compatible';
  xUA.content = 'ie=edge';
  document.head.appendChild(xUA);

  // Referrer-Policy
  const referrer = document.createElement('meta');
  referrer.name = 'referrer';
  referrer.content = 'strict-origin-when-cross-origin';
  document.head.appendChild(referrer);

  // Permissions-Policy
  const permissions = document.createElement('meta');
  permissions.httpEquiv = 'Permissions-Policy';
  permissions.content = 'geolocation=(), microphone=(), camera=()';
  document.head.appendChild(permissions);
}
