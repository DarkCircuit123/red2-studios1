# Authentication UI & Admin Session Debugging Guide

## Overview
This document describes the complete authentication flow debugging that has been implemented to fix UI state issues and admin session management.

## Changes Made

### 1. **MemberProvider.tsx** - Logout Flow Enhancement
**File**: `/src/integrations/members/providers/MemberProvider.tsx`

**Changes**:
- Added comprehensive logging to the logout process
- Reordered logout steps to clear state FIRST before async operations
- Ensures localStorage is cleared immediately
- Logs each step of the logout process

**Key Logs**:
```
[LOGOUT] Starting logout process...
[LOGOUT] Cleared localStorage
[LOGOUT] Calling logout API...
[LOGOUT] Logout API succeeded
[LOGOUT] Redirecting to home...
```

**Why This Matters**:
- Prevents stale session state from being rendered
- Ensures React state updates immediately
- Clears localStorage before redirect to prevent rehydration of old state

### 2. **Header.tsx** - Auth State Monitoring
**File**: `/src/components/Header.tsx`

**Changes**:
- Added detailed logging to auth state changes
- Logs admin check triggers
- Logs logout button clicks
- Tracks admin state reset

**Key Logs**:
```
[HEADER] Auth state changed: { isAuthenticated, memberId, isAdmin, isAdminLoading, isMemberLoading }
[HEADER] Checking admin access for member: <memberId>
[HEADER] User logged out, resetting admin state
[HEADER] Logout button clicked
[HEADER] Calling memberActions.logout()...
[HEADER] Logout completed
```

**Why This Matters**:
- Helps identify when auth state changes
- Shows if admin check is being triggered
- Confirms logout flow completion

### 3. **wix-admin-access.ts** - Admin Check Logging
**File**: `/src/lib/wix-admin-access.ts`

**Changes**:
- Added logging for admin access checks
- Logs API response details
- Tracks admin state changes

**Key Logs**:
```
[ADMIN-ACCESS] Checking admin access for member: <memberId>
[ADMIN-ACCESS] Calling /api/auth/admin-check...
[ADMIN-ACCESS] Response: { status, data }
[ADMIN-ACCESS] Admin access granted for member: <memberId>
[ADMIN-ACCESS] Admin access denied: <reason>
[ADMIN-ACCESS] Error: <error message>
```

**Why This Matters**:
- Confirms admin check is being called
- Shows if backend verification succeeds/fails
- Helps debug permission issues

### 4. **Member Service** - Load Logging
**File**: `/src/integrations/members/service.ts`

**Changes**:
- Added logging for member loading
- Logs when member is found vs anonymous
- Tracks expected auth errors

**Key Logs**:
```
[MEMBER SERVICE] Loading current member...
[MEMBER SERVICE] Member loaded successfully: <memberId>
[MEMBER SERVICE] No member session found (anonymous user)
[MEMBER SERVICE] Expected auth error (no session)
[MEMBER SERVICE] Unexpected error loading member: <error>
```

**Why This Matters**:
- Confirms member loading is working
- Shows if user is authenticated or anonymous
- Helps identify unexpected errors

### 5. **MemberProvider.tsx** - Load Current Member Logging
**File**: `/src/integrations/members/providers/MemberProvider.tsx`

**Changes**:
- Added logging to loadCurrentMember action
- Logs member loaded state
- Tracks initialization

**Key Logs**:
```
[MEMBER PROVIDER] Loading current member...
[MEMBER PROVIDER] Member loaded: <memberId>
[MEMBER PROVIDER] No member found (anonymous user)
[MEMBER PROVIDER] Unexpected error: <error>
```

**Why This Matters**:
- Confirms member provider is initializing correctly
- Shows if member state is being set properly

## Expected Behavior After Fixes

### Logged-Out State (Visitor)
```
Browser Console:
[MEMBER SERVICE] Loading current member...
[MEMBER SERVICE] No member session found (anonymous user)
[MEMBER PROVIDER] Loading current member...
[MEMBER PROVIDER] No member found (anonymous user)
[HEADER] Auth state changed: { isAuthenticated: false, memberId: undefined, isAdmin: false, isAdminLoading: false, isMemberLoading: false }

UI:
- Shows ONLY Login icon
- No Logout button
- No Admin gear icon
```

### After Successful Login
```
Browser Console:
[MEMBER SERVICE] Loading current member...
[MEMBER SERVICE] Member loaded successfully: <memberId>
[MEMBER PROVIDER] Loading current member...
[MEMBER PROVIDER] Member loaded: <memberId>
[HEADER] Auth state changed: { isAuthenticated: true, memberId: <memberId>, isAdmin: false, isAdminLoading: true, isMemberLoading: false }
[HEADER] Checking admin access for member: <memberId>
[ADMIN-ACCESS] Checking admin access for member: <memberId>
[ADMIN-ACCESS] Calling /api/auth/admin-check...

UI:
- Shows Logout icon
- If admin: Shows animated gear icon + Logout
- If regular member: Shows only Logout
```

