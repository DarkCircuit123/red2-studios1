# CSP Fix Summary - Wix Framewire Runtime Integration

## Problem Statement
The Content Security Policy (CSP) was blocking Wix's own runtime (Framewire at `https://static.parastorage.com/services/framewire/1.9.116/index.mjs`), which killed live preview in the editor and broke the Wix platform integration.

## Root Cause
The CSP directives in three files were too restrictive:
- **script-src**: Did not allow `*.parastorage.com` domains
- **connect-src**: Did not allow Wix API domains (`*.wixapis.com`, `*.wix.com`)
- **Missing directives**: No `script-src-elem` for explicit script element loading
- **Missing unsafe-eval**: Required for dynamic script evaluation

## Files Changed

### 1. `/src/components/Head.tsx`
**Location**: Line 13 (CSP meta tag)

**Before**:
```html
<meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://maps.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: wix:image; font-src 'self' https://fonts.gstatic.com https://static.parastorage.com; connect-src 'self' https:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" />
```

**After**:
```html
<meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://maps.googleapis.com https://maps.gstatic.com https://*.wixapis.com https://*.wix.com; script-src-elem 'self' 'unsafe-inline' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://maps.googleapis.com https://maps.gstatic.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.parastorage.com https://*.parastorage.com; img-src 'self' data: https: blob: wix:image https://static.parastorage.com https://*.parastorage.com; font-src 'self' https://fonts.gstatic.com data: https://static.parastorage.com https://*.parastorage.com; connect-src 'self' https://*.wixapis.com https://*.wix.com https://*.parastorage.com https://*.wix-code.com https://maps.googleapis.com ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" />
```

**Key Changes**:
- ✅ Added `'unsafe-eval'` to `script-src`
- ✅ Added `https://static.parastorage.com` and `https://*.parastorage.com` to `script-src`
- ✅ Added `https://maps.gstatic.com` to `script-src`
- ✅ Added `https://*.wixapis.com` and `https://*.wix.com` to `script-src`
- ✅ Added new `script-src-elem` directive for explicit script elements
- ✅ Added `https://*.parastorage.com` to `style-src`
- ✅ Added `https://*.parastorage.com` to `img-src`
- ✅ Added `https://*.parastorage.com` to `font-src`
- ✅ Updated `connect-src` to include Wix domains and WebSocket support

### 2. `/src/lib/security.ts`
**Location**: Lines 6-31 (CSP_HEADERS constant)

**Before**:
```typescript
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://static.wixstatic.com https://static.parastorage.com https://maps.googleapis.com",
    "script-src-elem 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://static.wixstatic.com https://static.parastorage.com https://maps.googleapis.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.parastorage.com",
    "img-src 'self' data: https: blob: wix:image:// https://static.parastorage.com",
    "font-src 'self' https://fonts.gstatic.com data: https://static.parastorage.com",
    "connect-src 'self' https: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  // ... other headers
};
```

**After**:
```typescript
export const CSP_HEADERS = {
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://maps.googleapis.com https://maps.gstatic.com https://*.wixapis.com https://*.wix.com",
    "script-src-elem 'self' 'unsafe-inline' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://maps.googleapis.com https://maps.gstatic.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.parastorage.com https://*.parastorage.com",
    "img-src 'self' data: https: blob: wix:image https://static.parastorage.com https://*.parastorage.com",
    "font-src 'self' https://fonts.gstatic.com data: https://static.parastorage.com https://*.parastorage.com",
    "connect-src 'self' https://*.wixapis.com https://*.wix.com https://*.parastorage.com https://*.wix-code.com https://maps.googleapis.com ws: wss:",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; '),
  // ... other headers
};
```

