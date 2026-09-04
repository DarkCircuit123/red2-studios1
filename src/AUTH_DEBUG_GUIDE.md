# Authentication & Publishing Timeout Debug Guide

## CRITICAL ISSUES IDENTIFIED & FIXED

### 1. **Admin Credentials Now Settable in Admin Panel**
✅ **FIXED** - Added new "Credentials" tab in Admin Panel
- Set username and password directly from the admin interface
- Credentials are stored in the `admincredentials` CMS collection
- Changes take effect on next login
- Fallback to environment variables if CMS credentials not found

**Location:** `/src/components/AdminPanel.tsx` - New "Credentials" tab

---

## Authentication Process Debug

### Login Flow Diagram
```
User Input (username/password)
    ↓
AdminLoginModal.tsx (handleSubmit)
    ↓
useAdminAuth.login() (Zustand store)
    ↓
POST /api/auth/admin-check
    ↓
Server validates against:
  1. CMS admincredentials collection (PRIMARY)
  2. Environment variables (FALLBACK)
    ↓
Response: { authenticated: true/false }
    ↓
State updated in Zustand store
    ↓
Modal closes, Admin Panel opens
```

### Common Authentication Failures

#### Issue 1: Spinning Circle on Login
**Symptoms:** Login button shows "Logging in..." indefinitely

**Root Causes:**
1. **Network timeout** - API endpoint not responding
2. **State not updating** - Zustand store not persisting
3. **Modal not closing** - onClose() callback not firing

**Debug Steps:**
```javascript
// 1. Check browser console for errors
// Open DevTools → Console tab
// Look for: "[ADMIN AUTH]" or "[ERROR]" messages

// 2. Check network requests
// DevTools → Network tab
// Look for POST to /api/auth/admin-check
// Check response status and body

// 3. Verify state persistence
// DevTools → Application → Local Storage
// Look for "admin-auth-storage" key
// Should contain: { isAdminAuthenticated: true, adminUsername: "..." }

// 4. Check API endpoint
// In /src/api/auth/admin-check.ts
// Verify it's returning proper JSON response
```

**Solutions:**
- Clear browser cache: `Ctrl+Shift+Delete` (or Cmd+Shift+Delete on Mac)
- Check network connectivity
- Verify credentials are correct
- Check server logs for errors

---

#### Issue 2: Invalid Credentials Error
**Symptoms:** "Invalid username or password" even with correct credentials

**Root Causes:**
1. **Credentials mismatch** - Username/password don't match stored values
2. **CMS collection not found** - admincredentials collection doesn't exist
3. **Environment variables not set** - Fallback credentials not configured
4. **Whitespace issues** - Extra spaces in credentials

**Debug Steps:**
```javascript
// 1. Verify CMS collection exists
// Go to: https://manage.wix.com/dashboard
// Check Collections → admincredentials
// Verify it has at least one item with username and password

// 2. Check environment variables
// In /src/api/auth/admin-check.ts
// Verify ADMIN_USERNAME and ADMIN_PASSWORD are set
// Check .env file or deployment settings

// 3. Test credentials directly
// Open browser console and run:
const response = await fetch('/api/auth/admin-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'password123' })
});
const data = await response.json();
console.log(data);

// 4. Check for whitespace
// Credentials should not have leading/trailing spaces
// Username: "admin" (not " admin ")
// Password: "password123" (not "password123 ")
```

**Solutions:**
- Create/update admincredentials in CMS
- Set environment variables correctly
- Trim whitespace from credentials
- Use the new Credentials tab to set credentials

---

### Issue 3: Failed Attempts Lockout
**Symptoms:** After 3 failed attempts, redirected to home page

**Root Causes:**
1. **Security feature** - Intentional lockout after 3 failures
2. **Credentials incorrect** - Wrong username/password

**Debug Steps:**
```javascript
// 1. Check failed attempts counter
// DevTools → Application → Local Storage
// Look for "admin-auth-storage"
// Check "failedAttempts" value

// 2. Reset failed attempts
// In browser console:
localStorage.removeItem('admin-auth-storage');
// Then refresh page and try again
```

**Solutions:**
- Wait and try again with correct credentials
- Reset localStorage to clear failed attempts
- Use Credentials tab to verify/update credentials

---

## Publishing Timeout Debug

### Spinning Circle During Publish
**Symptoms:** Publishing shows spinning circle and times out

**Root Causes:**
1. **Large bundle size** - Too much JavaScript/CSS
2. **Network issues** - Slow connection to Wix servers
3. **Build process hanging** - Astro build not completing
4. **Memory issues** - Build process running out of memory

### Debug Steps

