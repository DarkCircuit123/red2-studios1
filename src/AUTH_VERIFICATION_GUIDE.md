# Authentication Verification Test Guide

## Overview
This guide explains how to run the authentication verification test and interpret the results. The test validates that the admin authentication flow works correctly within the Wix iframe context.

## How to Run the Test

1. **Navigate to the test page:**
   - Go to `/auth-verification` in your browser
   - You should see the "Authentication Verification Test" component

2. **Enter credentials:**
   - Username: (use credentials from Secrets Manager - ADMIN_USERNAME)
   - Password: (use credentials from Secrets Manager - ADMIN_PASSWORD)
   - **Note:** These credentials are stored securely and should never be hardcoded

3. **Click "Start Authentication Verification"**
   - The test will run through 7 steps automatically
   - Monitor the test results in real-time

## Test Steps Explained

### Step 1: Login Flow
**What it tests:** Admin credentials are accepted by `/api/auth/admin-check`

**Expected result:** 
- Status: 200
- Response includes `authenticated: true`
- Response includes `sessionToken` (a signed JWT)

**If it fails:**
- Check that credentials are correct
- Verify `/src/api/auth/admin-check.ts` is deployed
- Check browser console for network errors

---

### Step 2: Session Token Creation
**What it tests:** A valid session token is generated

**Expected result:**
- Session token is present in response
- Token is a long string (typically 200+ characters)
- Token is a valid JWT (can be decoded at jwt.io)

**If it fails:**
- Check that `SESSION_SECRET` is set in Secrets Manager
- Verify `signAdminToken()` function in `/src/lib/auth-security.ts`

---

### Step 3: Cookie Creation
**What it tests:** The `admin_session` cookie is set in the browser

**Expected result:**
- Cookie appears in browser's cookie storage
- Cookie name is `admin_session`
- Cookie value matches the session token

**If it fails:**
- The cookie may be httpOnly (can't see in JS, but that's OK)
- Check browser DevTools → Application → Cookies
- Look for `admin_session` cookie

**Note:** If you see "Cookie not visible in document.cookie (expected for httpOnly)", that's actually correct behavior. The httpOnly flag prevents JavaScript from accessing the cookie, which is a security feature.

---

### Step 4: Cookie Attributes Verification
**What it tests:** Cookie has correct security attributes

**Expected attributes:**
- `Path: /` - Cookie available to all routes
- `HttpOnly: true` - Cookie not accessible from JavaScript
- `SameSite: Lax` - Cookie sent with same-site requests
- `Secure: true` (if HTTPS) - Cookie only sent over HTTPS
- `Max-Age: 1800` - Cookie expires in 30 minutes

**Browser DevTools verification:**
1. Open DevTools (F12)
2. Go to Application → Cookies
3. Find `admin_session` cookie
4. Check the attributes in the details panel

**If attributes are wrong:**
- Update `/src/api/auth/admin-check.ts` line 140
- Update `/src/api/auth/admin-verify.ts` line 45

---

### Step 5: Session Persistence (Refresh)
**What it tests:** Session survives a page refresh

**Expected result:**
- After login, `/api/auth/admin-verify` returns 200
- Cookie is still present after refresh
- No 401 responses

**If it fails:**
- Cookie may not be persisting across requests
- Check SameSite attribute (may need to change to `None`)
- Verify cookie path is `/`

---

### Step 6: Admin Verify Endpoint
**What it tests:** The `/api/auth/admin-verify` endpoint validates the session

**Expected result:**
- Status: 200
- Response includes `valid: true`
- Response includes `username: "(admin username)"`

**If it fails:**
- Check that `/src/api/auth/admin-verify.ts` is deployed
- Verify `verifyAdminToken()` function in `/src/lib/auth-security.ts`
- Check that `SESSION_SECRET` matches between sign and verify

---

### Step 7: Iframe Context Compatibility
**What it tests:** Authentication works within the Wix iframe

**Expected result:**
- If running in iframe: "SameSite=Lax works correctly in Wix iframe context"
- If not in iframe: "SameSite=Lax is appropriate"

**If it fails (in iframe context):**
- SameSite=Lax may be blocked by Wix iframe
- **Solution:** Update to `SameSite=None; Secure=true`
- This requires HTTPS (which Wix provides)

