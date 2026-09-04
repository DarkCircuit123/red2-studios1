# Splash Screen Black Screen Debugging Guide

## Problem
The preview shows a black screen and doesn't load the homepage, even after previous fixes.

## Root Causes Identified

### 1. **API Filtering Issue**
- The `/api/cms/get-splashpage` endpoint was filtering ONLY for `isActive === true` items
- If no items in the Splashpage collection have `isActive` set to true, the API returns an empty array
- This causes both `LogoSplash` and `SplashScreen` to render nothing, leaving a black screen
- **Fix**: Added fallback logic to return all items if no active items are found

### 2. **Missing Logging**
- Without console logs, it's impossible to debug what's happening
- **Fix**: Added comprehensive console logging to trace the flow:
  - `[AppRoot]` - App initialization and splash state
  - `[LogoSplash]` - Logo fetch and rendering
  - `[SplashScreen]` - Logo fetch and rendering
  - `[DIAG]` - Diagnostic panel for real-time monitoring

### 3. **Timeout Too Short**
- The original 3-second fallback timeout might not be enough for slow networks
- **Fix**: Increased to 5 seconds

### 4. **No Visual Feedback**
- Users couldn't see if the app was stuck or working
- **Fix**: Added `SplashDiagnostics` component that shows real-time status in bottom-right corner

## Changes Made

### 1. `/src/api/cms/get-splashpage.ts`
- Added fallback logic: if no active items, return all items
- Ensures API always returns data if collection has any items

### 2. `/src/components/LogoSplash.tsx`
- Added console logging at each step
- Simplified logic to use first logo with image (API handles filtering)
- Better error handling

### 3. `/src/components/SplashScreen.tsx`
- Added console logging at each step
- Simplified logic to match LogoSplash
- Better error handling

### 4. `/src/components/AppRoot.tsx`
- Added console logging for splash state tracking
- Increased fallback timeout from 3s to 5s
- Added `SplashDiagnostics` component for real-time monitoring

### 5. `/src/components/SplashDiagnostics.tsx` (NEW)
- Real-time diagnostic panel in bottom-right corner
- Shows:
  - Component mount time
  - sessionStorage state
  - API endpoint test results
  - Number of items returned
  - Whether first item has logoImage

## How to Debug

### Step 1: Check Browser Console
Open DevTools (F12) and look for logs starting with:
- `[AppRoot]` - Shows splash state transitions
- `[LogoSplash]` - Shows logo fetch process
- `[SplashScreen]` - Shows splash screen process
- `[DIAG]` - Shows diagnostic information

### Step 2: Check Diagnostic Panel
Look at the bottom-right corner of the preview for the green diagnostic panel showing:
- Component mount time
- sessionStorage state
- API response status
- Number of items in collection
- Whether items have logoImage

### Step 3: Check API Directly
Open DevTools Network tab and look for `/api/cms/get-splashpage` request:
- Status should be 200
- Response should have `items` array
- Each item should have `logoImage` property

### Step 4: Check Splashpage Collection
Go to CMS and verify:
1. Splashpage collection has items
2. At least one item has a `logoImage` uploaded
3. Check if any items have `isActive` set to true
   - If none are active, the new fallback logic will use any item with an image

## Common Issues & Solutions

### Issue: Black screen persists
**Solution**: 
1. Check console for errors
2. Check diagnostic panel for API status
3. Verify Splashpage collection has items with images
4. Refresh the page

### Issue: API returns empty array
**Solution**:
1. Check if Splashpage collection has any items
2. If items exist but API returns empty, check if they have `logoImage` field populated
3. The new fallback logic should handle this - if it doesn't, check for API errors in console

### Issue: Logo doesn't load
**Solution**:
1. Check if `logoImage` URL is valid
2. Check if image is accessible (not blocked by CORS)
3. Check console for `convertWixImageToHttps` errors
4. Verify image URL format

### Issue: Splash screen never completes
**Solution**:
1. Check if `onComplete` callback is being called
2. Check if `handleSplashComplete` is being triggered
3. The 5-second fallback timeout should force completion
4. If still stuck, check for JavaScript errors in console

## Testing Checklist

- [ ] Open DevTools console
- [ ] Refresh preview
- [ ] Look for `[AppRoot] Checking splash state...` log
- [ ] Look for `[LogoSplash] Starting logo fetch...` or `[SplashScreen] Starting logo fetch...` log
- [ ] Look for `[DIAG] API response status: 200` in diagnostic panel
- [ ] Look for `[DIAG] API returned X items` showing at least 1 item
- [ ] Look for `[DIAG] First item has logoImage: true`
- [ ] Splash screen should display for ~2 seconds
- [ ] Homepage should load after splash completes
- [ ] Look for `[AppRoot] Splash completed, showing homepage` log

## If Still Black Screen

1. **Clear sessionStorage**: Open console and run:
   ```javascript
   sessionStorage.removeItem('splashScreenShown');
   location.reload();
   ```

2. **Check for JavaScript errors**: Look for red errors in console

3. **Check network requests**: Look at Network tab for failed requests

4. **Check API endpoint**: Try accessing `/api/cms/get-splashpage` directly in browser

5. **Check Splashpage collection**: Verify collection has data in CMS

6. **Force skip splash**: Temporarily modify AppRoot to skip splash:
   ```typescript
   setSplashComplete(true); // Add this immediately
   ```

## Performance Notes

- Logo fetch happens in parallel in both LogoSplash and SplashScreen
- This is intentional for redundancy - if one fails, the other might succeed
- The 5-second fallback ensures the app never gets stuck
- Diagnostic panel is lightweight and only runs on mount

## Next Steps

If the issue persists after these fixes:
1. Check if there are any JavaScript errors in the console
2. Verify the Splashpage collection has at least one item with an image
3. Check if the API endpoint is accessible
4. Try clearing browser cache and sessionStorage
5. Check if there are any network issues preventing the API call
