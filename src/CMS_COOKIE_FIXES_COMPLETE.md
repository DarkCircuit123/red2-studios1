# CMS Write Failures & Cross-Site Cookie Issues - FIXED

## Summary
Fixed 4 critical issues preventing admin CMS mutations and cross-site iframe cookie handling:

1. ✅ **Corrected cookie name** in mutate API validation
2. ✅ **Added await** to async token validation
3. ✅ **Implemented proper item merging** for CMS updates
4. ✅ **Added cross-site cookie flags** for iframe compatibility

---

## Issue 1: Silent CMS Write Failures - Root Cause Analysis

### The Problem
Admin saves were silently failing because the mutate API endpoint was checking for the wrong cookie name and not awaiting async validation.

### Root Causes Found

**A) Wrong Cookie Name**
- **Location**: `/src/pages/api/cms/mutate.ts` (line 31)
- **Was**: `cookies.get('adminToken')?.value` ❌
- **Now**: `cookies.get('admin_session')?.value` ✅
- **Why**: Admin login sets `admin_session` cookie, but mutate was reading `adminToken` which never existed
- **Result**: Every request got `undefined`, causing 401 Unauthorized silently

**B) Missing Await on Async Validation**
- **Location**: `/src/pages/api/cms/mutate.ts` (line 32)
- **Was**: `const validation = sessionToken ? verifyAdminToken(sessionToken) : null;` ❌
- **Now**: `const validation = sessionToken ? await verifyAdminToken(sessionToken) : null;` ✅
- **Why**: Without `await`, the code checked `!Promise` which is always `false`
- **Result**: Token was never actually validated; any non-empty cookie passed

### Fix Applied
```typescript
// BEFORE (broken)
const sessionToken = cookies.get('adminToken')?.value;
const validation = sessionToken ? verifyAdminToken(sessionToken) : null;
if (!validation?.valid) { /* 401 */ }

// AFTER (fixed)
const sessionToken = cookies.get('admin_session')?.value;
const validation = sessionToken ? await verifyAdminToken(sessionToken) : null;
if (!validation?.valid) { /* 401 */ }
```

---

## Issue 2: CMS Update Data Loss

### The Problem
When updating CMS items, only the fields sent in the request were saved. All other fields were blanked out.
- Example: Updating a sponsor's logo would wipe its name, description, etc.

### Root Cause
`items.update()` from `@wix/data` **replaces** the entire item, not merges.

### Fix Applied
**Location**: `/src/api/cms/mutate.ts` (lines 50-57)

```typescript
// BEFORE (data loss)
const result = await elevatedUpdate(request.collectionId, request.itemData);

// AFTER (proper merge)
const elevatedGet = auth.elevate(items.get);
const current = await elevatedGet(request.collectionId, itemId);
if (!current) {
  return { success: false, error: 'Item not found' };
}
const merged = { ...current, ...request.itemData, _id: itemId };
const result = await elevatedUpdate(request.collectionId, merged);
```

**How it works**:
1. Fetch the current item from CMS
2. Merge: `{ ...current, ...request.itemData, _id: itemId }`
3. Send the complete merged object to update
4. All fields preserved, only specified fields updated

---

## Issue 3: Cross-Site Cookie Issues

### The Problem
Admin session cookies weren't being sent from cross-site iframes (e.g., admin panel in iframe).
- Cookies were set but not sent on subsequent requests
- Admin would appear logged out in iframe context

### Root Causes
1. Missing `partitioned: true` flag for cross-site iframe cookies
2. Missing `secure: true` flag (required for `sameSite: 'none'`)
3. Logout wasn't clearing cookies with same flags

### Fixes Applied

**Location 1**: `/src/pages/api/auth/admin-login.ts` (lines 25-31)
```typescript
cookies.set('admin_session', sessionToken, {
  path: '/',
  httpOnly: true,
  secure: true,           // ✅ Added
  sameSite: 'none',
  partitioned: true,      // ✅ Added - enables cross-site iframe
  maxAge: 86400 * 7,
});
```

**Location 2**: `/src/pages/api/auth/admin-logout.ts` (lines 6-11)
```typescript
cookies.delete('admin_session', {
  path: '/',
  secure: true,           // ✅ Added
  sameSite: 'none',       // ✅ Added
  partitioned: true,      // ✅ Added
});
```

### Cookie Flags Explained
- **`partitioned: true`**: Enables "Partitioned Cookies" - allows cookies to work in cross-site iframe contexts
- **`secure: true`**: Cookie only sent over HTTPS (required when `sameSite: 'none'`)
- **`sameSite: 'none'`**: Cookie sent in cross-site requests (needed for iframe)
- **`httpOnly: true`**: Cookie not accessible to JavaScript (security)

---

## Testing Checklist

### 1. Admin Login
- [ ] Login with credentials
- [ ] Verify `admin_session` cookie is set with flags: `secure`, `sameSite=none`, `partitioned`
- [ ] Cookie persists across page reloads

### 2. CMS Mutations
- [ ] Create new CMS item - should succeed
- [ ] Update existing item (partial fields) - all fields should be preserved
- [ ] Delete CMS item - should succeed
- [ ] Verify no 401 errors in console

### 3. Cross-Site Iframe
- [ ] Load admin panel in iframe
- [ ] Login in iframe context
- [ ] Verify `admin_session` cookie is sent with requests
- [ ] Perform CMS mutations from iframe - should work

### 4. Admin Logout
- [ ] Click logout
- [ ] Verify `admin_session` cookie is deleted
- [ ] Verify cookie deletion includes all flags (secure, sameSite, partitioned)

---

## Files Modified

1. `/src/pages/api/cms/mutate.ts`
   - Fixed cookie name from `adminToken` to `admin_session`
   - Added `await` to `verifyAdminToken()` call
   - Implemented proper item merging for updates

2. `/src/pages/api/auth/admin-login.ts`
   - Added `secure: true` flag
   - Added `partitioned: true` flag

3. `/src/pages/api/auth/admin-logout.ts`
   - Added `secure: true` flag
   - Added `sameSite: 'none'` flag
   - Added `partitioned: true` flag

---

## Related Notes

### Why These Fixes Matter
1. **Silent Failures**: Without the cookie name fix, every admin request was silently rejected (401)
2. **Data Integrity**: Without item merging, updates would corrupt data by blanking fields
3. **Cross-Site Functionality**: Without partitioned cookies, admin panel wouldn't work in iframe

### Astro Config Note
The astro.config.mjs file currently uses explicit specifiers in `optimizeDeps.include` rather than globs, which is correct and doesn't need changes. Vite module loading is properly configured.

---

## Deployment Notes
- No database migrations needed
- No breaking changes to API
- Backward compatible with existing code
- Cookies are more secure with added flags