---

## Troubleshooting

### Issue: Login returns 401
**Causes:**
- Wrong username or password
- Credentials not set in Secrets Manager
- `signAdminToken()` failing

**Fix:**
1. Verify credentials are correct
2. Check Secrets Manager has `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. Check `/src/lib/auth-security.ts` for errors

---

### Issue: Cookie not created
**Causes:**
- Set-Cookie header not sent
- Browser blocking cookies
- Cookie attributes invalid

**Fix:**
1. Check browser DevTools → Network → admin-check request
2. Look for `Set-Cookie` header in response
3. Verify cookie attributes are valid

---

### Issue: Session not persisting (401 on refresh)
**Causes:**
- SameSite=Lax blocked in iframe
- Cookie path incorrect
- Cookie not being sent with requests

**Fix:**
1. Check if running in iframe: `window.self !== window.top`
2. If in iframe, update to `SameSite=None; Secure=true`
3. Verify `credentials: 'include'` in fetch requests

---

### Issue: Admin verify returns 200 but valid=false
**Causes:**
- Session token expired
- Token signature invalid
- SESSION_SECRET mismatch

**Fix:**
1. Check token expiry (should be 30 minutes)
2. Verify SESSION_SECRET is set correctly
3. Check token wasn't modified

---

## Cookie Fix for Wix Iframe

If Step 7 shows "Potential iframe issue detected", follow these steps:

### 1. Update `/src/api/auth/admin-check.ts`

**Find line 140:**
```typescript
const setCookieHeader = `admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800`;
```

**Replace with:**
```typescript
const setCookieHeader = `admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=1800`;
```

### 2. Update `/src/api/auth/admin-verify.ts`

**Find line 45:**
```typescript
'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
```

**Replace with:**
```typescript
'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0',
```

### 3. Redeploy and test again

---

## Final Verification Checklist

Before proceeding to production upload test:

- [ ] Step 1: Login Flow - ✅ Success
- [ ] Step 2: Session Token Creation - ✅ Success
- [ ] Step 3: Cookie Creation - ✅ Success (or warning for httpOnly)
- [ ] Step 4: Cookie Attributes - ✅ Success
- [ ] Step 5: Session Persistence - ✅ Success
- [ ] Step 6: Admin Verify Endpoint - ✅ Success (200 with valid=true)
- [ ] Step 7: Iframe Compatibility - ✅ Success

**If all steps pass:** Ready for production upload test

**If any step fails:** Fix the issue and rerun the test

---

## Next Steps

Once authentication is verified:

1. Navigate to `/upload-test`
2. Run the production upload test
3. Verify:
   - generate-upload-url returns 200
   - Wix upload succeeds
   - Media appears in Wix Media Manager
   - Media URL can be retrieved by ID

---

## Technical Details

### Session Token Format
- Type: JWT (JSON Web Token)
- Signed with: `SESSION_SECRET` from Secrets Manager
- Payload includes: username, issued-at, expiry
- Expires: 30 minutes from creation

### Cookie Security
- **HttpOnly:** Prevents JavaScript access (protects against XSS)
- **Secure:** Only sent over HTTPS
- **SameSite:** Prevents CSRF attacks
  - `Lax`: Sent with same-site requests
  - `None`: Sent with all requests (requires Secure flag)

### Wix Iframe Context
- Wix embeds your site in an iframe
- Cross-origin iframe restrictions apply
- SameSite=Lax may be blocked
- Solution: Use SameSite=None; Secure

---

## Browser DevTools Tips

### Inspect Cookies
1. Open DevTools (F12)
2. Application tab → Cookies
3. Select your site
4. Look for `admin_session` cookie

### Monitor Network Requests
1. Network tab
2. Filter by XHR/Fetch
3. Click on `/api/auth/admin-check` request
4. Check Response headers for `Set-Cookie`

### Check Console Logs
1. Console tab
2. Look for `[ADMIN-CHECK]` and `[ADMIN-VERIFY]` logs
3. These show the server-side flow

---

## Support

If you encounter issues:

1. Check the test results output
2. Review the troubleshooting section above
3. Check browser DevTools for errors
4. Verify Secrets Manager has credentials set
5. Check that files are deployed correctly