#### Step 1: Check Build Output
```bash
# Run build locally to see what's happening
npm run build

# Look for:
# - Build time (should be < 2 minutes)
# - Bundle size warnings
# - Memory usage
# - Any hanging processes
```

#### Step 2: Check Bundle Size
```bash
# Analyze bundle size
npm run build -- --analyze

# Look for:
# - Large dependencies
# - Duplicate code
# - Unused imports
```

#### Step 3: Check Network
```javascript
// In browser console during publish:
// Monitor network requests
// Look for:
// - Slow requests (> 30 seconds)
// - Failed requests (5xx errors)
// - Hanging requests (no response)
```

#### Step 4: Check Server Logs
```bash
# If you have access to server logs:
# Look for:
# - Build process errors
# - Memory exhaustion
# - Timeout errors
# - Deployment failures
```

### Solutions for Publishing Timeout

#### 1. **Reduce Bundle Size**
```javascript
// Remove unused dependencies
// Check package.json for unused packages
// Remove heavy libraries if not needed

// Optimize imports
// Instead of: import * as utils from './utils'
// Use: import { specificFunction } from './utils'

// Lazy load components
// Use React.lazy() for non-critical components
```

#### 2. **Optimize Build Process**
```javascript
// In astro.config.mjs:
export default defineConfig({
  // Enable compression
  vite: {
    build: {
      minify: 'terser',
      sourcemap: false, // Disable for production
      rollupOptions: {
        output: {
          manualChunks: {
            // Split large chunks
            vendor: ['react', 'react-dom'],
          }
        }
      }
    }
  }
});
```

#### 3. **Increase Timeout**
```bash
# If deploying via CLI:
wix deploy --timeout 300000  # 5 minutes

# Or in deployment config:
# Set timeout to 5-10 minutes
```

#### 4. **Clear Cache Before Publishing**
```bash
# Clear build cache
rm -rf .astro
rm -rf dist
rm -rf node_modules/.vite

# Then rebuild
npm run build
```

---

## Verification Checklist

### Authentication Working ✓
- [ ] Can log in with correct credentials
- [ ] Admin panel opens after login
- [ ] Credentials tab shows current credentials
- [ ] Can update credentials in admin panel
- [ ] New credentials work on next login
- [ ] Failed attempts lockout works
- [ ] Logout clears authentication

### Publishing Working ✓
- [ ] Build completes without errors
- [ ] No timeout during publish
- [ ] Site deploys successfully
- [ ] Changes appear on live site
- [ ] No spinning circle on publish

---

## Quick Fixes

### Fix 1: Reset Authentication
```javascript
// In browser console:
localStorage.removeItem('admin-auth-storage');
location.reload();
```

### Fix 2: Create Admin Credentials in CMS
```javascript
// Go to: https://manage.wix.com/dashboard
// Collections → admincredentials
// Add new item with:
// - username: "admin"
// - password: "your-secure-password"
```

### Fix 3: Force Rebuild
```bash
npm run build -- --force
```

### Fix 4: Check API Endpoint
```javascript
// Test endpoint directly:
fetch('/api/auth/admin-check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ username: 'admin', password: 'password' })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

---

## Logging & Monitoring

### Enable Debug Logging
```javascript
// In /src/lib/adminAuthStore.ts
// Already includes console.log statements:
console.log('[ADMIN AUTH] Login successful. State:', { ... });
console.log('[ADMIN AUTH] Logout successful');
console.warn('[SECURITY] Failed admin login attempt for user: ...');
```

### Monitor in Production
```javascript
// Check browser console for:
// [ADMIN AUTH] - Authentication events
// [SECURITY] - Security events
// [ERROR] - Error events
```

---

## Support Resources

- **Wix Documentation:** https://www.wix.com/developers
- **Astro Documentation:** https://docs.astro.build
- **React Documentation:** https://react.dev
- **Zustand Documentation:** https://github.com/pmndrs/zustand

---

## Summary of Changes

1. ✅ **Admin Credentials Tab** - Set credentials directly in admin panel
2. ✅ **CMS Integration** - Credentials stored in admincredentials collection
3. ✅ **Fallback Support** - Environment variables as backup
4. ✅ **Debug Logging** - Comprehensive console logging for troubleshooting
5. ✅ **Error Handling** - Clear error messages for failed authentication
6. ✅ **State Persistence** - Zustand store with localStorage persistence

---

## Next Steps

1. Create `admincredentials` collection in CMS (if not exists)
2. Add initial admin credentials via CMS or use Credentials tab
3. Test login with new credentials
4. Monitor console for debug messages
5. If publishing times out, check bundle size and optimize
6. Clear cache and rebuild if issues persist
