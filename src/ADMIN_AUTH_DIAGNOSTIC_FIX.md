# Admin Authentication Diagnostic & Fix Summary

## Problem Statement
The upload test cannot run because authentication is failing before the media pipeline starts:
- `POST /api/auth/admin-verify` returns HTTP 401 Unauthorized
- Valid admin credentials/session are intermittently rejected
- Session cookie is not persisting between requests
- The Wix iframe environment may have cookie SameSite/Secure flag issues

## Root Cause Analysis

### Issue 1: Cookie SameSite Settings Incompatible with Wix Iframe
**Original Setting:** `SameSite=Strict`
**Problem:** Wix editor runs the app in an iframe. `SameSite=Strict` blocks cookies from being sent in cross-site iframe contexts, which is exactly how Wix embeds the editor.

**Solution:** Changed to `SameSite=Lax`
- `Lax` allows cookies in iframe contexts while still providing CSRF protection
- Compatible with Wix's iframe-based editor environment
- Still prevents cookies from being sent on cross-site POST requests from external sites

### Issue 2: Missing Comprehensive Logging
**Problem:** No visibility into:
- Whether the cookie is being received in requests
- Where the session token is coming from (cookie vs body)
- Token validation failures and their causes
- Credential comparison results
- Session signing/verification steps

**Solution:** Added detailed logging at every stage:
- Request reception and action type
- Cookie presence/absence with length
- Token source (cookie vs body)
- Credential lookup and comparison results
- Token signing and verification steps
- Expiry time validation

### Issue 3: Cookie Attributes Not Optimized for Wix
**Original:** `HttpOnly; Secure; SameSite=Strict`
**Updated:** `HttpOnly; SameSite=Lax` (removed Secure flag for development)

**Note:** The `Secure` flag requires HTTPS. In development/testing, this may cause cookies to be rejected if the connection is not HTTPS. For Wix production, ensure HTTPS is enabled.

## Changes Made

### 1. `/src/api/auth/admin-check.ts` - Enhanced Logging
Added comprehensive logging for:
- Login attempt start
- Request validation
- Input sanitization
- Credential lookup from Secrets Manager
- Credential comparison (username and password separately)
- Session token signing
- Cookie creation with attributes

**Key Log Prefixes:**
- `[ADMIN-CHECK]` - Main authentication flow
- `[SECURITY]` - Security-related events
- `[TOKEN-SIGN]` - Token creation

### 2. `/src/api/auth/admin-verify.ts` - Enhanced Logging & Cookie Fix
Added comprehensive logging for:
- Request reception
- Cookie extraction and presence check
- Token source identification (cookie vs body)
- Token validation results
- Session expiry verification

**Key Changes:**
- Changed `SameSite=Strict` to `SameSite=Lax` for Wix iframe compatibility
- Added detailed cookie state logging
- Added request headers inspection for debugging
- Added token validation result logging

**Key Log Prefixes:**
- `[ADMIN-VERIFY]` - Session verification flow
- `[SECURITY]` - Security-related events

### 3. `/src/lib/auth-security.ts` - Token Signing & Verification Logging
Added logging for:
- Session secret retrieval
- Token payload creation (iat, exp times)
- Signature computation
- Token verification steps
- Expiry validation

**Key Log Prefixes:**
- `[SIGNING-KEY]` - Secret key retrieval
- `[TOKEN-SIGN]` - Token creation
- `[TOKEN-VERIFY]` - Token verification

## Expected Behavior After Fix

### Login Flow
```
1. Admin submits credentials
   ↓
[ADMIN-CHECK] Login attempt started
[ADMIN-CHECK] Request from IP: xxx.xxx.xxx.xxx
[ADMIN-CHECK] Auth payload received - username: (present) password: (present)
[ADMIN-CHECK] Input sanitized
[ADMIN-CHECK] Attempting to read credentials from Secrets Manager...
[ADMIN-CHECK] readSecret result - ADMIN_USERNAME: (set, length: X)
[ADMIN-CHECK] readSecret result - ADMIN_PASSWORD: (set, length: X)
[ADMIN-CHECK] Starting credential comparison...
[ADMIN-CHECK] Username match result: true
[ADMIN-CHECK] Password match result: true
[ADMIN-CHECK] Credentials validated successfully
[TOKEN-SIGN] Creating session token for user: Jordan310 TTL: 1800000 ms
[TOKEN-SIGN] Payload - iat: 2026-08-03T... exp: 2026-08-03T...
[TOKEN-SIGN] Payload encoded, length: XXX
[SIGNING-KEY] Attempting to read SESSION_SECRET...
[SIGNING-KEY] readSecret result: (set, length: XX)
[SIGNING-KEY] Using secret of length: XX
[SIGNING-KEY] CryptoKey imported successfully
[TOKEN-SIGN] Signature computed, length: XXX
[TOKEN-SIGN] Token created, total length: XXX
[ADMIN-CHECK] Successful login from IP: xxx.xxx.xxx.xxx, user: Jordan310
[ADMIN-CHECK] Setting cookie with attributes: Path=/, HttpOnly, SameSite=Lax, Max-Age=1800
   ↓
Response: HTTP 200 with Set-Cookie header
```

