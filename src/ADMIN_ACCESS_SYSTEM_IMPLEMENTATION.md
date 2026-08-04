# Admin Access System Implementation

## Overview
This document describes the new secure admin access system that uses Wix Members authentication with backend permission verification.

## Architecture

### 1. **Authentication Flow**
- **Wix Members**: Primary authentication mechanism
- **Backend Verification**: `/api/auth/verify-admin-role` endpoint checks admin permissions
- **Frontend State**: `useWixAdminAccess` hook manages admin access state

### 2. **Components**

#### Header.tsx
- **Gear Icon**: Only visible to authenticated Wix Members
- **Behavior**:
  - Hidden for logged-out users
  - Visible but disabled for non-admin members
  - Fully functional for admin members
- **Hover Animation**: Subtle 90° rotation on hover
- **Click Behavior**:
  - Admin: Opens admin panel directly
  - Non-admin: Navigates to `/admin` (shows permission denied)
  - Not logged in: Redirects to home

#### AdminAccessGate.tsx
- **Purpose**: Wraps admin content with security checks
- **Features**:
  - Verifies Wix Member authentication
  - Checks admin role via backend
  - Shows loading state during verification
  - Shows permission denied message for unauthorized users
  - Prevents access to admin content without proper authorization

#### AdminPage.tsx
- **Route**: `/admin`
- **Protection**: 
  - Wrapped in `MemberProtectedRoute` (Wix Members auth)
  - Wrapped in `AdminAccessGate` (admin role verification)
- **Behavior**:
  - Shows loading spinner while checking permissions
  - Shows permission denied for non-admin members
  - Opens admin dashboard for authorized admins

### 3. **Backend Verification**

#### /api/auth/verify-admin-role
- **Method**: POST
- **Purpose**: Verify if authenticated member has admin role
- **Parameters**:
  - `memberId`: The Wix Member ID to verify
- **Response**:
  ```json
  {
    "isAdmin": boolean,
    "memberId": string,
    "memberEmail": string,
    "status": number
  }
  ```
- **Security**: 
  - Requires authorization header
  - Validates member exists
  - Checks admin role/status
  - Returns 401 if unauthorized

### 4. **State Management**

#### useWixAdminAccess Hook
- **Location**: `/src/lib/wix-admin-access.ts`
- **State**:
  - `isAdmin`: Boolean indicating admin status
  - `isLoading`: Boolean for loading state
  - `error`: Error message if verification fails
  - `memberId`: Current member ID
  - `memberEmail`: Current member email
- **Methods**:
  - `checkAdminAccess(memberId)`: Verify admin role
  - `clearError()`: Clear error messages
  - `reset()`: Reset all state

### 5. **Routing**

#### Router.tsx Changes
- **Admin Route**: `/admin`
- **Protection**: 
  1. `MemberProtectedRoute` - Requires Wix Member login
  2. `AdminAccessGate` - Requires admin role
- **Fallback**: Shows permission denied or redirects to home

## User Experience

### Logged Out User
1. No gear icon visible in header
2. Cannot access `/admin` route
3. Redirected to sign-in if attempting direct access

### Logged In Non-Admin User
1. Gear icon visible but dimmed (opacity-40)
2. Clicking gear icon navigates to `/admin`
3. Sees "Permission Denied" message
4. Cannot access admin panel

### Logged In Admin User
1. Gear icon visible and highlighted (primary color)
2. Clicking gear icon opens admin panel directly
3. Full access to all admin features
4. Can close panel and return to site

## Security Features

### Frontend Security
- Gear icon only visible to authenticated members
- Admin panel requires both authentication and authorization
- Loading states prevent UI flashing
- Permission denied message for unauthorized access

### Backend Security
- `/api/auth/verify-admin-role` endpoint validates member
- Authorization header required
- Member existence verified
- Admin role checked server-side
- No client-side permission checks alone

### Best Practices
- Never rely on frontend checks alone
- Backend verification is mandatory
- Proper error handling and logging
- Loading states during verification
- Clear permission denied messages

## Admin Panel Features

### Currently Active
- **Home Page Tab**: 
  - Hero image upload
  - About section image
  - Contact background image
  - Background music management
  - Text editing
  - Live preview

