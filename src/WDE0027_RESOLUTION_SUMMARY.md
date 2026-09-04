# WDE0027 Bookings Permission Error - Complete Resolution Summary

## Issue
Users encounter permission error when loading bookings in the admin panel:
```
Failed to load bookings: WDE0027: The current user does not have permissions to read on the bookings collection.
```

## Root Cause
The `bookings` collection has **read: ADMIN** permissions. The frontend cannot read from it directly. The backend CAN read from it using `suppressAuth: true`, but this option only works on the server side, not in browser code.

## Solution Overview

The fix uses a **three-layer architecture**:

1. **Admin Authentication Layer** - Verify admin session before allowing access
2. **Backend Permission Bypass Layer** - Use `suppressAuth: true` on the server
3. **Frontend API Wrapper Layer** - Call backend endpoint instead of direct CMS access

## Implementation Details

### Layer 1: Backend Endpoint with Admin Gate
**File:** `/src/api/booking-availability/get-bookings.ts`

```typescript
export async function GET({ request, cookies }: { request: Request; cookies: any }) {
  // 1. Extract admin_session cookie
  const sessionToken = cookies?.get?.('admin_session')?.value;
  
  // 2. Verify token signature and expiry
  const validation = sessionToken
    ? await verifyAdminToken(sessionToken)
    : { valid: false };
  
  // 3. Reject if not authenticated
  if (!validation.valid) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized' }),
      { status: 401, headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  // 4. Use suppressAuth on backend (where it works)
  const results = await BaseCrudService.getAll<Bookings>(
    'bookings', 
    {}, 
    { limit: 500, suppressAuth: true }
  );
  
  // 5. Return data to frontend
  return new Response(
    JSON.stringify({
      success: true,
      data: results.items || [],
      totalCount: results.totalCount || 0,
      hasNext: results.hasNext || false
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Key Points:**
- Admin session verified BEFORE using `suppressAuth`
- `suppressAuth: true` bypasses collection permission checks on backend
- Detailed logging for debugging
- Proper error handling with WDE0027 detection

### Layer 2: Frontend API Wrapper
**File:** `/src/api/booking-availability.ts`

```typescript
export async function getBookings(): Promise<{
  success: boolean;
  data?: Bookings[];
  error?: string;
}> {
  try {
    console.log('[Frontend] Fetching bookings');
    
    // Call backend endpoint with admin_session cookie
    const response = await fetch('/api/booking-availability/get-bookings', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // Sends admin_session cookie automatically
    });
    
    console.log('[Frontend] Get bookings response status:', response.status);
    
    let data;
    try {
      data = await safeJson(response);
    } catch (parseError) {
      return {
        success: false,
        error: parseError instanceof Error ? parseError.message : 'Server returned invalid response',
      };
    }
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to fetch bookings',
      };
    }
    
    return { success: data.success, data: data.data };
  } catch (error) {
    console.error('[Frontend] Error fetching bookings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
```

**Key Points:**
- `credentials: 'include'` sends admin_session cookie with request
- Proper error handling and response parsing
- Detailed logging for debugging

### Layer 3: Frontend Component
**File:** `/src/components/BookingManagerPro.tsx`

```typescript
const loadData = async () => {
  try {
    setIsLoading(true);
    
    // Fetch using backend API
    const bookingResult = await getBookings();
    
    if (!bookingResult.success) {
      console.error('Error fetching bookings:', bookingResult.error);
      addNotification('error', `Failed to load bookings: ${bookingResult.error}`);
      setBookings([]);
    } else {
      setBookings(bookingResult.data || []);
    }
  } catch (error) {
    console.error('Error loading data:', error);
    addNotification('error', `Failed to load booking data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    setIsLoading(false);
  }
};
```

**Key Points:**
- Calls `getBookings()` instead of direct CMS access
- Proper error handling and user notifications
- Loading state management

## Data Flow

```
┌──────────────────────────────────────────────────────────────┐
│ 1. Admin Panel Login                                         │
│ ├─ User enters: Jordan310 / Iloveanna1!                      │
│ ├─ POST /api/auth/admin-login                               │
│ └─ Response: admin_session cookie (httpOnly, secure)        │
└──────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 2. Bookings Tab Opened                                       │
│ ├─ BookingManagerPro.tsx mounts                             │
│ ├─ useEffect calls loadData()                               │
│ └─ loadData() calls getBookings()                            │
└──────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 3. Frontend API Call                                         │
│ ├─ fetch('/api/booking-availability/get-bookings')          │
│ ├─ credentials: 'include' (sends admin_session cookie)      │
│ └─ Browser automatically includes cookie in request         │
└──────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 4. Backend Endpoint Processing                              │
│ ├─ Extract admin_session cookie from request                │
│ ├─ Call verifyAdminToken(sessionToken)                      │
│ ├─ Verify HMAC signature with SESSION_SECRET                │
│ ├─ Check token expiry                                       │
│ ├─ If invalid → return 401 Unauthorized                     │
│ └─ If valid → proceed to step 5                             │
└──────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 5. Backend CMS Access                                        │
│ ├─ Call BaseCrudService.getAll('bookings', {}, {            │
│ │    limit: 500,                                            │
│ │    suppressAuth: true  ← BACKEND-ONLY OPTION              │
│ │  })                                                        │
│ ├─ suppressAuth bypasses collection permission checks       │
│ ├─ Wix returns all bookings data                            │
│ └─ No WDE0027 error because suppressAuth works on backend   │
└──────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 6. Response to Frontend                                      │
│ ├─ HTTP 200 OK                                              │
│ ├─ JSON: { success: true, data: [...], totalCount: N }      │
│ └─ Browser receives response                                │
└──────────────────────────────────────────────────────────────┘
                           ▼
┌──────────────────────────────────────────────────────────────┐
│ 7. Frontend UI Update                                        │
│ ├─ getBookings() returns { success: true, data: [...] }     │
│ ├─ BookingManagerPro.tsx receives data                      │
│ ├─ setBookings(data) updates state                          │
│ └─ Component re-renders with bookings list                  │
└──────────────────────────────────────────────────────────────┘
```

## Why This Works

### The Problem with Frontend-Only Approach
```typescript
// ❌ WRONG - This doesn't work
// Called from browser (frontend)
const results = await BaseCrudService.getAll('bookings', {}, { 
  suppressAuth: true  // ← Ignored on frontend!
});
// Result: WDE0027 permission error because suppressAuth doesn't work in browser
```

### Why Backend Approach Works
```typescript
// ✅ CORRECT - This works
// Called from server (backend)
const results = await BaseCrudService.getAll('bookings', {}, { 
  suppressAuth: true  // ← Works on backend!
});
// Result: Success! suppressAuth bypasses permission checks on server
```

## Key Concepts

### suppressAuth Option
- **What it does:** Bypasses collection permission checks
- **Where it works:** Backend only (server-side code)
- **Where it doesn't work:** Frontend (browser code)
- **Why:** Frontend code runs in user's browser with user's permissions. Backend code runs on server with elevated permissions.

### Admin Session Cookie
- **Name:** `admin_session`
- **Value:** HMAC-SHA256 signed token with username and expiry
- **Attributes:** httpOnly, secure, sameSite=none, partitioned
- **Lifetime:** 7 days
- **Verification:** Stateless (no database lookup needed)

### Token Verification
- **Algorithm:** HMAC-SHA256
- **Secret:** `SESSION_SECRET` environment variable
- **Checks:** Signature validity + expiry time
- **Timing:** Constant-time comparison to prevent timing attacks

## Debugging Guide

### If You Still See WDE0027 Errors

**Step 1: Check Admin Session Cookie**
```javascript
// In browser console
document.cookie
// Should contain: admin_session=<token>
```

**Step 2: Check Admin Login**
- Verify credentials in `/src/pages/api/auth/admin-login.ts`
- Default: `Jordan310` / `Iloveanna1!`

**Step 3: Check Backend Logs**
- Look for `[GET_BOOKINGS:...]` messages
- Should see: `✓ Admin authenticated as: Jordan310`
- If not, token verification failed

**Step 4: Check Browser Network Tab**
- Open DevTools → Network tab
- Click on `/api/booking-availability/get-bookings` request
- Check response status (should be 200)
- Check response body (should have `success: true`)

**Step 5: Check Collection Permissions**
- Go to Wix Dashboard → Database → bookings
- Verify `read: ADMIN` is set
- If `read: ANYONE`, permission bypass isn't needed

### Common Issues

| Issue | Cause | Solution |
|-------|-------|----------|
| 401 Unauthorized | No admin session cookie | Log in to admin panel first |
| 401 Unauthorized | Invalid/expired token | Log in again |
| WDE0027 error | suppressAuth not working | Check backend endpoint logs |
| Empty bookings list | No bookings in database | Add test bookings first |
| Network error | Backend endpoint not found | Check route export in `/src/pages/api/booking-availability/get-bookings.ts` |

## Files Modified

1. **`/src/api/booking-availability/get-bookings.ts`**
   - Enhanced with detailed logging
   - WDE0027 error detection
   - Request ID tracking

2. **`/src/api/booking-availability.ts`**
   - Already had correct implementation
   - Uses backend endpoint

3. **`/src/components/BookingManagerPro.tsx`**
   - Already uses `getBookings()` function
   - Proper error handling

4. **`/src/pages/api/booking-availability/get-bookings.ts`**
   - Route export (already exists)

## Testing Checklist

- [ ] Log in to admin panel with correct credentials
- [ ] Navigate to Bookings tab
- [ ] No WDE0027 error appears
- [ ] Bookings list loads successfully
- [ ] Browser console shows no errors
- [ ] Network tab shows 200 response from `/api/booking-availability/get-bookings`
- [ ] Server logs show `✓ Admin authenticated` message

## Related Documentation

- **WDE0027_BOOKINGS_PERMISSION_FIX.md** - Original implementation details
- **WDE0027_BOOKINGS_PERMISSION_DIAGNOSTIC.md** - Detailed diagnostic guide
- **auth-security.ts** - Token generation and verification implementation
- **admin-login.ts** - Admin session creation

## Summary

The WDE0027 error is resolved by:

1. **Authenticating the admin** - Verify admin session before allowing access
2. **Using backend-only suppressAuth** - Bypass permissions on the server, not the browser
3. **Proper error handling** - Detect and log permission errors for debugging

This architecture ensures:
- ✅ Bookings can be read by authenticated admins
- ✅ Unauthenticated users cannot access bookings
- ✅ Permission checks are properly bypassed on the backend
- ✅ Detailed logging helps diagnose issues
- ✅ Secure token-based authentication
