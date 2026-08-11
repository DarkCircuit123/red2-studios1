# Production Build Errors - Comprehensive Fixes

**Date:** 2026-08-11  
**Status:** Complete  
**Build Issue:** WebSocket connection interruption with multiple cascading errors

## Issues Addressed

### 1. **RubberBandCarouselSection.tsx - TypeError: can't access property "naturalWidth", img is null**

**Problem:**
- `handleImageLoad` callback was accessing `img.naturalWidth` without null-checking `e.currentTarget`
- React hook dependency array was incomplete, causing stale closures

**Fixes Applied:**
- Added null check: `if (!img) return;` before accessing `naturalWidth`
- Added `easeOutElastic` to `handleMouseLeave` dependency array to prevent stale function references
- Both changes ensure type safety and prevent runtime errors

**Files Modified:**
- `/src/components/sections/RubberBandCarouselSection.tsx`

**Code Changes:**
```typescript
// BEFORE: No null check
const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  const newWidth = img.naturalWidth || 1920; // Could crash if img is null
  // ...
}, []);

// AFTER: Null check + proper dependencies
const handleImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
  const img = e.currentTarget;
  if (!img) return; // Guard against null
  const newWidth = img.naturalWidth || 1920;
  // ...
}, []);

// Also fixed handleMouseLeave dependency array
const handleMouseLeave = useCallback(() => {
  // ...
}, [easeOutElastic]); // Added missing dependency
```

---

### 2. **CSP Violations - wix:image:// URLs and FullStory**

**Problem:**
- Browser CSP blocked `wix:image://` protocol (not HTTPS)
- FullStory domains were incomplete in CSP header
- Missing `blob:` in `img-src` for generated images

**Fixes Applied:**
- Updated CSP header in `astro.config.mjs` to allow FullStory domains:
  - `https://cdn.fullstory.com` (script)
  - `https://edge.fullstory.com` (script)
  - `https://api.fullstory.com` (connect)
  - `https://rs.fullstory.com` (connect)
- Added `blob:` to `img-src` for dynamically generated images
- Confirmed `convertWixImageToHttps()` is already being used to transform `wix:image://` URLs to HTTPS

**Files Modified:**
- `/src/astro.config.mjs` (CSP header)

**Code Changes:**
```javascript
// BEFORE: Incomplete CSP
headers: {
  'Content-Security-Policy': "default-src 'self'; ...; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.fullstory.com; connect-src 'self' https://api.fullstory.com; ...; img-src 'self' data: https:; ..."
}

// AFTER: Complete CSP with all FullStory domains
headers: {
  'Content-Security-Policy': "default-src 'self'; ...; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.fullstory.com https://edge.fullstory.com; connect-src 'self' https://api.fullstory.com https://edge.fullstory.com https://rs.fullstory.com; ...; img-src 'self' data: https: blob:; ..."
}
```

---

### 3. **MemberProvider.tsx - Graceful Handling of Anonymous Users**

**Problem:**
- 403 responses from Wix Members API for anonymous users were being treated as fatal errors
- Could cause infinite loops or authentication state corruption

**Current Implementation (Already Correct):**
- `getCurrentMember()` in `/src/integrations/members/service.ts` already:
  - Filters expected auth errors (403, 401, PERMISSION_DENIED)
  - Returns `null` for anonymous users (normal case)
  - Only logs unexpected errors
  - Never throws for expected cases

- `MemberProvider.tsx` already:
  - Initializes with `isLoading: true` to verify with server
  - Handles `null` member gracefully
  - Sets `isAuthenticated: false` for anonymous users
  - Uses `memberLoadInitiatedRef` to prevent duplicate calls in Strict Mode

**Verification:**
- No changes needed - implementation is production-ready
- 403 responses are expected and handled correctly

---

### 4. **Admin Token Verification - 401 Error in /api/auth/admin-verify**

**Problem:**
- SESSION_SECRET was using a fallback development secret in production
- This caused token verification failures when the environment variable wasn't set
- Tokens signed with one secret couldn't be verified with another

**Fixes Applied:**
- Modified `getSigningKey()` to throw an error if SESSION_SECRET is not configured
- Updated `signAdminToken()` to propagate the error (fail closed)
- Updated `verifyAdminToken()` to catch the error and return `{ valid: false }`
- Removed fallback secret entirely - production must have SESSION_SECRET configured

**Files Modified:**
- `/src/lib/auth-security.ts`

