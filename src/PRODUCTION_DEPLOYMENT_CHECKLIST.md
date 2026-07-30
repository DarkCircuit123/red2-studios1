# Production Deployment Checklist

**Status:** Ready for deployment after completing this checklist  
**Estimated Time:** 20 minutes  
**Blocker:** Secrets Manager configuration

---

## STEP 1: Configure Wix Secrets Manager (CRITICAL - 5 min)

### What to do:
1. Open Wix Dashboard
2. Go to **Settings** → **Secrets Manager**
3. Create three secrets:

#### Secret 1: Admin Username
- **Name:** `ADMIN_USERNAME`
- **Value:** Your admin username (e.g., `admin` or `jordan`)
- **Click:** Create

#### Secret 2: Admin Password
- **Name:** `ADMIN_PASSWORD`
- **Value:** Your admin password (strong, 12+ chars)
- **Click:** Create

#### Secret 3: Session Secret
- **Name:** `SESSION_SECRET`
- **Value:** Random string (use this command):
  ```bash
  # Generate a secure random string
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
  Or use: `crypto.randomUUID() + crypto.randomUUID()`
- **Click:** Create

### Verification:
After creating secrets, redeploy the site and test:
```bash
curl -X POST https://your-site.com/api/auth/admin-check \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your-password"}'
```

**Expected Response:**
```json
{
  "authenticated": true,
  "sessionToken": "...",
  "expiresAt": "2026-07-30T10:30:00.000Z"
}
```

---

## STEP 2: Test Admin Login (5 min)

### What to do:
1. Open your site in a browser
2. Look for the **settings/gear icon** (usually in header)
3. Click it to open admin login modal
4. Enter your credentials from Step 1
5. Click "Login"

### Expected Result:
- ✅ Modal closes
- ✅ Admin panel opens
- ✅ No console errors

### If it fails:
- Check browser console for error message
- Verify secrets were created correctly
- Verify site was redeployed after creating secrets
- Check that username/password match exactly

---

## STEP 3: Test Music Playback (3 min)

### What to do:
1. Open your site in a browser
2. Look for the **mute/volume button** (bottom-right corner)
3. Click it to toggle music

### Expected Result:
- ✅ Button changes color/icon
- ✅ Music plays (or stops if already playing)
- ✅ No console errors

### If music doesn't play:
- This is normal on first visit (browser autoplay restrictions)
- Click anywhere on the page, then try again
- Check browser console for `[AUDIO]` logs

---

## STEP 4: Test File Uploads (5 min)

### What to do:
1. Open admin panel (from Step 2)
2. Go to **Photos** tab
3. Click **Upload Image**
4. Select an image file
5. Wait for upload to complete

### Expected Result:
- ✅ Image appears in the list
- ✅ No error messages
- ✅ Image URL is stored in CMS

### If upload fails:
- Check file size (max 100MB)
- Check file type (JPG, PNG, WebP, GIF, SVG, etc.)
- Check browser console for error details

---

## STEP 5: Test Booking System (3 min)

### What to do:
1. Open admin panel
2. Go to **Booking** tab
3. Click **Add Availability**
4. Fill in:
   - Date: Today or tomorrow
   - Start Time: 10:00
   - End Time: 11:00
   - Session Type: "Consultation"
5. Click **Save**

### Expected Result:
- ✅ Slot appears in the list
- ✅ No error messages
- ✅ Data saved to CMS

### If it fails:
- Check date format (YYYY-MM-DD)
- Check time format (HH:mm)
- Check that end time is after start time

---

## STEP 6: Security Review (2 min)

### Verify:
- [ ] No credentials visible in browser console
- [ ] No credentials in localStorage (check DevTools → Application → Local Storage)
- [ ] Admin session cookie is httpOnly (can't see in DevTools)
- [ ] No errors about missing secrets

### Check:
```javascript
// In browser console, run:
localStorage.getItem('admin_session')
// Should return: null (session is in httpOnly cookie, not localStorage)
```

---

## STEP 7: Final Checks (2 min)

### Before Publishing:
- [ ] All tests above passed
- [ ] No console errors
- [ ] Admin login works
- [ ] Music plays
- [ ] Uploads work
- [ ] Bookings work

### Ready to Publish:
- [ ] Click **Publish** in Wix Dashboard
- [ ] Wait for deployment to complete
- [ ] Test again on live site

---

## TROUBLESHOOTING

### Admin Login Fails

**Error:** "Invalid credentials"
- **Fix:** Check username/password in Secrets Manager match exactly

**Error:** "Server configuration error"
- **Fix:** Verify `SESSION_SECRET` is set in Secrets Manager
- **Fix:** Redeploy site after creating secrets

**Error:** "Too many attempts"
- **Fix:** Wait 30 minutes (rate limit lockout)
- **Fix:** Try from a different IP/device

### Music Won't Play

**Issue:** No sound on first visit
- **Expected:** Browser autoplay restrictions
- **Fix:** Click anywhere on page, then try again

**Issue:** Console shows MEDIA_ERR_NETWORK
- **Fix:** Check music URL in CMS is valid
- **Fix:** Check CORS headers are correct

### File Upload Fails

**Error:** "Invalid file type"
- **Fix:** Use JPG, PNG, WebP, GIF, or SVG

**Error:** "File too large"
- **Fix:** Resize image to under 100MB

**Error:** "Server error"
- **Fix:** Check browser console for details
- **Fix:** Try again (may be temporary)

### Booking Creation Fails

**Error:** "Invalid date format"
- **Fix:** Use YYYY-MM-DD format (e.g., 2026-07-30)

**Error:** "Invalid time format"
- **Fix:** Use HH:mm format (e.g., 14:30)

**Error:** "This slot already exists"
- **Fix:** Choose a different date/time

---

## QUICK REFERENCE

### Secrets Manager Location
Wix Dashboard → Settings → Secrets Manager

### Required Secrets
| Name | Value | Example |
|------|-------|---------|
| `ADMIN_USERNAME` | Your username | `admin` |
| `ADMIN_PASSWORD` | Your password | `MyP@ssw0rd123` |
| `SESSION_SECRET` | Random 32+ chars | `a1b2c3d4e5f6...` |

### Test URLs
- Admin Login: `https://your-site.com/api/auth/admin-check`
- Session Verify: `https://your-site.com/api/auth/admin-verify`
- Media Upload: `https://your-site.com/api/media/upload`

### Key Files
- Auth: `/src/api/auth/admin-check.ts`
- Secrets: `/src/lib/auth-security.ts`
- Music: `/src/components/BackgroundMusicPlayer.tsx`
- Uploads: `/src/api/media/upload.ts`

---

## SUPPORT

If you encounter issues:

1. **Check browser console** (F12 → Console tab)
2. **Look for error messages** starting with `[ADMIN]`, `[AUDIO]`, `[MEDIA]`
3. **Check Wix Dashboard logs** for backend errors
4. **Verify Secrets Manager** has all three secrets
5. **Redeploy site** after making changes

---

## DEPLOYMENT SIGN-OFF

- [ ] Secrets Manager configured
- [ ] Admin login tested
- [ ] Music playback tested
- [ ] File uploads tested
- [ ] Booking system tested
- [ ] Security review passed
- [ ] No console errors
- [ ] Ready to publish

**Estimated Time to Complete:** 20 minutes  
**Difficulty:** Easy  
**Risk:** Low (all changes are configuration, no code changes)

---

**Last Updated:** 2026-07-30  
**Next Review:** After first production deployment
