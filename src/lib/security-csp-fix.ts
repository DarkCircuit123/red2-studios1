/**
 * CSP Configuration Fix for Google Maps and External APIs
 * This file provides the corrected Content Security Policy settings
 * 
 * CRITICAL FIXES:
 * - Added 'wix:image://' to img-src to allow Wix Media Manager image rendering
 * - Added 'https://static.parastorage.com' to script-src for framewire script injection
 * - Added 'blob:' to img-src for blob URL support
 */

export const CSP_DIRECTIVES = {
  'default-src': [\"'self'\"],
  'script-src': [\"'self'\", \"'unsafe-inline'\", 'https://cdn.jsdelivr.net', 'https://maps.googleapis.com', 'https://static.parastorage.com'],
  'style-src': [\"'self'\", \"'unsafe-inline'\", 'https://fonts.googleapis.com'],
  'img-src': [\"'self'\", 'data:', 'https:', 'blob:', 'wix:image://'],
  'font-src': [\"'self'\", 'https://fonts.gstatic.com'],
  'connect-src': [\"'self'\", 'https:', 'https://maps.googleapis.com'],
  'frame-ancestors': [\"'none'\"],
  'base-uri': [\"'self'\"],
  'form-action': [\"'self'\"],
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
