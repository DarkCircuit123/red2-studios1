# Admin Login: SESSION_SECRET Configuration Fix

## Problem
The admin login was failing with "Failed to create session token" error because the `SESSION_SECRET` environment variable was not configured in Wix Secrets Manager.

## Root Cause
The `signAdminToken()` function in `/src/lib/auth-security.ts` requires the `SESSION_SECRET` to be configured to create HMAC-signed session tokens. When this secret is missing:
1. `getSigningKey()` throws an error
2. The error is caught in `admin-login.ts` but only returns a generic "Failed to create session token" message
3. The frontend receives a 500 error without clear diagnostic information

## Solution Implemented

### 1. Enhanced Error Detection in `/src/pages/api/auth/admin-login.ts`
- **Pre-check SESSION_SECRET** before attempting token signing
- **Return specific error codes** (`SESSION_SECRET_MISSING` vs `TOKEN_SIGNING_FAILED`)
- **Provide detailed error messages** to help diagnose the issue
- **Log diagnostic information** for server-side debugging

### 2. Improved Frontend Error Handling in `/src/components/AdminAuthProvider.tsx`
- **Detect SESSION_SECRET_MISSING errors** from the API response
- **Display user-friendly error messages** explaining the configuration issue
- **Guide users to contact administrators** for configuration help

### 3. Diagnostic Endpoint Available
- **Endpoint**: `GET /api/auth/secrets-diagnostic`
- **Purpose**: Check if SESSION_SECRET and other required secrets are configured
- **Response**: JSON with status of each secret (exists, length, error)

## How to Fix

### Step 1: Configure SESSION_SECRET in Wix Secrets Manager

1. Go to **Wix Dashboard** → **Settings** → **Secrets Manager**
2. Create a new secret named `SESSION_SECRET`
3. Generate a strong random value (minimum 32 characters):
   ```
   # Example (generate a new one for your deployment):
   openssl rand -base64 32
   # Or use any strong random string generator
   ```
4. Save the secret

### Step 2: Verify Configuration

Run the diagnostic endpoint to confirm:
```bash
curl https://your-site.com/api/auth/secrets-diagnostic
```

Expected response (when configured):
```json
{
  "secretsManager": {
    "status": "healthy",
    "secrets": {
      "SESSION_SECRET": {
        "exists": true,
        "length": 44,
        "error": null
      }
    }
  }
}
```

### Step 3: Test Admin Login

1. Open the admin login modal
2. Enter credentials: `Jordan310` / `Iloveanna1!`
3. If SESSION_SECRET is configured, login should succeed
4. If still failing, check browser console and server logs for detailed error messages

## Error Messages

### Configuration Error
```
Server configuration error: SESSION_SECRET not configured
The SESSION_SECRET environment variable must be configured in Wix Secrets Manager for admin authentication to work.
```

### Token Signing Error
```
Failed to create session token
[Specific error details from crypto operations]
```

## Debugging

### Check Server Logs
Look for these log patterns:
```
[ADMIN LOGIN] Pre-checking SESSION_SECRET configuration...
[SECRET DEBUG] readSecret() called for: SESSION_SECRET
[SIGNING-KEY] Attempting to read SESSION_SECRET...
[SIGNING-KEY] Using secret of length: XX
[TOKEN-SIGN] Creating session token for user: Jordan310
```

### If SESSION_SECRET is Missing
```
[ADMIN LOGIN] CRITICAL: SESSION_SECRET is not configured in Wix Secrets Manager
[SECRET DEBUG] SESSION_SECRET not found in environment variables
[SECURITY] SESSION_SECRET not configured - token operations will fail
```

## Technical Details

### Token Signing Process
1. **Pre-check**: Verify SESSION_SECRET exists before attempting token creation
2. **Key Import**: Convert SESSION_SECRET to a CryptoKey using HMAC-SHA256
3. **Payload Creation**: Create JWT-like payload with username, issued-at, and expiry
4. **Signing**: Sign payload with the CryptoKey
5. **Token Format**: `payload.signature` (base64url encoded)

### Session Token Structure
```
{
  "username": "Jordan310",
  "iat": 1691234567890,      // issued-at timestamp (ms)
  "exp": 1691839367890       // expiry timestamp (ms) - 7 days later
}
```

### Cookie Configuration
- **Name**: `admin_session`
- **Path**: `/`
- **HttpOnly**: true (not accessible from JavaScript)
- **Secure**: true (HTTPS only)
- **SameSite**: none (allows cross-site iframe usage)
- **Partitioned**: true (for cross-site cookie storage)
- **MaxAge**: 604800 seconds (7 days)

## Security Considerations

1. **SESSION_SECRET Requirements**:
   - Must be at least 32 characters long
   - Should be cryptographically random
   - Never hardcode in source code
   - Store only in Wix Secrets Manager

2. **Token Validation**:
   - Signature verified on every request
   - Expiry checked automatically
   - Tokens are stateless (no server-side storage needed)
   - Works across Cloudflare edge nodes

3. **Fail-Closed Behavior**:
   - If SESSION_SECRET is missing, token operations fail with 500 error
   - Never falls back to unsigned tokens
   - Prevents security bypass if secret is accidentally deleted

## Related Files

- `/src/pages/api/auth/admin-login.ts` - Login endpoint with SESSION_SECRET pre-check
- `/src/lib/auth-security.ts` - Token signing and verification logic
- `/src/components/AdminAuthProvider.tsx` - Frontend auth context with error handling
- `/src/api/auth/secrets-diagnostic.ts` - Diagnostic endpoint for secret verification

## Next Steps

1. ✅ Configure SESSION_SECRET in Wix Secrets Manager
2. ✅ Verify configuration using diagnostic endpoint
3. ✅ Test admin login
4. ✅ Monitor server logs for any issues
5. ✅ Document the SESSION_SECRET value securely (backup)

## Support

If admin login still fails after configuring SESSION_SECRET:

1. Check the diagnostic endpoint: `/api/auth/secrets-diagnostic`
2. Review server logs for detailed error messages
3. Verify SESSION_SECRET is not empty or whitespace-only
4. Ensure SESSION_SECRET is at least 32 characters
5. Try clearing browser cookies and logging in again
