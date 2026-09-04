# Security Tests Guide - Client Authentication System

**Date:** 2026-07-19  
**System:** Wix Members + PIN-Based Gallery Access  
**Test Environment:** Staging/Production

---

## Overview

This guide provides step-by-step instructions for verifying the security of the rebuilt client authentication system. Three critical tests ensure that:

1. ✅ Forged session cookies are rejected
2. ✅ Unauthenticated users cannot access CMS data
3. ✅ Users cannot access other users' galleries

---

## Test 1: Manual Cookie Forgery Rejection

### Objective
Verify that Wix Members rejects manually forged or tampered session cookies.

### Prerequisites
- Browser with DevTools (Chrome, Firefox, Safari, Edge)
- Active Wix Members session (logged in)
- Access to `/profile` page

### Steps

#### Step 1.1: Establish Valid Session
1. Open the website in a browser
2. Navigate to `/client-login`
3. Enter valid credentials and log in
4. Verify you're redirected to `/profile`
5. Confirm member info is displayed

#### Step 1.2: Locate Session Cookie
1. Open **DevTools** (F12 or Cmd+Option+I)
2. Go to **Application** tab (Chrome) or **Storage** tab (Firefox)
3. Click **Cookies** in the left sidebar
4. Find the Wix session cookie (typically named `wix_session`, `wix_auth`, or similar)
5. **Note the cookie value** (you'll modify it next)

#### Step 1.3: Tamper with Cookie
1. Double-click the cookie value to edit it
2. Change **3-5 characters** in the middle of the value
3. Press Enter to save
4. **Do NOT change the cookie name or domain**

**Example:**
```
Before: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
After:  eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.XXXXX_NryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U
                                                                                    ^^^^^ (changed)
```

#### Step 1.4: Refresh and Observe
1. Refresh the page (F5 or Cmd+R)
2. **Observe the result:**
   - ❌ You should be logged out
   - ❌ Redirected to `/client-login` or `/`
   - ❌ No member data displayed
   - ❌ Console shows authentication error

#### Step 1.5: Verify Error
1. Open **Console** tab in DevTools
2. Look for error messages like:
   - `"Authentication failed"`
   - `"Invalid session"`
   - `"Unauthorized"`
3. **Screenshot the error** for documentation

#### Step 1.6: Restore Valid Session
1. Close DevTools
2. Log in again with valid credentials
3. Verify you're back on `/profile` with member info

### Expected Result
✅ **PASS:** Forged cookie is rejected, user is logged out  
❌ **FAIL:** User remains logged in despite tampered cookie

### Troubleshooting
- **Cookie not found:** Check different cookie names (wix_session, wix_auth, wix_member)
- **Still logged in after tampering:** Cookie might be regenerated; try a more drastic change
- **Page doesn't refresh:** Hard refresh with Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

---

## Test 2: Unauthenticated CMS Query Rejection

### Objective
Verify that the CMS API rejects data queries from users without valid authentication.

### Prerequisites
- Browser with DevTools
- Incognito/Private window (no existing session)
- Access to website URL

### Steps

#### Step 2.1: Open Incognito Window
1. Open a new **Incognito** (Chrome) or **Private** (Firefox) window
2. Navigate to your website URL
3. **Do NOT log in**
4. Verify you're on the homepage without member info

#### Step 2.2: Open Console
1. Open **DevTools** (F12 or Cmd+Option+I)
2. Go to **Console** tab
3. You should see a blank console (no errors yet)

#### Step 2.3: Attempt CMS Query
1. Paste the following code into the console:

```javascript
// Test: Fetch all galleries without authentication
(async () => {
  try {
    const response = await fetch('/api/cms/clientgalleries', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include' // Include cookies (but none exist in incognito)
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Response Data:', data);
    console.log('Items Count:', data.items ? data.items.length : 'N/A');
    
    if (response.status === 401 || response.status === 403) {
      console.log('✅ PASS: Query rejected (401/403)');
    } else if (data.items && data.items.length === 0) {
      console.log('✅ PASS: Query returned empty (no auth)');
    } else {
      console.log('❌ FAIL: Query returned data without auth!');
    }
  } catch (err) {
    console.log('✅ PASS: Query threw error (expected):', err.message);
  }
})();
```

2. Press Enter to execute

#### Step 2.4: Observe Result
1. **Expected console output:**
   ```
   Response Status: 401
   Response Data: {error: "Unauthorized"}
   Items Count: N/A
   ✅ PASS: Query rejected (401/403)
   ```

2. **Alternative expected output:**
   ```
   Response Status: 200
   Response Data: {items: []}
   Items Count: 0
   ✅ PASS: Query returned empty (no auth)
   ```

3. **Screenshot the console output**

#### Step 2.5: Verify with Authentication
1. Close the incognito window
2. Open a **normal** browser window
3. Log in with valid credentials
4. Open DevTools → Console
5. Run the same query:

```javascript
(async () => {
  const response = await fetch('/api/cms/clientgalleries', {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include'
  });
  const data = await response.json();
  console.log('Authenticated Query - Items:', data.items ? data.items.length : 0);
})();
```

6. **Expected result:** Should return galleries (count > 0)

### Expected Result
✅ **PASS:** Unauthenticated query returns 401/403 or empty array  
❌ **FAIL:** Unauthenticated query returns gallery data

### Troubleshooting
- **API endpoint not found (404):** Check if `/api/cms/clientgalleries` is correct
- **CORS error:** This is expected; indicates API is blocking cross-origin requests
- **Query returns data:** CMS permissions are not properly set; contact admin

---

## Test 3: Cross-User CMS Query Rejection

### Objective
Verify that Client A cannot read Client B's gallery rows, even when authenticated.

### Prerequisites
- Two test accounts created:
  - **Account A:** `clienta@example.com`
  - **Account B:** `clientb@example.com`
- At least one gallery assigned to each account
- Browser with DevTools

### Steps

#### Step 3.1: Create Test Galleries (Admin)
1. Go to Wix Dashboard → Database → clientgalleries
2. Create Gallery 1:
   - `clientName`: "Gallery A"
   - `clientEmail`: "clienta@example.com"
   - `approvalStatus`: "APPROVED"
3. Create Gallery 2:
   - `clientName`: "Gallery B"
   - `clientEmail`: "clientb@example.com"
   - `approvalStatus`: "APPROVED"
4. **Note the gallery IDs**

#### Step 3.2: Log In as Client A
1. Open browser (normal window, not incognito)
2. Navigate to `/client-login`
3. Log in with `clienta@example.com` / password
4. Verify you're on `/profile`
5. Verify "Your Galleries" shows only "Gallery A"

#### Step 3.3: Query All Galleries
1. Open DevTools → Console
2. Paste the following code:

```javascript
// Test: Query all galleries and filter for Client B's galleries
(async () => {
  try {
    const response = await fetch('/api/cms/clientgalleries', {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    const data = await response.json();
    const allGalleries = data.items || [];
    
    console.log('Total galleries returned:', allGalleries.length);
    console.log('All galleries:', allGalleries.map(g => ({
      name: g.clientName,
      email: g.clientEmail,
      id: g._id
    })));
    
    // Try to find Client B's gallery
    const clientBGalleries = allGalleries.filter(g => 
      g.clientEmail === 'clientb@example.com'
    );
    
    console.log('Client B galleries visible to Client A:', clientBGalleries.length);
    
    if (clientBGalleries.length === 0) {
      console.log('✅ PASS: Client B galleries are hidden');
    } else {
      console.log('❌ FAIL: Client B galleries are visible!');
      console.log('Exposed galleries:', clientBGalleries);
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
})();
```

3. Press Enter to execute

#### Step 3.4: Observe Result
1. **Expected console output:**
   ```
   Total galleries returned: 1
   All galleries: [{name: "Gallery A", email: "clienta@example.com", id: "..."}]
   Client B galleries visible to Client A: 0
   ✅ PASS: Client B galleries are hidden
   ```

2. **Screenshot the console output**

#### Step 3.5: Verify with Client B
1. Log out (click "Sign Out" on profile page)
2. Log in with `clientb@example.com` / password
3. Verify "Your Galleries" shows only "Gallery B"
4. Open DevTools → Console
5. Run the same query
6. **Expected result:** Should show only Gallery B (count = 1)

#### Step 3.6: Attempt Direct Access (Bonus Test)
1. While logged in as Client A, try to access Client B's gallery directly:
   - Open DevTools → Console
   - Paste:

```javascript
// Try to fetch Client B's gallery directly by ID
(async () => {
  const clientBGalleryId = 'GALLERY_B_ID_HERE'; // Replace with actual ID
  try {
    const response = await fetch(`/api/cms/clientgalleries/${clientBGalleryId}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include'
    });
    
    const data = await response.json();
    console.log('Response Status:', response.status);
    console.log('Gallery Data:', data);
    
    if (response.status === 403 || !data.clientName) {
      console.log('✅ PASS: Direct access denied');
    } else {
      console.log('❌ FAIL: Direct access allowed!');
    }
  } catch (err) {
    console.log('✅ PASS: Direct access threw error:', err.message);
  }
})();
```

   - Press Enter
   - **Expected result:** 403 Forbidden or error

### Expected Result
✅ **PASS:** Client A can only see their own galleries  
✅ **PASS:** Client B's galleries are hidden  
✅ **PASS:** Direct access to Client B's gallery is denied  
❌ **FAIL:** Client A can see Client B's galleries

### Troubleshooting
- **Both clients see all galleries:** CMS row-level permissions are not set
  - Go to Wix Dashboard → Database → clientgalleries
  - Click the three-dot menu → Permissions
  - Set to "Site Member Author" (only row owner can read)
- **Query returns 404:** API endpoint might be different; check actual endpoint
- **CORS error:** Expected; indicates API is properly blocking unauthorized access

---

## Test Results Documentation

### Test 1: Cookie Forgery
| Item | Result | Notes |
|------|--------|-------|
| Forged cookie rejected | ✅ PASS / ❌ FAIL | |
| User logged out | ✅ PASS / ❌ FAIL | |
| Error message shown | ✅ PASS / ❌ FAIL | |
| Screenshot attached | ✅ YES / ❌ NO | |

### Test 2: Unauthenticated Query
| Item | Result | Notes |
|------|--------|-------|
| Query rejected (401/403) | ✅ PASS / ❌ FAIL | |
| Empty array returned | ✅ PASS / ❌ FAIL | |
| Authenticated query works | ✅ PASS / ❌ FAIL | |
| Screenshot attached | ✅ YES / ❌ NO | |

### Test 3: Cross-User Access
| Item | Result | Notes |
|------|--------|-------|
| Client A sees only own galleries | ✅ PASS / ❌ FAIL | |
| Client B galleries hidden | ✅ PASS / ❌ FAIL | |
| Direct access denied | ✅ PASS / ❌ FAIL | |
| Screenshot attached | ✅ YES / ❌ NO | |

---

## Automated Testing (Optional)

### Using Playwright/Cypress

```javascript
// Example: Test 1 with Playwright
test('Cookie forgery is rejected', async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  
  // Log in
  await page.goto('/client-login');
  await page.fill('input[type="email"]', 'test@example.com');
  await page.fill('input[type="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('/profile');
  
  // Get cookies
  const cookies = await context.cookies();
  const sessionCookie = cookies.find(c => c.name.includes('wix'));
  
  // Tamper with cookie
  const tamperedValue = sessionCookie.value.slice(0, -5) + 'XXXXX';
  await context.addCookies([{
    ...sessionCookie,
    value: tamperedValue
  }]);
  
  // Refresh and verify logout
  await page.reload();
  await page.waitForURL('/client-login');
  
  expect(page.url()).toContain('/client-login');
});
```

---

## Security Checklist

Before deploying to production, verify:

- [ ] Test 1: Cookie forgery rejection passes
- [ ] Test 2: Unauthenticated query rejection passes
- [ ] Test 3: Cross-user access rejection passes
- [ ] All screenshots documented
- [ ] No console errors during tests
- [ ] CMS row-level permissions set to "Site Member Author"
- [ ] PIN access log collection created
- [ ] PIN authorization expires after 30 minutes
- [ ] PIN rotation works after successful entry
- [ ] Rate limiting active on login/register

---

## Deployment Sign-Off

**Tested By:** ________________  
**Date:** ________________  
**Environment:** ☐ Staging ☐ Production  
**All Tests Passed:** ☐ YES ☐ NO  

**Notes:**
```
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________
```

**Approved By:** ________________  
**Date:** ________________

---

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review `/src/PHASE_A_C_D_E_IMPLEMENTATION.md`
3. Contact the development team

---

**Last Updated:** 2026-07-19  
**Version:** 1.0
