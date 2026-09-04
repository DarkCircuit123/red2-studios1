# Admin Authentication System Migration to Wix Members

## Overview

The admin authentication system has been migrated from a custom username/password approach to **Wix Members-based authentication**. This eliminates the dependency on `ADMIN_USERNAME` and `ADMIN_PASSWORD` Secrets Manager values and leverages Wix's native authentication infrastructure.

## Key Changes

### 1. Authentication Flow

**Old Flow:**
- User enters custom username/password
- Backend checks against `ADMIN_USERNAME` and `ADMIN_PASSWORD` secrets
- Custom session token generated and stored in httpOnly cookie

**New Flow:**
- User must be logged in via Wix Members (OAuth)
- Backend verifies member has admin role/permissions
- Admin session token generated and stored in httpOnly cookie
- All authorization checks remain server-side

### 2. Backend Changes

#### `/src/api/auth/admin-check.ts` (REPLACED)
- **Old:** Validated custom credentials against Secrets Manager
- **New:** Verifies Wix member session and checks admin role
- No longer requires `ADMIN_USERNAME` or `ADMIN_PASSWORD` secrets
- Checks member for admin role via:
  - `member.role === 'admin'`
  - `member.customFields?.isAdmin === true`
  - `member.tags?.includes('admin')`

#### `/src/api/auth/admin-verify.ts` (UPDATED)
- Now supports both legacy admin tokens (backward compatibility) and Wix member verification
- Falls back to `verifyMemberToken()` if admin token verification fails
- Returns member ID instead of username for Wix-based sessions

### 3. Frontend Changes

#### `/src/lib/adminAuthStore.ts` (UPDATED)
- `login()` function signature changed: no longer takes `username` and `password` parameters
- Now calls `/api/auth/admin-check` with empty body (uses Wix session from cookies)
- Stores `adminMemberId` instead of `adminUsername`
- All other functionality remains the same (logout, session verification, etc.)

#### `/src/components/AdminLoginModal.tsx` (REPLACED)
- **Old:** Username/password form
- **New:** Wix member login flow
  - Checks if user is logged in via Wix Members
  - If not logged in: shows "Log In with Wix" button
  - If logged in: shows member info and "Access Admin Panel" button
  - Verifies admin role before allowing access
  - Shows appropriate error messages for non-admin members

#### `/src/lib/auth-security.ts` (UPDATED)
- Added `verifyMemberToken()` function to verify Wix member sessions
- Imports Wix Members API and checks current member
- Determines admin status from member data
- Maintains backward compatibility with `verifyAdminToken()`

### 4. Security Model

**Server-Side Only:**
- All authorization checks happen in backend API routes
- Member role verification done via Wix Members API
- Admin session tokens are signed and verified server-side
- httpOnly cookies prevent client-side token access

**No Secrets Manager Dependency:**
- Removed dependency on `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- Uses Wix's built-in member authentication instead
- Admin status determined by member role/custom fields

**Session Management:**
- 30-minute session expiry (same as before)
- httpOnly, SameSite=Lax cookies
- Automatic verification on page load
- Explicit logout clears session cookie

## Implementation Details

### Admin Role Assignment

Members can be marked as admin in three ways:

1. **Member Role Field:** Set member's `role` to `"admin"`
2. **Custom Field:** Add custom field `isAdmin` set to `true`
3. **Member Tags:** Add `"admin"` tag to member

### API Endpoints

#### POST `/api/auth/admin-check`
- **Request:** Empty body (uses Wix session from cookies)
- **Response:** `{ authenticated: true, memberId: "...", sessionToken: "...", expiresAt: "..." }`
- **Errors:** 
  - `401` - Not logged in or invalid session
  - `403` - Logged in but not admin
  - `500` - Server error

#### POST `/api/auth/admin-verify`
- **Request:** Empty body (uses admin_session cookie)
- **Response:** `{ valid: true, memberId: "...", message: "..." }`
- **Logout:** Send `{ action: "logout" }` to clear session

### Frontend Integration

The admin panel flow remains unchanged:
1. User clicks settings/admin icon
2. If not authenticated: login modal opens
3. User logs in via Wix Members
4. Modal verifies admin role
5. Admin panel opens with full functionality
6. Upload/download functions work as before

## Migration Checklist

- [x] Replace custom credential validation with Wix member verification
- [x] Update admin-check endpoint to use Wix Members API
- [x] Update admin-verify endpoint to support both token types
- [x] Update adminAuthStore to remove username/password parameters
- [x] Replace AdminLoginModal with Wix member login flow
- [x] Add verifyMemberToken() to auth-security.ts
- [x] Maintain backward compatibility with existing admin tokens
- [x] Keep all authorization checks server-side
- [x] Preserve existing admin panel functionality
- [x] Preserve upload/download functions

## Testing

### Manual Testing Steps

1. **Login Flow:**
   - Click admin icon
   - Should see "Log In with Wix" button
   - Click to log in with Wix member account
   - Should see member info and "Access Admin Panel" button

2. **Admin Access:**
   - After login, click "Access Admin Panel"
   - Admin panel should open
   - All tabs (photos, music, etc.) should work

3. **Non-Admin Access:**
   - Log in with non-admin member account
   - Should see error: "Your account does not have admin permissions"

4. **Session Persistence:**
   - Log in and access admin panel
   - Refresh page
   - Should remain logged in (session verified from cookie)

5. **Logout:**
   - Click logout in admin panel
   - Session cookie should be cleared
   - Refresh page should show login modal

## Troubleshooting

### "Not logged in" Error
- Ensure user is logged in via Wix Members first
- Check browser cookies for Wix session

### "Insufficient permissions" Error
- Member account doesn't have admin role
- Add admin role/custom field to member in Wix Dashboard

### Session Verification Fails
- Check browser console for errors
- Verify SESSION_SECRET is configured in Secrets Manager
- Check that admin_session cookie is being set

## Backward Compatibility

- Legacy admin tokens (signed JWT format) still work
- admin-verify endpoint tries both token types
- Existing upload/download functions unchanged
- No breaking changes to admin panel UI

## Future Improvements

1. **Admin Role Management UI:** Create UI to assign admin roles to members
2. **Audit Logging:** Log all admin actions with member ID
3. **Multi-Factor Authentication:** Add MFA for admin accounts
4. **Session Timeout:** Add automatic session timeout with warning
5. **Admin Activity Dashboard:** Track admin actions and changes

## Notes

- All authorization checks remain in backend code only
- No credentials stored in frontend or localStorage
- Session tokens are httpOnly and tamper-proof
- Wix Members API provides OAuth-backed authentication
- Admin status is flexible and can be managed via multiple methods
