# Authentication Verification Test - Setup Complete

## What Was Created

### 1. **AuthenticationVerificationTest Component**
**File:** `/src/components/AuthenticationVerificationTest.tsx`

A comprehensive interactive test component that validates the entire admin authentication flow:

**Features:**
- 7-step authentication verification process
- Real-time test status monitoring
- Cookie inspection and validation
- Iframe context detection
- Detailed test results logging
- Recommendations for fixes

**Test Steps:**
1. Login Flow - Verify admin credentials accepted
2. Session Token Creation - Verify JWT generated
3. Cookie Creation - Verify admin_session cookie set
4. Cookie Attributes - Verify Path, HttpOnly, SameSite, Secure, Max-Age
5. Session Persistence - Verify session survives refresh
6. Admin Verify Endpoint - Verify /api/auth/admin-verify returns 200
7. Iframe Context Compatibility - Verify SameSite behavior in Wix iframe

### 2. **Router Configuration**
**File:** `/src/components/Router.tsx`

Added new route for the verification test:
```
/auth-verification → AuthenticationVerificationTest component
```

### 3. **Enhanced Logging**
**Files:**
- `/src/api/auth/admin-check.ts` - Added detailed cookie attribute logging
- `/src/api/auth/admin-verify.ts` - Added logout cookie clearing logging

**Logging includes:**
- Cookie name, path, HttpOnly flag, SameSite value, Max-Age
- Notes about SameSite=None; Secure requirement for iframe context
- Clear instructions for fixing if needed

### 4. **Documentation**
**File:** `/src/AUTH_VERIFICATION_GUIDE.md`

Comprehensive guide covering:
- How to run the test
- What each step tests
- Expected results
- Troubleshooting guide
- Cookie fix instructions for Wix iframe
- Browser DevTools tips
- Final verification checklist

---

## How to Use

### Step 1: Navigate to Test Page
```
http://your-site.com/auth-verification
```

### Step 2: Enter Credentials
- Username: `Jordan310`
- Password: `Iloveanna1!`

### Step 3: Click "Start Authentication Verification"

### Step 4: Monitor Results
The test will run through 7 steps and display:
- ✅ Success (green)
- ❌ Failed (red)
- ⚠️ Warning (yellow)
- 🔄 Running (blue)

### Step 5: Review Results
Each step shows:
- Status icon
- Step name
- Message
- Details (if applicable)

---

## Expected Results

### Ideal Scenario (Not in Iframe)
```
✅ Step 1: Login Flow - Success
✅ Step 2: Session Token Creation - Success
✅ Step 3: Cookie Creation - Success
✅ Step 4: Cookie Attributes - Success
✅ Step 5: Session Persistence - Success
✅ Step 6: Admin Verify Endpoint - Success (200, valid=true)
✅ Step 7: Iframe Compatibility - Success (Not in iframe)
```

### Wix Iframe Scenario (SameSite=Lax works)
```
✅ Step 1: Login Flow - Success
✅ Step 2: Session Token Creation - Success
✅ Step 3: Cookie Creation - Success
✅ Step 4: Cookie Attributes - Success
✅ Step 5: Session Persistence - Success
✅ Step 6: Admin Verify Endpoint - Success (200, valid=true)
✅ Step 7: Iframe Compatibility - Success (SameSite=Lax works in iframe)
```

### Wix Iframe Scenario (SameSite=Lax blocked)
```
✅ Step 1: Login Flow - Success
✅ Step 2: Session Token Creation - Success
✅ Step 3: Cookie Creation - Success
✅ Step 4: Cookie Attributes - Success
⚠️ Step 5: Session Persistence - Warning
❌ Step 6: Admin Verify Endpoint - Failed (401)
⚠️ Step 7: Iframe Compatibility - Warning (Potential iframe issue)
```

**If you see this scenario:** Follow the "Cookie Fix for Wix Iframe" section below.

---

## Cookie Fix for Wix Iframe (If Needed)

If Step 7 shows "Potential iframe issue detected", follow these steps:

### 1. Update `/src/api/auth/admin-check.ts`

**Current (Line 140):**
```typescript
const setCookieHeader = `admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=Lax; Max-Age=1800`;
```

**Change to:**
```typescript
const setCookieHeader = `admin_session=${sessionToken}; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=1800`;
```

### 2. Update `/src/api/auth/admin-verify.ts`

**Current (Line 45):**
```typescript
'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0',
```

**Change to:**
```typescript
'Set-Cookie': 'admin_session=; Path=/; HttpOnly; SameSite=None; Secure; Max-Age=0',
```

### 3. Redeploy and Test Again

After making changes:
1. Redeploy the site
2. Navigate to `/auth-verification`
3. Run the test again
4. Verify Step 7 now shows success

---

## Verification Checklist

Before proceeding to production upload test, verify:

- [ ] **Step 1: Login Flow**
  - Status: ✅ Success
  - Response: 200
  - Contains: `authenticated: true`

- [ ] **Step 2: Session Token Creation**
  - Status: ✅ Success
  - Token: Present and valid JWT

- [ ] **Step 3: Cookie Creation**
  - Status: ✅ Success or ⚠️ Warning (httpOnly)
  - Cookie: `admin_session` present

- [ ] **Step 4: Cookie Attributes**
  - Status: ✅ Success
  - Path: `/`
  - HttpOnly: `true`
  - SameSite: `Lax` (or `None` if in iframe)
  - Max-Age: `1800`

- [ ] **Step 5: Session Persistence**
  - Status: ✅ Success
  - No 401 responses
  - Session survives refresh

