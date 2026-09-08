# Vite Cache & Hydration Fix Guide

## Issues Fixed

### 1. ✅ Module Import Error: `@wix/secrets`
**Status**: FIXED
- **File**: `/src/lib/auth-security.ts`
- **Issue**: Attempted to import `@wix/secrets` which is not available in the Wix environment
- **Solution**: Removed the import and the Wix Secrets Manager fallback logic
- **Impact**: `readSecret()` now reads from environment variables only, which is the standard approach for Wix

### 2. ⚠️ Vite Cache & Hydration Failures
**Status**: REQUIRES MANUAL CACHE CLEAR

The following errors indicate stale Vite cache:
```
[astro-island] Error hydrating /src/components/AppRoot.tsx 
TypeError: error loading dynamically imported module
```

**Root Cause**: Vite caches compiled dependencies in `node_modules/.cache/.vite/deps/`. When module imports change, the cache becomes invalid.

**Solution**: Clear the Vite cache by removing:
```bash
rm -rf node_modules/.cache
```

Then restart the development server:
```bash
npm run dev
```

## Verification Steps

1. **Check auth-security.ts imports**:
   ```bash
   grep -n "import.*@wix/secrets" src/lib/auth-security.ts
   ```
   Should return: **No matches** ✓

2. **Verify all admin endpoints still work**:
   - `/api/auth/admin-login` - Uses `signAdminToken()` ✓
   - `/api/auth/admin-check` - Uses `verifyAdminToken()` ✓
   - `/api/auth/admin-verify` - Uses `verifyAdminToken()` ✓

3. **Check for other @wix/secrets imports**:
   ```bash
   grep -r "@wix/secrets" src/
   ```
   Should return: **No matches** ✓

## Environment Variables Required

The following environment variables must be set in your Wix project:
- `SESSION_SECRET` - Used by `getSigningKey()` for token signing/verification
- `ADMIN_USERNAME` - Admin login username
- `ADMIN_PASSWORD_HASH` - Admin password hash

These are read via standard `process.env` access, which Wix provides automatically.

## Admin Authentication Flow (Preserved)

All existing admin authentication logic is preserved:

1. **Login** (`/api/auth/admin-login`):
   - Reads credentials from environment
   - Validates with constant-time comparison
   - Signs JWT token with SESSION_SECRET
   - Returns token to client

2. **Verification** (`/api/auth/admin-verify`):
   - Reads token from cookies or headers
   - Verifies HMAC signature
   - Checks token expiration
   - Returns admin status

3. **Protected Endpoints**:
   - All admin API endpoints use `requireAdmin()` middleware
   - Validates session token before allowing access

## RED2 Terminal Fixes (Preserved)

All RED2 terminal authentication and security fixes remain intact:
- PIN rotation system
- Client gallery access control
- Session token validation
- IP-based rate limiting

## Next Steps

1. Clear Vite cache: `rm -rf node_modules/.cache`
2. Restart dev server: `npm run dev`
3. Test admin login at `/admin`
4. Verify no console errors about module imports
5. Check that all admin endpoints respond correctly

## Troubleshooting

**If errors persist after cache clear:**

1. Clear all build artifacts:
   ```bash
   rm -rf node_modules/.cache dist .astro
   npm install
   npm run dev
   ```

2. Check for other @wix/secrets imports:
   ```bash
   grep -r "@wix/secrets" .
   ```

3. Verify package.json has all required dependencies:
   ```bash
   npm ls @radix-ui/react-* lucide-react framer-motion
   ```

4. Check browser console for specific hydration errors and report the exact module name

## Files Modified

- ✅ `/src/lib/auth-security.ts` - Removed @wix/secrets import and fallback logic

## Files Preserved

- ✅ All admin authentication endpoints
- ✅ All RED2 terminal security features
- ✅ All booking availability logic
- ✅ All portfolio management features
- ✅ All client gallery features