### Verification Flow
```
1. Admin panel checks session validity
   ↓
[ADMIN-VERIFY] Request received, action: verify
[ADMIN-VERIFY] Checking for admin_session cookie...
[ADMIN-VERIFY] Cookie from request: (present, length: XXX)
[ADMIN-VERIFY] Session token source: cookie
[ADMIN-VERIFY] Verifying token from IP: xxx.xxx.xxx.xxx
[TOKEN-VERIFY] Verifying token, length: XXX
[TOKEN-VERIFY] Token parts - payload: (present) signature: (present)
[SIGNING-KEY] Attempting to read SESSION_SECRET...
[SIGNING-KEY] readSecret result: (set, length: XX)
[SIGNING-KEY] Using secret of length: XX
[SIGNING-KEY] CryptoKey imported successfully
[TOKEN-VERIFY] Signing key obtained
[TOKEN-VERIFY] Expected signature computed
[TOKEN-VERIFY] Signature verified
[TOKEN-VERIFY] Payload decoded - username: Jordan310 iat: 2026-08-03T... exp: 2026-08-03T...
[TOKEN-VERIFY] Token valid for user: Jordan310
[ADMIN-VERIFY] Session valid for user: Jordan310
   ↓
Response: HTTP 200 { valid: true, username: "Jordan310" }
```

## Debugging Guide

### If Login Fails (HTTP 401)
1. Check logs for `[ADMIN-CHECK]` entries
2. Look for credential comparison results:
   - `Username match result: false` → Username doesn't match
   - `Password match result: false` → Password doesn't match
3. Check if credentials are being read from Secrets Manager:
   - `readSecret result - ADMIN_USERNAME: (not set)` → Using fallback
   - `readSecret result - ADMIN_PASSWORD: (not set)` → Using fallback
4. Verify input lengths match stored lengths

### If Session Verification Fails (HTTP 401 on verify)
1. Check logs for `[ADMIN-VERIFY]` entries
2. Look for cookie presence:
   - `Cookie from request: (missing)` → Cookie not being sent
   - `Cookie from request: (present, length: XXX)` → Cookie received
3. Check token validation:
   - `[TOKEN-VERIFY] Token malformed` → Token format invalid
   - `[TOKEN-VERIFY] Signature mismatch` → Token tampered or wrong secret
   - `[TOKEN-VERIFY] Token expired` → Session expired
4. If cookie is missing, check browser DevTools:
   - Verify `admin_session` cookie exists
   - Check cookie attributes (Path, HttpOnly, SameSite, Max-Age)
   - Verify cookie domain matches current domain

### If Cookie Not Persisting
1. Check browser DevTools → Application → Cookies
2. Verify `admin_session` cookie is present after login
3. Check cookie attributes:
   - `Path=/` ✓
   - `HttpOnly` ✓
   - `SameSite=Lax` ✓
   - `Max-Age=1800` (30 minutes) ✓
4. If running in Wix iframe, ensure `SameSite=Lax` (not `Strict`)
5. For HTTPS environments, verify `Secure` flag is set

## Testing the Fix

### Manual Test Sequence
1. **Login Test:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/admin-check \
     -H "Content-Type: application/json" \
     -d '{"username":"Jordan310","password":"Iloveanna1!"}'
   ```
   - Expected: HTTP 200 with `authenticated: true`
   - Check logs for `[ADMIN-CHECK]` entries

2. **Verify Test (with cookie):**
   ```bash
   curl -X POST http://localhost:3000/api/auth/admin-verify \
     -H "Content-Type: application/json" \
     -b "admin_session=<token_from_login>"
   ```
   - Expected: HTTP 200 with `valid: true`
   - Check logs for `[ADMIN-VERIFY]` and `[TOKEN-VERIFY]` entries

3. **Upload Test:**
   - Navigate to `/upload-test`
   - Click "Run Upload Test"
   - Should proceed past authentication
   - Check logs for upload pipeline execution

### Automated Test (UploadProductionTest)
The UploadProductionTest component will:
1. Call `/api/auth/admin-check` to login
2. Call `/api/auth/admin-verify` to verify session
3. Call `/api/media/generate-upload-url` to get upload URL
4. Upload file to Wix Media Manager
5. Verify image exists

## Configuration Requirements

### Secrets Manager (Wix Dashboard)
Ensure these are set in Wix Secrets Manager:
- `ADMIN_USERNAME` = `Jordan310`
- `ADMIN_PASSWORD` = `Iloveanna1!`
- `SESSION_SECRET` = (any secure random string, 32+ chars)

If not set, the code falls back to hardcoded values (development only).

### Environment Variables (Development)
For local testing, set in `.env`:
```
ADMIN_USERNAME=Jordan310
ADMIN_PASSWORD=Iloveanna1!
SESSION_SECRET=dev-session-secret-change-in-production-12345678901234567890
```

## Cookie Compatibility Matrix

| Setting | Strict | Lax | None |
|---------|--------|-----|------|
| Wix Iframe | ❌ | ✅ | ⚠️ |
| Same-site POST | ✅ | ✅ | ❌ |
| CSRF Protection | ✅ | ✅ | ❌ |
| Requires HTTPS | No | No | Yes |

**Chosen:** `SameSite=Lax` - Best balance for Wix iframe + CSRF protection

## Next Steps

1. **Verify logs** - Check browser console and server logs for `[ADMIN-CHECK]`, `[ADMIN-VERIFY]`, and `[TOKEN-VERIFY]` entries
2. **Test login** - Attempt admin login and verify session persists
3. **Run upload test** - Execute `/upload-test` to verify full pipeline
4. **Monitor production** - Watch logs for any authentication anomalies
5. **Set Secrets Manager** - Ensure credentials are properly configured in Wix dashboard

## Related Files
- `/src/api/auth/admin-check.ts` - Login endpoint
- `/src/api/auth/admin-verify.ts` - Session verification endpoint
- `/src/lib/auth-security.ts` - Token signing/verification utilities
- `/src/components/UploadProductionTest.tsx` - Upload test component
- `/src/pages/api/media/generate-upload-url.ts` - Upload URL generation endpoint
