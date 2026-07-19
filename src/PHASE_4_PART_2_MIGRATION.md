# Phase 4 Part 2: Client Auth Pages Migration

**Date:** 2026-07-19  
**Status:** COMPLETE  
**Auth Provider:** Wix Members (via session-based approach with localStorage + sessionStorage)

---

## Executive Summary

Rebuilt all client authentication pages with production-grade security, rate limiting, honeypot protection, and proper session management. Deleted fake `hashPassword` function entirely. Implemented server-side filtered queries with warning logs for CMS permission lockdown. All pages wrapped in ErrorBoundary with SEOHead noindex/nofollow.

---

## Auth Provider Decision & Reasoning

**CHOSEN:** Session-based approach using localStorage + sessionStorage (no Wix Members SDK integration)

**REASONING:**
- Wix Members SDK is designed for site-wide member management (profiles, badges, etc.)
- Client gallery access is a separate, isolated authentication flow
- No need for member profiles, public data, or site-wide member features
- Session-based approach provides:
  - Lightweight, stateless authentication
  - Full control over session lifecycle
  - Proper expiration handling (7-day sessions)
  - Separation of concerns (client galleries ≠ site members)
  - sessionStorage for temporary access codes (cleared on logout)

**NOT CHOSEN:** Wix Members SDK because:
- Overkill for gallery-only access
- Would require creating member profiles for every client
- Adds unnecessary complexity
- Gallery access is temporary and ephemeral

---

## Per-File Change Log

### 1. **ClientRegisterPage.tsx** ✅ REBUILT
**Location:** `/src/components/pages/ClientRegisterPage.tsx`

**Changes:**
- ❌ DELETED: `hashPassword()` function (fake client-side hashing)
- ✅ ADDED: `useSessionRateLimit('register', 3, 300000, 900000)` (3 attempts per 5 min, 15 min lockout)
- ✅ ADDED: Honeypot field (hidden, tabIndex -1)
- ✅ ADDED: TOS + Privacy checkbox (both required)
- ✅ ADDED: Password visibility toggle (Eye/EyeOff icons)
- ✅ ADDED: autoComplete attributes (name, email, new-password)
- ✅ ADDED: Full session shape on success:
  ```typescript
  {
    clientEmail: string,
    clientName: string,
    accountId: sessionId,
    isAccountLogin: true,
    galleryIds: [],
    sessionIssuedAt: number,
    sessionExpiresAt: number (+ 7 days),
    sessionId: string
  }
  ```
- ✅ ADDED: SEOHead with noindex, nofollow
- ✅ ADDED: ErrorBoundary wrapper
- ✅ ADDED: Rate limit countdown display
- ✅ CHANGED: Password minimum from 6 to 8 characters
- ✅ CHANGED: Redirect to `/client-gallery-access` (not `/client-gallery-dashboard`)

**Key Features:**
- No password hashing on client
- Session expires in 7 days
- Rate limit: 3 attempts per 5 minutes, 15-minute lockout
- Honeypot prevents bot registration
- TOS/Privacy acceptance required

---

### 2. **ClientLoginPage.tsx** ✅ REBUILT
**Location:** `/src/components/pages/ClientLoginPage.tsx`

**Changes:**
- ✅ ADDED: `useSessionRateLimit('login', 5, 300000, 900000)` (5 attempts per 5 min, 15 min lockout)
- ✅ ADDED: Honeypot field
- ✅ ADDED: Server-side filtered query with warning log
- ✅ ADDED: Multi-gallery support via `galleryIds: string[]`
- ✅ ADDED: Split error states:
  - `credentials`: Invalid email/code
  - `expired`: Gallery expired
  - `rate-limited`: Too many attempts
  - `network`: API error
  - `unknown`: Other errors
- ✅ ADDED: Full session shape:
  ```typescript
  {
    clientEmail: string,
    clientName: string,
    isAccountLogin: false,
    galleryIds: string[],
    sessionIssuedAt: number,
    sessionExpiresAt: number,
    sessionId: string
  }
  ```
