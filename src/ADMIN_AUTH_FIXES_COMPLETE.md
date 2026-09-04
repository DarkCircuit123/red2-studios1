# Admin Panel Authentication Fixes - Complete

## Root Cause
The admin panel renders inside a **cross-site iframe** on the Wix preview host. Browsers with third-party cookie blocking drop the `admin_session` cookie outright. Login returned 200 and the panel unlocked (trusting the response), but every subsequent request arrived with no cookie. The `requireAdmin` check saw no token and returned 401 on:
- Upload URL generation
- Media list endpoints  
- `/api/cms/mutate` (the write that makes uploads visible)

This caused both symptoms: uploads error AND when they appear to work, they never reflect on the site.

## Fixes Implemented

### 1. **New `readAdminToken()` Function** (`/src/lib/auth-security.ts`)
- Resolves signed token from **cookie first**, then **x-admin-session header**, then **Authorization: Bearer**
- Identical HMAC + expiry verification on every path
- Forged or tampered tokens still rejected
- Logs token source for debugging

### 2. **New `admin-fetch.ts` Utility** (`/src/lib/admin-fetch.ts`)
- `adminFetch()` sends credentials AND x-admin-session header
- `applyAdminAuthToXhr()` for progress-reporting XHR upload paths
- Token stored in sessionStorage with in-memory mirror for storage-blocked iframes
- `storeAdminToken()` and `clearAdminSession()` for lifecycle management

### 3. **Admin Login Returns Token** (`/src/pages/api/auth/admin-login.ts`)
- Response now includes signed token in JSON body
- Token can be used for header-based fallback when cookies blocked

### 4. **Updated All Auth Endpoints**
- **`/api/auth/admin-check.ts`**: Uses `readAdminToken()` to check cookie/header/bearer
- **`/api/cms/mutate.ts`**: Uses `readAdminToken()` for fallback auth
- **`/api/media/generate-upload-url.ts`**: Uses `requireAdmin()` with header fallback
- **`/api/media/import-from-url.ts`**: Added `requireAdmin()` gate (was open!)
- **`/api/media/upload-hero.ts`**: Uses `requireAdmin()` with header fallback

### 5. **AdminAuthProvider Token Storage** (`/src/components/AdminAuthProvider.tsx`)
- Stores token from login response in sessionStorage + memory
- Clears token on logout
- Handles storage-blocked iframes gracefully

### 6. **Syntax Error Fixed** (`/src/components/AdminPanel/sections/BehindTheScenesManager.tsx`)
- Removed stray `}` on line 193 that caused build failure
- File now parses clean

## Security Improvements
- **Media import endpoint** now gated (was accepting arbitrary URLs)
- **Signed tokens** with HMAC-SHA256 + expiry (stateless, survives edge node hops)
- **Constant-time comparison** prevents timing attacks
- **Token source logging** for debugging cross-site issues

## Still Required (Cannot Fix in Code)
1. **Rotate admin password** - Currently hardcoded in `src/pages/api/auth/admin-login.ts` and in git history
2. **Set SESSION_SECRET** - Tokens signed with fallback key committed to repository

## Testing Checklist
- [ ] Login works in cross-site iframe
- [ ] Uploads appear on site after save
- [ ] Admin panel persists across page reloads
- [ ] Logout clears session properly
- [ ] Media import requires admin auth
- [ ] Token fallback works when cookies blocked

## Files Modified
- `/src/lib/auth-security.ts` - Added `readAdminToken()`
- `/src/lib/admin-fetch.ts` - NEW utility for cross-site auth
- `/src/pages/api/auth/admin-login.ts` - Returns token in response
- `/src/pages/api/auth/admin-check.ts` - Uses `readAdminToken()`
- `/src/pages/api/cms/mutate.ts` - Uses `readAdminToken()`
- `/src/pages/api/media/generate-upload-url.ts` - Uses `requireAdmin()`
- `/src/api/media/import-from-url.ts` - Added auth gate
- `/src/api/media/upload-hero.ts` - Uses `requireAdmin()`
- `/src/components/AdminAuthProvider.tsx` - Stores token
- `/src/components/AdminPanel/sections/BehindTheScenesManager.tsx` - Fixed syntax error
