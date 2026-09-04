# Black Screen Fix - Verification Guide

## Changes Made

I've implemented a comprehensive fix for the persistent black screen issue in the preview. Here's what was changed:

### 1. **AppRoot.tsx** - Added Preview Environment Detection
- **Issue**: The splash screen was blocking the app from rendering in preview environments
- **Fix**: Added `isPreviewEnvironment()` function that detects Framewire preview mode and localhost
- **Behavior**: In preview mode, the splash screen is bypassed entirely and the app shows immediately
- **Timeout**: Reduced fallback timeout from 5s to 3s, with a `forceShowApp` state that renders the app even if splash is stuck

### 2. **global.css** - Added Critical Visibility Overrides
- **Issue**: Some CSS rule might have been hiding the body or root element
- **Fix**: Added `!important` rules to ensure `html`, `body`, and `#root` are always visible:
  - `display: block !important`
  - `visibility: visible !important`
  - `opacity: 1 !important`
- **Impact**: Prevents any CSS from accidentally hiding the entire page

### 3. **AdminAuthProvider.tsx** - Reduced Timeout
- **Issue**: Session check was taking too long (5 seconds), delaying app render
- **Fix**: Reduced timeout from 5s to 3s
- **Impact**: App will fail faster and move on if the auth endpoint is slow

---

## How to Verify the Fix

### Step 1: Check Browser Console
Open DevTools (F12) and look for these log messages:

```
[AppRoot] Checking splash state...
[AppRoot] In preview environment: true  ← This should be TRUE in preview
[AppRoot] Splash was already shown or in preview, completing immediately
[AppRoot] Rendering - splashComplete: true forceShowApp: false
```

If you see `In preview environment: true`, the fix is working correctly.

### Step 2: Verify App Renders
- The preview should show the homepage content (not a black screen)
- You should see the Header, Hero section, and other page content
- If the splash screen appears briefly, that's normal on first load (it will be skipped on subsequent loads)

### Step 3: Check Session Storage
In DevTools Console, run:
```javascript
sessionStorage.getItem('splashScreenShown')
```

Should return: `"true"`

### Step 4: Test Refresh Behavior
- **First load**: Splash screen may appear briefly (1-2 seconds), then homepage
- **Subsequent loads**: Homepage should appear immediately (splash is skipped)
- **Hard refresh** (Ctrl+Shift+R): Clears session storage, splash may appear again

---

## If Black Screen Still Appears

### Diagnostic Steps

1. **Check for JavaScript Errors**
   - Open DevTools → Console tab
   - Look for red error messages
   - Take a screenshot and share the error

2. **Check Network Tab**
   - Open DevTools → Network tab
   - Reload the page
   - Look for failed requests (red X)
   - Check if `/api/auth/admin-verify` is timing out

3. **Check Application Tab**
   - Open DevTools → Application → Session Storage
   - Verify `splashScreenShown` is set to `true`
   - If not, the splash screen logic isn't completing

4. **Force Clear Everything**
   - Run in DevTools Console:
   ```javascript
   sessionStorage.clear()
   localStorage.clear()
   location.reload()
   ```

5. **Check if Preview is Detected**
   - Run in DevTools Console:
   ```javascript
   new URL(window.location.href).searchParams.has('framewire')
   new URL(window.location.href).searchParams.has('preview')
   window.location.hostname
   ```
   - Should show: `true` or `true` or `localhost`/`127.0.0.1`

---

## Expected Behavior After Fix

| Scenario | Expected Result |
|----------|-----------------|
| First load in preview | Brief splash (1-2s) → Homepage visible |
| Subsequent loads | Homepage visible immediately (splash skipped) |
| Hard refresh | Splash may appear again (session cleared) |
| Network error | Fallback timeout (3s) → Homepage visible anyway |
| Preview environment | Splash skipped entirely, homepage immediate |

---

## Rollback Instructions

If the fix causes issues, revert these files:
1. `/src/components/AppRoot.tsx` - Remove preview detection logic
2. `/src/styles/global.css` - Remove visibility overrides
3. `/src/components/AdminAuthProvider.tsx` - Revert timeout to 5s

---

## Technical Details

### Preview Environment Detection
```typescript
function isPreviewEnvironment(): boolean {
  const url = new URL(window.location.href);
  const isFramewire = url.searchParams.has('framewire') || url.searchParams.has('preview');
  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
  return isFramewire || isLocalhost;
}
```

This function checks:
- URL parameters for `framewire` or `preview` (Wix preview mode)
- Hostname for `localhost` or `127.0.0.1` (local development)

### Fallback Timeout Logic
```typescript
const fallbackTimer = setTimeout(() => {
  console.log('[AppRoot] Fallback timeout triggered, forcing splash completion');
  setSplashComplete(true);
  setForceShowApp(true);
  sessionStorage.setItem('splashScreenShown', 'true');
}, 3000); // 3 seconds
```

If the splash screen doesn't complete within 3 seconds, the app will force-render anyway.

---

## Next Steps

1. **Refresh the preview** - You should see the homepage immediately
2. **Check the console** - Verify the log messages show preview environment detected
3. **Test multiple times** - First load may show splash, subsequent loads should be instant
4. **Report any errors** - If you still see black screen, share the console errors

