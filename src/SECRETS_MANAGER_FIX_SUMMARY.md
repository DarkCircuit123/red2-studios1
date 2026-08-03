# Wix Secrets Manager Backend Secret Retrieval Fix

## Problem
The admin login endpoint (`POST /api/auth/admin-check`) was returning:
```json
{
  "authenticated": false,
  "error": "Credentials not configured"
}
```

This occurred because `ADMIN_USERNAME` and `ADMIN_PASSWORD` were resolving as `undefined` in the backend, even though the secrets exist in Wix Secrets Manager.

## Root Cause
The `readSecret()` function in `/src/lib/auth-security.ts` had incorrect regex escape sequences:
```typescript
// BROKEN - double-escaped backslashes
const selfPrefix = new RegExp(`^${name}\\\\s*=\\\\s*([\\\\s\\\\S]*)$`);
```

This created a regex pattern that looked for literal backslash characters instead of whitespace patterns, causing the secret value parsing to fail silently.

## Solution

### 1. Fixed Regex Escape Sequences
Changed from double-escaped (`\\\\s`) to single-escaped (`\\s`):
```typescript
// FIXED - correct escape sequences
const selfPrefix = new RegExp(`^${name}\\s*=\\s*([\\s\\S]*)$`);
```

### 2. Improved Diagnostic Logging
Updated the `readSecret()` function to provide clear diagnostics without printing secret values:

```typescript
const isAvailable = name in process.env;
console.log(`[SECRET DEBUG] name requested: ${name}`);
console.log(`[SECRET DEBUG] available: ${isAvailable}`);
console.log(`[SECRET DEBUG] provider: Wix Secrets Manager`);
```

Output format:
```
[SECRET DEBUG] name requested: ADMIN_USERNAME
[SECRET DEBUG] available: true
[SECRET DEBUG] provider: Wix Secrets Manager
[SECRET DEBUG] Secret "ADMIN_USERNAME" resolved successfully (length: 12)
```

### 3. Verified Integration Points
- **@wix/astro 2.38.0**: Automatically injects secrets into `process.env` at runtime
- **No unsupported imports**: Removed all references to `@wix/sdk` APIs like `getSecureContext()` which don't exist
- **Backend API**: Secrets are accessed directly via `process.env[name]` in backend endpoints

## How It Works

1. **Wix Secrets Manager** stores secrets server-side (e.g., `ADMIN_USERNAME`, `ADMIN_PASSWORD`)
2. **@wix/astro integration** automatically injects these into `process.env` at runtime
3. **readSecret()** function retrieves them from `process.env` with proper trimming and parsing
4. **Admin check endpoint** uses the retrieved credentials for authentication

## Testing

To verify the fix works:

1. **Ensure secrets exist** in Wix Secrets Manager:
   - `ADMIN_USERNAME` = your admin username
   - `ADMIN_PASSWORD` = your admin password
   - `SESSION_SECRET` = a secure random string (for session tokens)

2. **Test the endpoint**:
   ```bash
   POST /api/auth/admin-check
   Content-Type: application/json
   
   {
     "username": "your_admin_username",
     "password": "your_admin_password"
   }
   ```

3. **Expected response** (success):
   ```json
   {
     "authenticated": true,
     "message": "Admin authentication successful",
     "sessionToken": "...",
     "expiresAt": "2026-08-03T..."
   }
   ```

4. **Check console logs** for diagnostic output:
   ```
   [SECRET DEBUG] name requested: ADMIN_USERNAME
   [SECRET DEBUG] available: true
   [SECRET DEBUG] provider: Wix Secrets Manager
   [SECRET DEBUG] Secret "ADMIN_USERNAME" resolved successfully (length: 12)
   ```

## Files Modified
- `/src/lib/auth-security.ts` - Fixed `readSecret()` function with correct regex and improved diagnostics

## Deployment Notes
- **Preview**: Secrets are available in preview mode
- **Production**: Secrets are available in production (Wix Secrets Manager is production-ready)
- **No code changes needed** in `/src/api/auth/admin-check.ts` - it already has proper fallback logic

## Security
- ✅ No secret values printed in logs (only lengths and availability status)
- ✅ Constant-time comparison for password verification
- ✅ Secrets stored server-side only (never exposed to frontend)
- ✅ Session tokens are HMAC-signed and stateless (works across Cloudflare Workers isolates)