**Code Changes:**
```typescript
// BEFORE: Fallback secret in production
async function getSigningKey(): Promise<CryptoKey> {
  let secret = await readSecret('SESSION_SECRET');
  if (!secret) {
    console.warn('[SECURITY] SESSION_SECRET not found, using fallback secret');
    secret = 'dev-session-secret-change-in-production-12345678901234567890'; // WRONG!
  }
  // ...
}

// AFTER: Fail closed - no fallback
async function getSigningKey(): Promise<CryptoKey> {
  const secret = await readSecret('SESSION_SECRET');
  if (!secret) {
    console.error('[SECURITY] SESSION_SECRET not configured - token operations will fail');
    throw new Error('SESSION_SECRET environment variable is required for token signing');
  }
  // ...
}

// signAdminToken now throws if SESSION_SECRET is missing
export async function signAdminToken(username: string, ttlMs?: number): Promise<string> {
  // getSigningKey() throws if SESSION_SECRET not set
  const key = await getSigningKey(); // Will throw
  // ...
}

// verifyAdminToken catches the error and returns { valid: false }
export async function verifyAdminToken(token: string): Promise<{ valid: boolean; username?: string }> {
  try {
    let key: CryptoKey;
    try {
      key = await getSigningKey();
    } catch (err) {
      console.error('[TOKEN-VERIFY] Failed to get signing key:', err);
      return { valid: false }; // Graceful failure
    }
    // ...
  } catch (error) {
    console.error('[TOKEN-VERIFY] Exception during verification:', error);
    return { valid: false };
  }
}
```

**Required Action:**
- Ensure `SESSION_SECRET` environment variable is set in production
- If not set, admin authentication will fail with clear error messages

---

### 5. **Removed Ineffective Client-Side CSP Hacks**

**Problem:**
- `/src/lib/publishing-fix.ts` contained ineffective client-side CSP workarounds
- Attempted to intercept fetch, manipulate button clicks, and monitor CSP violations
- These hacks cannot override server-side CSP headers and were causing confusion

**Fixes Applied:**
- Deleted `/src/lib/publishing-fix.ts` entirely
- Removed import from `/src/components/AppRoot.tsx`
- Removed `initPublishingFixes()` call from initialization

**Files Modified:**
- Deleted: `/src/lib/publishing-fix.ts`
- Modified: `/src/components/AppRoot.tsx`

**Rationale:**
- Client-side code cannot override CSP headers set by the server
- The real fix is updating the CSP header itself (done in fix #2)
- Removing dead code reduces bundle size and confusion

---

## Summary of Changes

| File | Change | Reason |
|------|--------|--------|
| `RubberBandCarouselSection.tsx` | Added null check + dependency array fix | Prevent TypeError on image load |
| `astro.config.mjs` | Updated CSP header | Allow FullStory + blob images |
| `auth-security.ts` | Removed fallback secret, fail closed | Prevent token verification failures |
| `AppRoot.tsx` | Removed publishing-fix import | Clean up dead code |
| `publishing-fix.ts` | Deleted | Remove ineffective hacks |

---

## Production Deployment Checklist

- [ ] **Set SESSION_SECRET environment variable** - Required for admin token signing
  - Use a strong, random value (minimum 32 characters)
  - Store securely in environment configuration
  - Never commit to version control

- [ ] **Verify CSP header is deployed** - Check that updated `astro.config.mjs` is in production

- [ ] **Test admin authentication** - Verify login/logout works with new token verification

- [ ] **Monitor error logs** - Watch for any TOKEN-VERIFY or SIGNING-KEY errors

- [ ] **Test anonymous user access** - Verify public pages work for non-authenticated users

---

## Testing Recommendations

### Unit Tests
```typescript
// Test null handling in RubberBandCarouselSection
test('handleImageLoad guards against null img', () => {
  // Should not throw when img is null
});

// Test token verification with missing SESSION_SECRET
test('verifyAdminToken returns { valid: false } when SESSION_SECRET is missing', async () => {
  // Should not throw, should return { valid: false }
});
```

### Integration Tests
- Test admin login with valid SESSION_SECRET
- Test admin login with missing SESSION_SECRET (should fail gracefully)
- Test anonymous user access to public pages
- Test CSP compliance with browser DevTools

### Manual Testing
1. Clear browser cache and cookies
2. Reload homepage - should load without CSP errors
3. Test admin login - should work if SESSION_SECRET is set
4. Test carousel section - should load images without errors
5. Check browser console - should have no CSP violations

---

## References

- [Content Security Policy (MDN)](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [HMAC Token Signing Best Practices](https://tools.ietf.org/html/rfc2104)
- [React Hooks Rules](https://react.dev/reference/rules/rules-of-hooks)
- [Wix Members API](https://www.wix.com/velo/reference/wix-members)

---

## Notes

- All fixes follow strict production best practices
- Type safety is maintained throughout
- No breaking changes to public APIs
- Backward compatibility preserved where applicable
- Error messages are clear and actionable