### Available Tabs
- Photos: Image management
- Portfolio: Portfolio item images
- Sponsors: Sponsor logos
- Music: Background music settings
- About: About section content
- Text: Site title and tagline
- Health: Media health monitoring
- Data: Data management
- Bookings: Booking management
- Test: Upload testing

## Implementation Details

### File Structure
```
src/
├── api/auth/
│   └── verify-admin-role.ts          # Backend verification endpoint
├── components/
│   ├── Header.tsx                     # Updated with Wix Members auth
│   ├── AdminAccessGate.tsx            # New: Security gate component
│   ├── AdminPanel.tsx                 # Updated: Removed old auth
│   └── pages/
│       └── AdminPage.tsx              # Updated: New protected route
├── lib/
│   └── wix-admin-access.ts            # New: Admin access hook
└── components/
    └── Router.tsx                     # Updated: Admin route protection
```

### Key Changes
1. **Removed**: `useSimpleAdminAuth` (old hardcoded credentials)
2. **Removed**: `SimpleAdminLoginModal` (no longer needed)
3. **Removed**: `useAdminAuth` (old admin store)
4. **Added**: `useWixAdminAccess` (Wix Members-based)
5. **Added**: `AdminAccessGate` (security wrapper)
6. **Updated**: Header to use Wix Members
7. **Updated**: AdminPage with proper protection
8. **Updated**: Router with new route structure

## Testing

### Test Scenarios

#### Scenario 1: Logged Out User
1. Visit site
2. Verify gear icon is NOT visible
3. Try to access `/admin` directly
4. Should redirect to sign-in

#### Scenario 2: Logged In Non-Admin
1. Sign in with non-admin account
2. Verify gear icon IS visible but dimmed
3. Click gear icon
4. Should navigate to `/admin`
5. Should see "Permission Denied" message

#### Scenario 3: Logged In Admin
1. Sign in with admin account
2. Verify gear icon IS visible and highlighted
3. Click gear icon
4. Should open admin panel directly
5. Should have full access to all features

#### Scenario 4: Direct URL Access
1. Logged out: Try `/admin` → Redirected to sign-in
2. Logged in non-admin: Try `/admin` → Permission denied
3. Logged in admin: Try `/admin` → Admin panel opens
4. Refresh `/admin` → Maintains authentication state

## Configuration

### Admin Role Detection
Currently checks for:
- `member.role === 'admin'`
- `member.status === 'APPROVED'`

Can be customized in `/api/auth/verify-admin-role.ts` based on your Wix setup.

### Customization Points
1. **Admin Role Logic**: Modify `verify-admin-role.ts`
2. **Permission Denied Message**: Update `AdminAccessGate.tsx`
3. **Loading State**: Customize in `AdminAccessGate.tsx`
4. **Gear Icon Styling**: Update in `Header.tsx`

## Troubleshooting

### Gear Icon Not Showing
- Verify user is authenticated with Wix Members
- Check browser console for errors
- Verify `useMember()` hook is working

### Permission Denied When Should Have Access
- Check Wix Member role/status
- Verify backend endpoint is accessible
- Check network tab for API errors
- Verify member ID is being passed correctly

### Admin Panel Not Opening
- Verify admin role is set correctly
- Check browser console for errors
- Verify `/admin` route is accessible
- Check network tab for verification endpoint

## Future Enhancements

1. **Role-Based Access Control**: Different admin levels
2. **Audit Logging**: Track admin actions
3. **Two-Factor Authentication**: Enhanced security
4. **Admin Activity Dashboard**: Monitor admin actions
5. **Permission Granularity**: Specific feature access

## Migration Notes

### From Old System
- Old hardcoded credentials no longer used
- All admin access now through Wix Members
- Backend verification required
- No more SimpleAdminLoginModal
- No more useSimpleAdminAuth

### Backward Compatibility
- Old admin components still exist but unused
- Can be safely removed in future cleanup
- No breaking changes to existing functionality

## Support

For issues or questions:
1. Check browser console for errors
2. Verify Wix Members setup
3. Check network tab for API calls
4. Review this documentation
5. Check component comments for details