### After Logout
```
Browser Console:
[HEADER] Logout button clicked
[HEADER] Calling memberActions.logout()...
[LOGOUT] Starting logout process...
[LOGOUT] Cleared localStorage
[LOGOUT] Calling logout API...
[LOGOUT] Logout API succeeded
[LOGOUT] Redirecting to home...

UI:
- Redirects to home
- Shows ONLY Login icon
- No Logout button
- No Admin gear icon
```

## Debugging Steps

### Step 1: Check Member Loading
1. Open browser DevTools (F12)
2. Go to Console tab
3. Refresh the page
4. Look for `[MEMBER SERVICE]` and `[MEMBER PROVIDER]` logs
5. Verify you see either "Member loaded" or "No member found"

### Step 2: Check Auth State
1. Look for `[HEADER] Auth state changed` logs
2. Verify `isAuthenticated` matches expected state
3. Check if `isMemberLoading` is false (loading complete)

### Step 3: Check Admin Access (if logged in)
1. Look for `[ADMIN-ACCESS]` logs
2. Verify `/api/auth/admin-check` is being called
3. Check response status and data
4. Confirm `isAdmin` is set correctly

### Step 4: Check Logout Flow
1. Click Logout button
2. Look for `[LOGOUT]` logs in order
3. Verify localStorage is cleared
4. Verify redirect happens
5. After redirect, verify Login icon appears

## Common Issues & Solutions

### Issue: Logout button stays visible after logout
**Diagnosis**:
- Look for `[LOGOUT] Redirecting to home...` log
- If missing: logout API call failed
- If present: page didn't reload properly

**Solution**:
1. Check browser Network tab during logout
2. Verify `/api/auth/logout` returns 302 redirect
3. Check if redirect URL is correct

### Issue: Admin gear icon doesn't appear for admins
**Diagnosis**:
- Look for `[ADMIN-ACCESS] Admin access granted` log
- If missing: admin check failed
- If present: UI not updating

**Solution**:
1. Check `/api/auth/admin-check` response in Network tab
2. Verify response has `authenticated: true`
3. Check if member has admin role in Wix

### Issue: Login icon doesn't appear when logged out
**Diagnosis**:
- Look for `[MEMBER PROVIDER] No member found` log
- If missing: member loading failed
- If present: React state not updating

**Solution**:
1. Check if `isAuthenticated` is false in logs
2. Verify `isMemberLoading` is false
3. Check React DevTools for Header component state

### Issue: Stale session after logout
**Diagnosis**:
- Look for `[LOGOUT] Cleared localStorage` log
- If missing: localStorage not cleared
- If present: page rehydrated from old state

**Solution**:
1. Clear browser cache and localStorage manually
2. Verify logout clears `member-store` key
3. Check if page reload is happening

## Removing Debug Logs

Once authentication is working correctly, remove debug logs by:

1. **MemberProvider.tsx**: Remove all `console.log` calls in logout and loadCurrentMember
2. **Header.tsx**: Remove all `console.log` calls in useEffect hooks and handlers
3. **wix-admin-access.ts**: Remove all `console.log` calls in checkAdminAccess
4. **Member Service**: Remove all `console.log` calls in getCurrentMember
5. **MemberProvider.tsx**: Remove all `console.log` calls in loadCurrentMember

Search for `console.log('[` to find all debug logs.

## Testing Checklist

- [ ] Visitor sees only Login icon
- [ ] Clicking Login redirects to login page
- [ ] After login, Logout icon appears
- [ ] Admin sees gear icon + Logout
- [ ] Clicking Logout clears session
- [ ] After logout, Login icon appears
- [ ] No stale session state remains
- [ ] Console shows expected logs
- [ ] No infinite render loops
- [ ] Mobile menu shows correct buttons

## Production Deployment

Before deploying to production:

1. Remove all debug `console.log` statements
2. Test complete auth flow in staging
3. Verify admin check works with real Wix members
4. Test logout on multiple browsers
5. Verify no console errors
6. Check performance (no memory leaks)
7. Test on mobile devices
8. Verify accessibility (keyboard navigation)

## References

- **MemberProvider**: `/src/integrations/members/providers/MemberProvider.tsx`
- **Header**: `/src/components/Header.tsx`
- **Admin Access**: `/src/lib/wix-admin-access.ts`
- **Member Service**: `/src/integrations/members/service.ts`
- **Admin Check API**: `/src/api/auth/admin-check.ts`
- **Logout API**: `/src/api/auth/logout.ts`