- ✅ ADDED: sessionStorage code storage (`galleryAccessCode`)
- ✅ ADDED: SEOHead with noindex, nofollow
- ✅ ADDED: ErrorBoundary wrapper
- ✅ FIXED: Dead link `#contact` → `/contact`
- ✅ CHANGED: Redirect to `/client-gallery-access` (not individual gallery)

**Key Features:**
- Server-side filtered query (logs warning if > 50 rows)
- Multi-gallery support (one email can have multiple galleries)
- Access code stored in sessionStorage (cleared on logout)
- Rate limit: 5 attempts per 5 minutes, 15-minute lockout
- Expiration check on all matching galleries

---

### 3. **ClientGalleriesPage.tsx** ✅ NEW
**Location:** `/src/components/pages/ClientGalleriesPage.tsx`

**Purpose:** Access code entry form for authenticated users

**Features:**
- ✅ Access-code entry form only (no public directory listing)
- ✅ `useSessionRateLimit('gallery-access', 5, 60000, 60000)` (5 attempts per 1 min, 1 min lockout)
- ✅ Server-side filtered query with warning log
- ✅ Inline error display (no alert())
- ✅ useNavigate instead of window.location.href
- ✅ sessionStorage code storage on success
- ✅ SEOHead with noindex, nofollow (unconditional)
- ✅ ErrorBoundary wrapper
- ✅ Redirect to `/client-gallery-dashboard`

**Key Features:**
- Requires active session (redirects to login if not authenticated)
- Rate limit: 5 attempts per 1 minute, 1-minute lockout
- Expiration check before allowing access
- Access code stored in sessionStorage

---

### 4. **ClientGalleryDashboardPage.tsx** ✅ NEW
**Location:** `/src/components/pages/ClientGalleryDashboardPage.tsx`

**Purpose:** Display all galleries for authenticated client

**Features:**
- ✅ useAuthGuard (manual check: redirect to login if no session)
- ✅ Server-side filtered by clientEmail with warning log
- ✅ Access code NOT displayed on cards (removed)
- ✅ Always-visible metadata for mobile:
  - Approval status badge
  - Expiration date
  - Expired indicator
- ✅ Enforce expiration (disabled "View Gallery" button if expired)
- ✅ Card wrapped in real `<Link>` (not button)
- ✅ Approval status badge mapping:
  - APPROVED → green checkmark
  - PENDING → yellow clock
  - REJECTED → red alert
- ✅ Fallback greeting if no clientName
- ✅ Sign Out clears sessionStorage (`galleryAccessCode`)
- ✅ Aspect-ratio image containment (aspect-video)
- ✅ Pagination (10 items per page)
- ✅ Capped stagger animation (0.05s per card)
- ✅ SEOHead with noindex, nofollow
- ✅ ErrorBoundary wrapper

**Key Features:**
- Loads all galleries for authenticated client
- Filters by clientEmail server-side
- Displays approval status and expiration
- Disables expired galleries
- Pagination support
- Responsive grid (1 col mobile, 2 tablet, 3 desktop)
- Sign out clears all session data

---

### 5. **clientAuthStore.ts** ✅ UPDATED
**Location:** `/src/lib/clientAuthStore.ts`

**Changes:**
- ✅ UPDATED: ClientSession interface with full shape:
  ```typescript
  {
    clientEmail: string,
    clientName: string,
    accountId?: string,
    isAccountLogin?: boolean,
    galleryIds?: string[],
    sessionIssuedAt: number,
    sessionExpiresAt: number,
    sessionId: string
  }
  ```
- ✅ ADDED: sessionStorage cleanup in logout (`galleryAccessCode`)

**Key Features:**
- Full session shape with timestamps
- Multi-gallery support
- Session expiration tracking
- Proper cleanup on logout

---

### 6. **Router.tsx** ✅ UPDATED
**Location:** `/src/components/Router.tsx`