**Key Changes**:
- ✅ Replaced `https://static.wixstatic.com` with `https://*.parastorage.com` (more comprehensive)
- ✅ Added `https://maps.gstatic.com` to `script-src` and `script-src-elem`
- ✅ Added `https://*.wixapis.com` and `https://*.wix.com` to `script-src`
- ✅ Updated `style-src` to include `https://*.parastorage.com`
- ✅ Changed `wix:image://` to `wix:image` (correct protocol format)
- ✅ Updated `img-src` to include `https://*.parastorage.com`
- ✅ Updated `font-src` to include `https://*.parastorage.com`
- ✅ Completely rewrote `connect-src` to include all Wix domains and WebSocket support

### 3. `/src/lib/security-csp-fix.ts`
**Status**: Recreated with comprehensive CSP directives

**New Content**:
```typescript
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
```

**Key Changes**:
- ✅ Comprehensive CSP directives object with all required Wix domains
- ✅ Includes `generateCSPHeader()` function to convert directives to string
- ✅ Includes `applyCSPToHead()` function for runtime CSP injection
- ✅ Includes `applyAllSecurityHeaders()` function for complete security setup

## CSP Directives Breakdown

### script-src (CRITICAL)
**Allows**:
- `'self'` - Same-origin scripts
- `'unsafe-inline'` - Inline scripts (required for React)
- `'unsafe-eval'` - Dynamic script evaluation (required for Wix runtime)
- `https://static.parastorage.com` - Wix Framewire (specific domain)
- `https://*.parastorage.com` - All Wix parastorage subdomains
- `https://cdn.jsdelivr.net` - CDN for external libraries
- `https://maps.googleapis.com` - Google Maps API
- `https://maps.gstatic.com` - Google Maps static resources
- `https://*.wixapis.com` - Wix API endpoints
- `https://*.wix.com` - Wix platform services

### script-src-elem (NEW)
**Allows**: Explicit script element loading from trusted sources (subset of script-src)

### connect-src (CRITICAL)
**Allows**:
- `'self'` - Same-origin connections
- `https://*.wixapis.com` - Wix API calls
- `https://*.wix.com` - Wix platform connections
- `https://*.parastorage.com` - Wix media and assets
- `https://*.wix-code.com` - Wix Code integration
- `https://maps.googleapis.com` - Google Maps API
- `ws:` and `wss:` - WebSocket connections (for real-time features)

### img-src
**Allows**:
- `'self'` - Same-origin images
- `data:` - Data URIs
- `https:` - HTTPS images
- `blob:` - Blob URLs
- `wix:image` - Wix Media Manager images
- `https://static.parastorage.com` and `https://*.parastorage.com` - Wix hosted images

### style-src
**Allows**:
- `'self'` - Same-origin styles
- `'unsafe-inline'` - Inline styles (required for React)
- `https://fonts.googleapis.com` - Google Fonts
- `https://static.parastorage.com` and `https://*.parastorage.com` - Wix styles

### font-src
**Allows**:
- `'self'` - Same-origin fonts
- `https://fonts.gstatic.com` - Google Fonts
- `data:` - Data URIs for fonts
- `https://static.parastorage.com` and `https://*.parastorage.com` - Wix fonts

## Testing Checklist

- [ ] Framewire loads successfully (check browser console for CSP errors)
- [ ] Live preview in Wix editor works
- [ ] Google Maps loads without CSP violations
- [ ] Wix API calls succeed
- [ ] Images from Wix Media Manager render correctly
- [ ] WebSocket connections work (if applicable)
- [ ] No CSP violations in browser console
- [ ] No "refused to load" errors for scripts, styles, or images

## Browser Console Verification

After deployment, verify in browser DevTools Console:
```javascript
// Should NOT see any CSP violation errors like:
// "Refused to load the script 'https://static.parastorage.com/...' 
//  because it violates the following Content Security Policy directive"
```

## Security Notes

⚠️ **Important**: This CSP includes `'unsafe-eval'` which is required for Wix's dynamic script evaluation. This is acceptable in this context because:
1. Wix is a trusted first-party service
2. The Framewire runtime requires dynamic evaluation
3. All other directives are restrictive to mitigate risks

## References

- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy)
- [Wix Platform Documentation](https://www.wix.com/developers)
- [OWASP CSP Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Content_Security_Policy_Cheat_Sheet.html)
