# RED2 STUDIOS — SHARED FOUNDATION IMPLEMENTATION
## Phases 1-3 Complete

### PHASE 1 — SHARED HOOKS ✅
All hooks created in `/src/hooks/`:

1. **useCMSResource.ts**
   - Single resource fetching with AbortController
   - Distinguishes 404 (notFound) from network errors
   - Memoized refetch, cleanup on unmount and id change
   - Console logging with {collectionId, id, error} context

2. **useCMSCollection.ts**
   - List fetching with pagination, filter, cache
   - Server-side filter passed to BaseCrudService.getAll
   - Pagination via skip, deduplication by _id
   - AbortController, visibility-change refetch
   - 60-second background poll (opt-in via pollIntervalMs)
   - Session-level cache keyed to collectionId + JSON.stringify(filter)

3. **useAudioUnlock.ts**
   - Single audio-context authority
   - One-time click + keydown listeners on document
   - First user gesture creates AudioContext, calls .resume()
   - playSound wraps callbacks in try/catch, skips silently when suspended
   - Closes context on unmount

4. **useSessionRateLimit.ts**
   - Client-side rate limiter with sessionStorage persistence
   - Persists across refreshes within the tab
   - Live countdown via internal setInterval
   - Cleanup on unmount

5. **useReducedMotion.ts**
   - Reads prefers-reduced-motion media query
   - Returns boolean, updates on change

6. **useAuthGuard.ts**
   - Protects pages from unauthenticated access
   - Role checking with adminEmails fallback
   - Uses useMember hook
   - Redirects on unauthenticated or missing-role

---

### PHASE 2 — SHARED COMPONENTS ✅
All components created in `/src/components/`:

1. **VideoPlayer.tsx**
   - YouTube / Vimeo / HTML5 auto-detection
   - YouTube regex handles youtu.be/, youtube.com/watch?v=, youtube.com/embed/, youtube.com/shorts/
   - Vimeo handles vimeo.com/id/token
   - HTML5 renders <video> with controls, preload="metadata", poster, correct MIME type
   - Iframes get proper allow and sandbox attributes
   - Exports getCanonicalUrl() and getPlatformName() helpers

2. **ImageLightbox.tsx**
   - Accessible full-screen viewer
   - role="dialog", aria-modal="true"
   - ESC to close, ArrowLeft/ArrowRight nav
   - Focus trap, restore focus on close
   - Body scroll lock via document.body.style.overflow
   - Wrapped in <AnimatePresence>
   - Aspect-ratio-preserving container

3. **SEOHead.tsx**
   - Helmet wrapper with sensible defaults
   - Full OG + Twitter Card + optional JSON-LD
   - Supports noindex, canonical, schema

4. **ErrorBoundary.tsx**
   - Class component with getDerivedStateFromError + componentDidCatch
   - Dark themed fallback UI
   - Logs with context

5. **GridSkeleton.tsx**
   - Pulsing placeholder cards
   - Customizable count, aspectRatio, columns
   - Used during initial load on listing pages

6. **ShareButtons.tsx**
   - X, LinkedIn, Facebook, Copy Link
   - Native navigator.share support
   - Toast notifications

7. **Breadcrumb.tsx**
   - Semantic nav with <nav aria-label="Breadcrumb">
   - Renders as <ol>

8. **ErrorState.tsx**
   - Standardized error UI with optional retry action
   - Dark themed

9. **EmptyState.tsx**
   - Standardized empty UI with optional action
   - Dark themed

10. **ProtectedRoute.tsx**
    - Auth gate with proper role checking
    - adminEmails fallback (starts with ['jordanzuniga@gmail.com'])
    - Returns <Navigate> for redirects
    - Never renders children when not authorized

---

### PHASE 3 — SHARED UTILITIES ✅
All utilities created in `/src/lib/`:

1. **urlSafety.ts**
   - isValidHttpUrl(url)
   - getHostname(url)
   - sanitizeExternalUrl(url)
   - All URL parsing wrapped in try/catch
   - Rejects javascript:, data:, file: protocols

2. **videoPlatform.ts**
   - YouTube/Vimeo detection and ID extraction
   - Canonical URL builders
   - Platform name resolvers
   - detectVideoPlatform(), extractYouTubeId(), extractVimeoId()
   - getCanonicalVideoUrl(), getPlatformName()

3. **sanitize.ts**
   - sanitizeHtml(str) — escape HTML
   - sanitizePlainText(str) — strip all HTML
   - truncatePlain(str, n) — truncate with ellipsis

4. **dateFormat.ts**
   - formatDate(dateString, options?) with try/catch fallback
   - Default options { month: 'long', day: 'numeric', year: 'numeric' }
   - formatReadingTime(text, wordsPerMinute = 200)

5. **emailjs-config.ts**
   - Single source of EmailJS keys and typed send helpers
   - sendBookingAdminEmail(), sendBookingCustomerEmail(), sendMemberVerificationEmail()
   - Generic sendEmail() function
   - Logs warnings if keys are empty, skips send without breaking

6. **click-sound.ts (REWRITTEN)**
   - Internally uses audio context unlock pattern
   - playClickSound() and playHoverSound() safe to call anywhere
   - Silently no-ops until unlocked
   - Always wrapped in try/catch internally
   - Module-level audio context management

---

## DARK CINEMATIC AESTHETIC PRESERVED
- All components use dark theme (bg-black, text-white, gray-900 accents)
- Red accent color (#6F0809) for interactive elements
- Smooth transitions and hover states
- Framer Motion animations where appropriate
- Professional, minimal UI patterns

---

## READY FOR PHASE 4
All shared primitives are now available for consumer migration:
- Hooks can be imported from `@/hooks/`
- Components can be imported from `@/components/`
- Utilities can be imported from `@/lib/`

Next: Migrate all consumers (pages, sections, existing components) to use these shared primitives.
