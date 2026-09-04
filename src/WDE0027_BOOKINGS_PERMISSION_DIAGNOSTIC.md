# WDE0027 Bookings Permission Error - Diagnostic & Resolution

## Problem Statement

Users encounter the error when loading bookings in the admin panel:
```
Failed to load bookings: WDE0027: The current user does not have permissions to read on the bookings collection.
```

## Root Cause Analysis

The `bookings` collection has **read: ADMIN** permissions, which means:
- Frontend code cannot read from it directly (permission denied)
- Backend code CAN read from it IF using `suppressAuth: true`
- `suppressAuth: true` is a **backend-only option** that bypasses permission checks

### Why Previous Attempts Failed

1. **Frontend-side suppressAuth doesn't work**
   - `BaseCrudService.getAll('bookings', {}, { suppressAuth: true })` called from frontend
   - Frontend code runs in the browser, which doesn't have elevated permissions
   - `suppressAuth` is ignored on the frontend - only works on backend

2. **Missing admin authentication gate**
   - Backend endpoints must verify admin session BEFORE using `suppressAuth`
   - Without this gate, anyone could call the endpoint and read all bookings

3. **Incomplete error logging**
   - Without detailed logging, it's hard to diagnose where the error occurs
   - Is it the frontend call? The backend endpoint? The CMS service?

## Solution Architecture

### 1. Backend Endpoint with Admin Gate (`/src/api/booking-availability/get-bookings.ts`)

```typescript
// Step 1: Verify admin session
const sessionToken = cookies?.get?.('admin_session')?.value;
const validation = sessionToken
  ? await verifyAdminToken(sessionToken)
  : { valid: false as const };

if (!validation.valid) {
  return 401 Unauthorized response;
}

// Step 2: Use suppressAuth on backend (where it works)
const results = await BaseCrudService.getAll<Bookings>(
  'bookings', 
  {}, 
  { limit: 500, suppressAuth: true }
);

// Step 3: Return data to frontend
return { success: true, data: results.items };
```

### 2. Frontend API Call (`/src/api/booking-availability.ts`)

```typescript
export async function getBookings(): Promise<{
  success: boolean;
  data?: Bookings[];
  error?: string;
}> {
  const response = await fetch('/api/booking-availability/get-bookings', {
    method: 'GET',
    credentials: 'include', // Sends admin_session cookie
  });
  
  const data = await response.json();
  return { success: data.success, data: data.data };
}
```

### 3. Frontend Component (`/src/components/BookingManagerPro.tsx`)

```typescript
const loadData = async () => {
  const bookingResult = await getBookings();
  
  if (!bookingResult.success) {
    addNotification('error', `Failed to load bookings: ${bookingResult.error}`);
  } else {
    setBookings(bookingResult.data || []);
  }
};
```

## How It Works

```
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Browser)                                          │
│ BookingManagerPro.tsx                                       │
│ ├─ Calls: getBookings()                                     │
│ └─ Sends: fetch('/api/booking-availability/get-bookings')  │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP GET + admin_session cookie
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Backend (Server)                                            │
│ /src/api/booking-availability/get-bookings.ts              │
│                                                             │
│ 1. Extract admin_session cookie                            │
│ 2. Verify token with verifyAdminToken()                    │
│ 3. If invalid → return 401 Unauthorized                    │
│ 4. If valid → proceed to step 5                            │
│ 5. Call BaseCrudService.getAll('bookings', {}, {           │
│      limit: 500,                                           │
│      suppressAuth: true  ← BACKEND-ONLY OPTION             │
│    })                                                       │
│ 6. Return { success: true, data: results.items }           │
└──────────────────────┬──────────────────────────────────────┘
                       │ HTTP 200 + JSON response
                       ▼
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Browser)                                          │
│ BookingManagerPro.tsx                                       │
│ ├─ Receives: { success: true, data: [...] }                │
│ └─ Updates: setBookings(data)                              │
└─────────────────────────────────────────────────────────────┘
```

## Key Implementation Details