- [ ] **Step 6: Admin Verify Endpoint**
  - Status: ✅ Success
  - Response: 200
  - Contains: `valid: true`
  - Contains: `username: "Jordan310"`

- [ ] **Step 7: Iframe Compatibility**
  - Status: ✅ Success
  - Message: "SameSite=Lax works correctly in Wix iframe context"
  - Or: "SameSite=Lax is appropriate" (if not in iframe)

---

## Troubleshooting

### Issue: Step 1 fails (Login returns 401)
**Possible causes:**
- Wrong credentials
- Credentials not in Secrets Manager
- `signAdminToken()` failing

**Fix:**
1. Verify credentials: `Jordan310` / `Iloveanna1!`
2. Check Secrets Manager has `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. Check `/src/lib/auth-security.ts` for errors

### Issue: Step 3 fails (Cookie not created)
**Possible causes:**
- Set-Cookie header not sent
- Browser blocking cookies
- Cookie attributes invalid

**Fix:**
1. Open DevTools → Network → admin-check request
2. Check Response headers for `Set-Cookie`
3. Verify cookie attributes are valid

### Issue: Step 5 or 6 fails (Session not persisting)
**Possible causes:**
- SameSite=Lax blocked in iframe
- Cookie path incorrect
- Cookie not being sent with requests

**Fix:**
1. Check if in iframe: `window.self !== window.top`
2. If in iframe, apply "Cookie Fix for Wix Iframe" above
3. Verify `credentials: 'include'` in fetch requests

### Issue: Step 7 shows warning (Iframe compatibility issue)
**Solution:**
- Apply "Cookie Fix for Wix Iframe" section above
- Change SameSite from `Lax` to `None; Secure`
- Redeploy and test again

---

## Browser DevTools Inspection

### Verify Cookie in DevTools

1. **Open DevTools:** F12
2. **Go to:** Application → Cookies
3. **Select:** Your site
4. **Find:** `admin_session` cookie
5. **Check attributes:**
   - Name: `admin_session`
   - Value: (should be a long JWT token)
   - Path: `/`
   - Secure: ✓ (if HTTPS)
   - SameSite: `Lax` (or `None`)
   - HttpOnly: ✓

### Monitor Network Requests

1. **Open DevTools:** F12
2. **Go to:** Network tab
3. **Filter:** XHR/Fetch
4. **Click:** `/api/auth/admin-check` request
5. **Check Response headers:**
   - Look for `Set-Cookie: admin_session=...`
   - Verify attributes are present

### Check Console Logs

1. **Open DevTools:** F12
2. **Go to:** Console tab
3. **Look for:** `[ADMIN-CHECK]` and `[ADMIN-VERIFY]` logs
4. **These show:** Server-side authentication flow

---

## Next Steps

### After Verification Passes

Once all 7 steps show ✅ Success:

1. **Navigate to:** `/upload-test`
2. **Run:** Production Upload Test
3. **Verify:**
   - generate-upload-url returns 200
   - Wix upload succeeds
   - Media appears in Wix Media Manager
   - Media URL can be retrieved by ID

### If Verification Fails

1. **Review:** Test results output
2. **Check:** Troubleshooting section above
3. **Fix:** Issues identified
4. **Rerun:** Authentication Verification Test
5. **Repeat:** Until all steps pass

---

## Technical Details

### Session Token (JWT)
- **Type:** JSON Web Token
- **Signed with:** `SESSION_SECRET` from Secrets Manager
- **Payload:** username, issued-at, expiry
- **Expires:** 30 minutes from creation
- **Verification:** Signature checked on each request

### Cookie Security Attributes
- **HttpOnly:** Prevents JavaScript access (protects against XSS)
- **Secure:** Only sent over HTTPS
- **SameSite:** Prevents CSRF attacks
  - `Lax`: Sent with same-site requests (default)
  - `None`: Sent with all requests (requires Secure flag)
- **Path:** `/` (available to all routes)
- **Max-Age:** 1800 seconds (30 minutes)

### Wix Iframe Context
- Wix embeds your site in an iframe
- Cross-origin iframe restrictions apply
- SameSite=Lax may be blocked by browser
- Solution: Use SameSite=None; Secure
- Requires HTTPS (which Wix provides)

---

## Files Modified

### New Files Created
- `/src/components/AuthenticationVerificationTest.tsx` - Test component
- `/src/AUTH_VERIFICATION_GUIDE.md` - User guide
- `/src/AUTHENTICATION_VERIFICATION_SETUP.md` - This file

### Files Updated
- `/src/components/Router.tsx` - Added `/auth-verification` route
- `/src/api/auth/admin-check.ts` - Enhanced logging
- `/src/api/auth/admin-verify.ts` - Enhanced logging

---

## Support

For issues or questions:

1. **Check:** `/src/AUTH_VERIFICATION_GUIDE.md` for detailed troubleshooting
2. **Review:** Test results output for specific error messages
3. **Inspect:** Browser DevTools for network and cookie details
4. **Verify:** All prerequisites are met (credentials, Secrets Manager, etc.)

---

## Summary

✅ **Authentication Verification Test is ready to use**

**To run the test:**
1. Navigate to `/auth-verification`
2. Enter credentials
3. Click "Start Authentication Verification"
4. Monitor the 7-step process
5. Review results and recommendations

**Expected outcome:**
- All 7 steps show ✅ Success
- Session persists across requests
- Admin verify returns 200 with valid=true
- Ready for production upload test

**If issues occur:**
- Review troubleshooting guide
- Apply cookie fix if needed
- Redeploy and test again