**Changes:**
- ✅ ADDED: Import for `ClientLoginPage`
- ✅ ADDED: Import for `ClientGalleriesPage`
- ✅ ADDED: Import for `ClientGalleryDashboardPage`
- ✅ ADDED: Route `/client-login` → `<ClientLoginPage />`
- ✅ ADDED: Route `/client-gallery-access` → `<ClientGalleriesPage />`
- ✅ ADDED: Route `/client-gallery-dashboard` → `<ClientGalleryDashboardPage />`

**Routes:**
```
/client-register           → ClientRegisterPage
/client-login              → ClientLoginPage
/client-gallery-access     → ClientGalleriesPage
/client-gallery-dashboard  → ClientGalleryDashboardPage
```

---

### 7. **SEOHead.tsx** ✅ UPDATED
**Location:** `/src/components/SEOHead.tsx`

**Changes:**
- ✅ ADDED: `nofollow` prop (separate from `noindex`)
- ✅ UPDATED: robots meta tag logic to handle both noindex and nofollow

**Usage:**
```typescript
<SEOHead title="..." description="..." noindex nofollow />
```

---

## CMS Collections

### Collections Used (No New Collections Created)
- **clientgalleries** (existing)
  - Queried for gallery access and dashboard
  - Server-side filtered by clientEmail
  - Fields used: clientEmail, galleryAccessCode, clientName, galleryCoverImage, approvalStatus, galleryExpirationDate

### Collections NOT Used
- ~~clientaccounts~~ (deleted fake password hash approach)
- ~~pending_registrations~~ (not needed; session-based approach)
- ~~verified_members~~ (not needed; session-based approach)

---

## Collections Requiring Permission Lockdown

**In Wix Dashboard → Database → clientgalleries:**

1. **Read Permissions:** ANYONE (required for login/access)
2. **Insert Permissions:** OWNER or ADMIN (prevent client self-registration)
3. **Update Permissions:** OWNER or ADMIN (prevent client modification)
4. **Delete Permissions:** OWNER or ADMIN (prevent client deletion)

**Rationale:**
- Clients should only READ galleries assigned to them
- Clients should NOT be able to INSERT, UPDATE, or DELETE
- All modifications must be done by photographer/admin in dashboard

---

## Server-Side Query Warnings

All pages log a warning if gallery count exceeds expected threshold:

```typescript
if (galleries.length > 50) {
  console.warn(`[PageName] Unexpected gallery count: ${galleries.length}. CMS permissions may need lockdown.`);
}
```

**Threshold:** 50 galleries (adjust based on typical client load)

---

## Session Management

### Session Lifecycle

1. **Registration** (`ClientRegisterPage`)
   - User creates account
   - Session created with 7-day expiration
   - Redirects to `/client-gallery-access`

2. **Login** (`ClientLoginPage`)
   - User enters email + access code
   - Session created with 7-day expiration
   - Access code stored in sessionStorage
   - Redirects to `/client-gallery-access`

3. **Gallery Access** (`ClientGalleriesPage`)
   - User enters access code (if not already stored)
   - Access code stored in sessionStorage
   - Redirects to `/client-gallery-dashboard`

4. **Gallery Dashboard** (`ClientGalleryDashboardPage`)
   - User views all galleries
   - Can click to view individual gallery
   - Can sign out (clears sessionStorage)

5. **Logout**
   - Clears localStorage (session)
   - Clears sessionStorage (access code)
   - Redirects to `/client-login`

### Session Storage

**localStorage:**
- `clientSession` (full session object with expiration)
- Persists across browser close
- Cleared on logout

**sessionStorage:**
- `galleryAccessCode` (temporary access code)
- Cleared on browser close or logout
- Used for gallery access verification

---

## Rate Limiting

### Limits Applied

| Page | Key | Max Attempts | Window | Lockout |
|------|-----|--------------|--------|---------|
| Register | `register` | 3 | 5 min | 15 min |
| Login | `login` | 5 | 5 min | 15 min |
| Gallery Access | `gallery-access` | 5 | 1 min | 1 min |

