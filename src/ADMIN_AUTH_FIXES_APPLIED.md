# Admin Authentication Fixes Applied

## Summary
Applied comprehensive fixes to resolve 401 errors and ensure admin tokens are properly signed and verified.

## Changes Made

### 1. **admin-login.ts** - Implement Signed Tokens
- **Before**: Generated unsigned random tokens (`admin_${Date.now()}_${random}`)
- **After**: Uses `signAdminToken()` to create HMAC-SHA256 signed tokens
- Reads credentials from environment variables (ADMIN_USERNAME, ADMIN_PASSWORD)
- Sets 30-minute TTL instead of 7 days
- Uses `sameSite: 'lax'` for better security

**Root Cause Fix**: Unsigned tokens couldn't be verified across Cloudflare edge nodes, causing intermittent 401 errors.

### 2. **admin-check.ts** - Verify Signed Tokens
- **Before**: Only checked if cookie existed, didn't validate signature
- **After**: Calls `verifyAdminToken()` to cryptographically verify the token
- Returns 401 if token is invalid, expired, or tampered

**Root Cause Fix**: Stale or tampered tokens were accepted, and valid tokens weren't being verified.

### 3. **admin-logout.ts** - Explicit Cookie Expiration
- **Before**: Used `cookies.delete()` which may not work reliably
- **After**: Sets cookie with `maxAge: 0` and empty value for explicit expiration
- Ensures httpOnly, secure, and sameSite flags match login

**Root Cause Fix**: Logout didn't clear cookies reliably, causing "logged out" users to be silently re-authenticated on refresh.

### 4. **AdminAuthProvider.tsx** - Use admin-verify Endpoint
- **Before**: Used separate admin-check and admin-logout endpoints
- **After**: Uses unified admin-verify endpoint for both check and logout
- Sends `action: 'verify'` or `action: 'logout'` in request body

**Root Cause Fix**: Centralized session management reduces inconsistencies.

### 5. **session-diagnostics.ts** - New Diagnostic Endpoint
- Provides detailed session state information
- Checks:
  - Cookie presence and length
  - Environment variable configuration
  - Token validity and expiry
  - Client IP
- Useful for debugging authentication issues

## Environment Variables Required

```
SESSION_SECRET=<strong-random-secret-min-32-chars>
ADMIN_USERNAME=<username>
ADMIN_PASSWORD=<password>
```

**CRITICAL**: SESSION_SECRET must be set in production. Without it, tokens cannot be signed or verified.

## Token Format

Signed tokens use JWT-like format:
```
<base64url-payload>.<base64url-signature>
```

Payload contains:
```json
{
  "username": "admin_username",
  "iat": 1234567890,
  "exp": 1234569690
}
```

Signature is HMAC-SHA256(payload, SESSION_SECRET)

## Security Improvements

1. **Stateless Tokens**: No server-side session storage needed
2. **Cryptographic Verification**: Tokens cannot be forged or tampered
3. **Expiry Enforcement**: Tokens expire after 30 minutes
4. **Constant-Time Comparison**: Prevents timing attacks
5. **Environment-Based Credentials**: No hardcoded secrets in code
6. **Secure Cookie Flags**: httpOnly, secure, sameSite=lax

## Testing

To test the fixes:

1. **Login**: POST to `/api/auth/admin-login` with credentials
2. **Verify**: POST to `/api/auth/admin-verify` with `action: 'verify'`
3. **Diagnostics**: POST to `/api/auth/session-diagnostics` to inspect session state
4. **Logout**: POST to `/api/auth/admin-verify` with `action: 'logout'`

## Backward Compatibility

- Old unsigned tokens will fail verification (expected)
- Clients must re-login to get new signed tokens
- No migration path for existing sessions (they expire after 30 minutes anyway)

## Next Steps

1. Set SESSION_SECRET in environment variables
2. Test login/logout flow
3. Monitor logs for token verification issues
4. Use session-diagnostics endpoint if problems occur