### Admin Session Cookie

Set during login (`/src/pages/api/auth/admin-login.ts`):
```typescript
cookies.set('admin_session', sessionToken, {
  path: '/',
  httpOnly: true,      // Not accessible from JavaScript
  secure: true,        // HTTPS only
  sameSite: 'none',    // Cross-site iframe compatibility
  partitioned: true,   // Partitioned cookie for cross-site
  maxAge: 86400 * 7,   // 7 days
});
```

### Token Verification

Stateless HMAC-SHA256 signed tokens (`/src/lib/auth-security.ts`):
```typescript
export async function verifyAdminToken(token: string): Promise<{ valid: boolean; username?: string }> {
  // 1. Split token into payload and signature
  const [payloadB64, sigB64] = token.split('.');
  
  // 2. Recompute signature with SESSION_SECRET
  const expectedSig = await crypto.subtle.sign('HMAC', key, ...);
  
  // 3. Compare signatures (constant-time)
  if (!constantTimeEqual(sigB64, expectedSigB64)) {
    return { valid: false }; // Token tampered
  }
  
  // 4. Check expiry
  if (now > payload.exp) {
    return { valid: false }; // Token expired
  }
  
  return { valid: true, username: payload.username };
}
```

### suppressAuth Parameter

Only works on backend:
- **Frontend**: Ignored, permission check still applies
- **Backend**: Bypasses collection permission checks entirely

This is why the backend endpoint is required - we can't bypass permissions from the frontend.

## Debugging Checklist

If you still see WDE0027 errors:

1. **Check admin session cookie**
   ```javascript
   // In browser console
   document.cookie // Should contain 'admin_session=...'
   ```

2. **Check admin login**
   - Verify you're logged in to the admin panel
   - Check `/pages/api/auth/admin-login.ts` credentials

3. **Check backend endpoint logs**
   - Look for `[GET_BOOKINGS:...]` log messages
   - Should see: `✓ Admin authenticated as: Jordan310`
   - If not, token verification failed

4. **Check CMS service**
   - Verify `BaseCrudService` is imported from `@/integrations`
   - Verify `suppressAuth: true` is passed in options

5. **Check collection permissions**
   - In Wix Dashboard → Database → bookings collection
   - Verify `read: ADMIN` is set (not `read: ANYONE`)

## Files Modified

1. **`/src/api/booking-availability/get-bookings.ts`**
   - Enhanced logging with request IDs
   - Clear error detection for WDE0027
   - Detailed admin authentication flow

2. **`/src/api/booking-availability.ts`**
   - Frontend API wrapper for backend endpoint
   - Proper error handling and response parsing

3. **`/src/components/BookingManagerPro.tsx`**
   - Uses backend API instead of direct frontend call
   - Proper error notifications

## Related Documentation

- **WDE0027_BOOKINGS_PERMISSION_FIX.md** - Original fix implementation
- **auth-security.ts** - Token generation and verification
- **admin-login.ts** - Admin session creation

## Testing

1. **Login to admin panel**
   - Navigate to `/admin`
   - Enter credentials: `Jordan310` / `Iloveanna1!`

2. **Open Bookings tab**
   - Should load without WDE0027 error
   - Should display all bookings

3. **Check browser console**
   - Should see `[Frontend] Get bookings response status: 200`
   - Should NOT see WDE0027 errors

4. **Check server logs**
   - Should see `[GET_BOOKINGS:...] ✓ Admin authenticated as: Jordan310`
   - Should see `[GET_BOOKINGS:...] ✓ Successfully fetched X bookings`

## Future Improvements

1. **Generic admin data endpoint**
   - Create a reusable endpoint for any admin-only collection
   - Pattern: `/api/admin/data/:collectionId`

2. **Rate limiting**
   - Add rate limiting to admin endpoints
   - Prevent abuse of elevated permissions

3. **Audit logging**
   - Log all admin data access
   - Track who accessed what and when

4. **Caching**
   - Cache frequently accessed admin data
   - Reduce database load