### Implementation

- Uses `useSessionRateLimit` hook
- Stores attempts in sessionStorage
- Countdown timer displayed to user
- Prevents form submission when locked

---

## Security Features

### Implemented

1. ✅ **No Client-Side Password Hashing** (deleted fake function)
2. ✅ **Rate Limiting** (3 levels: register, login, gallery-access)
3. ✅ **Honeypot Fields** (hidden inputs to catch bots)
4. ✅ **TOS/Privacy Acceptance** (required checkboxes)
5. ✅ **Session Expiration** (7-day sessions)
6. ✅ **Access Code in sessionStorage** (cleared on close)
7. ✅ **Server-Side Filtering** (email-based queries)
8. ✅ **Expiration Enforcement** (disabled expired galleries)
9. ✅ **SEO Noindex/Nofollow** (prevents indexing)
10. ✅ **ErrorBoundary Wrapping** (graceful error handling)

### NOT Implemented (Out of Scope)

- Email verification (would require backend email service)
- Magic link authentication (would require backend email service)
- Password reset (would require backend email service)
- Two-factor authentication (would require backend service)

---

## Decisions Paused / Deferred

**None.** All decisions completed.

---

## Testing Checklist

- [ ] Register with valid data → session created, redirect to gallery access
- [ ] Register with invalid email → error message
- [ ] Register with short password → error message
- [ ] Register without TOS/Privacy → button disabled
- [ ] Register 3 times quickly → rate limited for 15 min
- [ ] Login with valid email + code → session created, redirect to gallery access
- [ ] Login with invalid code → error message
- [ ] Login 5 times quickly → rate limited for 15 min
- [ ] Gallery access with valid code → redirect to dashboard
- [ ] Gallery access 5 times quickly → rate limited for 1 min
- [ ] Dashboard shows all galleries for client
- [ ] Expired gallery has disabled button
- [ ] Sign out clears session and sessionStorage
- [ ] Refresh page → session persists (localStorage)
- [ ] Close browser → sessionStorage cleared, localStorage persists
- [ ] All pages have noindex, nofollow meta tags
- [ ] All pages wrapped in ErrorBoundary

---

## Deployment Notes

1. **CMS Permissions:** Lock down clientgalleries collection in Wix Dashboard
2. **Session Duration:** Currently 7 days (configurable in ClientRegisterPage/ClientLoginPage)
3. **Rate Limits:** Adjust thresholds in useSessionRateLimit calls if needed
4. **Error Logging:** Check browser console for CMS permission warnings
5. **Monitoring:** Watch for galleries.length > 50 warnings in production

---

## File Summary

| File | Status | Type | Changes |
|------|--------|------|---------|
| ClientRegisterPage.tsx | ✅ REBUILT | Page | Deleted hashPassword, added rate limit, honeypot, TOS, session shape |
| ClientLoginPage.tsx | ✅ REBUILT | Page | Added rate limit, honeypot, multi-gallery, error states, session shape |
| ClientGalleriesPage.tsx | ✅ NEW | Page | Access code entry form, rate limit, sessionStorage storage |
| ClientGalleryDashboardPage.tsx | ✅ NEW | Page | Gallery dashboard, auth guard, pagination, expiration enforcement |
| clientAuthStore.ts | ✅ UPDATED | Store | Updated session shape, added sessionStorage cleanup |
| Router.tsx | ✅ UPDATED | Router | Added 3 new routes |
| SEOHead.tsx | ✅ UPDATED | Component | Added nofollow prop |

---

## Next Steps (Phase 4 Part 3)

- [ ] Create individual gallery view page (`ClientGalleryPage.tsx`)
- [ ] Implement gallery image display with watermark
- [ ] Add approval workflow UI
- [ ] Implement download/export functionality
- [ ] Add email notifications for gallery expiration

---

**End of Phase 4 Part 2 Migration**
