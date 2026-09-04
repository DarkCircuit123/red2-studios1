# CSP Frame-Ancestors Fix - Build Issues Resolution

## Problem Statement
The site was experiencing a critical Content-Security-Policy (CSP) violation:
```
Content-Security-Policy: The page's settings blocked the loading of a resource (frame-ancestors) 
at <unknown> because it violates the following directive: "frame-ancestors 'none'"
```

This error prevented the site from being embedded in the Wix environment, blocking the preview and live editing functionality.

## Root Cause Analysis
The CSP policy was configured with `frame-ancestors 'none'`, which explicitly prevents the page from being framed by ANY origin, including Wix's own domains. This is a security measure against clickjacking but was too restrictive for the Wix platform integration.

## Solution Implemented

### 1. Updated `/src/astro.config.mjs`
**File:** `/src/astro.config.mjs` (Line 118)

**Before:**
```javascript
'Content-Security-Policy': "default-src 'self'; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; script-src 'self' https://cdn.fullstory.com https://edge.fullstory.com; connect-src 'self' https://api.fullstory.com https://edge.fullstory.com https://rs.fullstory.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; frame-ancestors 'self' https://*.wix.com https://*.wix-code.com;"
```

**After:**
```javascript
'Content-Security-Policy': "default-src 'self'; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; script-src 'self' https://cdn.fullstory.com https://edge.fullstory.com; connect-src 'self' https://api.fullstory.com https://edge.fullstory.com https://rs.fullstory.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https: blob:; frame-ancestors 'self' https://*.wix.com https://*.wix-code.com https://*.remote-machine.wix-code.com;"
```

**Change:** Added `https://*.remote-machine.wix-code.com` to frame-ancestors directive to allow framing by Wix's remote machine environment (used for preview/development).

---

### 2. Updated `/src/pages/[...slug].astro`
**File:** `/src/pages/[...slug].astro` (Line 8)

**Before:**
```javascript
const cspHeader = "default-src 'self'; script-src 'self' https://cdn.fullstory.com https://edge.fullstory.com; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss: https://api.fullstory.com https://edge.fullstory.com https://rs.fullstory.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'";
```

**After:**
```javascript
const cspHeader = "default-src 'self'; script-src 'self' https://cdn.fullstory.com https://edge.fullstory.com; img-src 'self' data: https: blob:; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self' https: wss: https://api.fullstory.com https://edge.fullstory.com https://rs.fullstory.com; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self' https://*.wix.com https://*.wix-code.com https://*.remote-machine.wix-code.com";
```

**Change:** Updated frame-ancestors from `'none'` to allow Wix domains for framing.

---

### 3. Updated `/src/components/Head.tsx`
**File:** `/src/components/Head.tsx` (Line 13)

**Before:**
```jsx
<meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://*.wixapis.com https://*.wix.com; script-src-elem 'self' 'unsafe-inline' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.parastorage.com https://*.parastorage.com; img-src 'self' data: https: blob: https://static.parastorage.com https://*.parastorage.com https://static.wixstatic.com; font-src 'self' https://fonts.gstatic.com data: https://static.parastorage.com https://*.parastorage.com; connect-src 'self' https://*.wixapis.com https://*.wix.com https://*.parastorage.com https://*.wix-code.com https://upload.wixmp.com ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'" />
```

**After:**
```jsx
<meta httpEquiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net https://*.wixapis.com https://*.wix.com; script-src-elem 'self' 'unsafe-inline' https://static.parastorage.com https://*.parastorage.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://static.parastorage.com https://*.parastorage.com; img-src 'self' data: https: blob: https://static.parastorage.com https://*.parastorage.com https://static.wixstatic.com; font-src 'self' https://fonts.gstatic.com data: https://static.parastorage.com https://*.parastorage.com; connect-src 'self' https://*.wixapis.com https://*.wix.com https://*.parastorage.com https://*.wix-code.com https://upload.wixmp.com ws: wss:; frame-ancestors 'self' https://*.wix.com https://*.wix-code.com https://*.remote-machine.wix-code.com; base-uri 'self'; form-action 'self'" />
```

**Change:** Updated frame-ancestors to allow Wix framing in the meta tag as well.

---

## Allowed Domains for Framing

The updated CSP policy now allows the site to be framed by:

1. **`'self'`** - Same origin (the site itself)
2. **`https://*.wix.com`** - All Wix production domains
3. **`https://*.wix-code.com`** - Wix development/staging domains
4. **`https://*.remote-machine.wix-code.com`** - Wix remote machine environment (preview/development)

## Security Considerations

✅ **Security Maintained:**
- Frame-ancestors is still restricted to Wix domains only
- Prevents unauthorized framing by external sites
- Protects against clickjacking attacks from non-Wix sources
- Only allows framing by Wix's own infrastructure

## Additional Issues Addressed

### 1. Google Maps Loading Warning
**Status:** No active Google Maps implementation found in current codebase
- The warning about "Google Maps JavaScript API has been loaded directly without loading=async" appears to be from Wix's internal infrastructure
- Not caused by our application code
- No action required from our side

### 2. Unreachable Code Warnings
**Status:** These are from minified third-party libraries
- Warnings in `api.umd.min.js`, `app.bundle.min.js`, `hostScript.bundle.min.js`, `dealer-lightbox.bundle.min.js`
- These are Wix platform internal files, not our application code
- Not actionable from our codebase

### 3. 404 Errors for Internal Wix APIs
**Status:** Expected behavior
- `https://manage.wix.com/_api/wix-user-preferences-webapp/getVolatilePrefForSite/...` (404)
- These are Wix internal API calls that may not be available in all environments
- Do not impact site stability or functionality

### 4. Preload Resource Warnings
**Status:** Investigated
- Warnings about unused preload resources for React and header files
- These appear to be from Wix's internal preload strategy
- Not caused by our application code
- No redundant preloads found in our codebase

## Testing Recommendations

1. **Verify Wix Preview Works:**
   - Open the site in Wix Editor
   - Confirm preview loads without CSP frame-ancestors errors
   - Test live editing functionality

2. **Check Browser Console:**
   - Verify no CSP violations appear in console
   - Confirm frame-ancestors error is resolved

3. **Cross-Domain Testing:**
   - Verify site cannot be framed by non-Wix domains (security check)
   - Confirm Wix domains can frame the site

## Files Modified

| File | Change | Status |
|------|--------|--------|
| `/src/astro.config.mjs` | Updated CSP frame-ancestors | ✅ Complete |
| `/src/pages/[...slug].astro` | Updated CSP frame-ancestors | ✅ Complete |
| `/src/components/Head.tsx` | Updated CSP frame-ancestors | ✅ Complete |

## Deployment Notes

- Changes are backward compatible
- No breaking changes to functionality
- CSP policy is now more permissive for Wix framing while maintaining security
- All three CSP definition points are now synchronized

## References

- [MDN: Content-Security-Policy frame-ancestors](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Security-Policy/frame-ancestors)
- [OWASP: Clickjacking](https://owasp.org/www-community/attacks/Clickjacking)
- [Wix Platform Documentation](https://www.wix.com/developers)
