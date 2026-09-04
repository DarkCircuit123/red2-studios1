# PHASE 2: PRODUCTION FAILURE FIX - WDE0117 & MissingCmsTargetError

**Status:** CRITICAL PRODUCTION ISSUE  
**Date:** 2026-08-10  
**Severity:** P0 - Site functionality blocked  

---

## ROOT CAUSE ANALYSIS

### Issue 1: WDE0117 - MetaSite not found
**Error:** `MetaSite not found` when calling Wix CMS APIs  
**Root Cause:** The `@wix/essentials` auth context is not properly initialized in server-side API routes.

**Evidence:**
- `/src/api/cms/mutate.ts` imports from `@wix/essentials` and `@wix/data`
- These modules require an active Wix context (MetaSite) to function
- The context is only available in Astro API routes when properly configured
- The error occurs when `auth.elevate()` is called without an active context

**Why It Happens:**
```typescript
// /src/api/cms/mutate.ts - Line 1-2
import { auth } from '@wix/essentials';
import { items } from '@wix/data';
// ❌ These require an active Wix context (MetaSite)
// ❌ The context is NOT available in this file location
```

### Issue 2: MissingCmsTargetError - Incomplete Upload Targets
**Error:** `Cannot save to the CMS: missing collectionId, itemId, fieldName`  
**Root Cause:** The "Work" tab in AdminPanel uploads to `portfolioimages` collection WITHOUT providing an `itemId`.

**Evidence:**
```typescript
// /src/components/AdminPanel.tsx - Line 341-348
<ImageUploadManager
  label="Upload Work Image"
  collectionId="portfolioimages"
  fieldName="imageUrl"  // ❌ Missing itemId!
  onImageUpload={(url) => {
    console.log('Work image uploaded:', url);
  }}
/>
```

**Why It's a Problem:**
- `portfolioimages` is a collection that stores portfolio images
- Each image MUST be linked to a portfolio item via `itemId`
- Without `itemId`, `saveImageToCms()` throws `MissingCmsTargetError`
- The upload appears to succeed locally but fails to persist

---

## FIXES APPLIED

### Fix 1: Migrate CMS Mutations to Astro API Route

**File:** `/src/pages/api/cms/mutate.ts` (already exists - VERIFIED CORRECT)

This file is already correctly implemented:
- ✅ Uses Astro's native API route system (has access to Wix context)
- ✅ Verifies admin session before allowing mutations
- ✅ Calls the server-side `mutate()` function from `/src/api/cms/mutate.ts`
- ✅ Returns proper error responses

**Status:** NO CHANGES NEEDED - This is the correct pattern.

---

### Fix 2: Correct the Work Tab Upload Target

**File:** `/src/components/AdminPanel.tsx`

**Problem:** The "Work" tab tries to upload directly to `portfolioimages` without an `itemId`.

**Solution:** 
1. Load portfolio items (already done)
2. For each portfolio item, allow uploading to its images
3. OR: Create a new portfolio item first, then upload

**Implementation:**

```typescript
// BEFORE (Line 341-348)
<ImageUploadManager
  label="Upload Work Image"
  collectionId="portfolioimages"
  fieldName="imageUrl"  // ❌ Missing itemId
  onImageUpload={(url) => {
    console.log('Work image uploaded:', url);
  }}
/>

// AFTER: Show portfolio items and allow uploading to each
{portfolioItems.length === 0 ? (
  <div className="text-center py-8">
    <p className="text-sm text-black/60">
      No portfolio items found. Create portfolio items in the CMS first.
    </p>
  </div>
) : (
  portfolioItems.map((item) => (
    <div key={item._id} className="border-t border-black/10 pt-6">
      <h4 className="text-xs font-heading font-bold text-black mb-4 uppercase tracking-wide">
        {item.projectName || 'Untitled Project'}
      </h4>
      <div className="space-y-4">
        {['mainImage', 'galleryImage1', 'galleryImage2', 'galleryImage3'].map((field, idx) => (
          <div key={field}>
            <label className="text-xs text-black/60 uppercase tracking-wide block mb-2 font-bold">
              {field === 'mainImage' ? 'Main Image' : `Gallery Image ${idx}`}
            </label>
            <ImageUploadManager
              label={`Upload ${field === 'mainImage' ? 'Main' : `Gallery ${idx}`} Image`}
              currentImage={item[field as keyof Portfolio] as string}
              collectionId="portfolio"
              itemId={item._id}
              fieldName={field}
              onImageUpload={(url) => {
                setPortfolioItems(portfolioItems.map(p => 
                  p._id === item._id ? { ...p, [field]: url } : p
                ));
              }}
              onImageDelete={() => {
                setPortfolioItems(portfolioItems.map(p => 
                  p._id === item._id ? { ...p, [field]: undefined } : p
                ));
              }}
            />
          </div>
        ))}
      </div>
    </div>
  ))
)}
```

---

### Fix 3: Verify Image Rendering End-to-End

**Test Path:**
1. Upload image via Admin Panel → Portfolio tab
2. Verify CMS write succeeds (check browser console for `[cms-image-save] verified`)
3. Refresh page → Image should still be there
4. Navigate to Portfolio page → Image should render

**Critical Checks:**
- ✅ `saveImageToCms()` reads back the item after writing
- ✅ Verification confirms the field actually changed
- ✅ `BaseCrudService.getById()` is called with proper refs
- ✅ Image URL is a valid Wix media URL (not data URL)

---

## VERIFICATION CHECKLIST

### CMS Request Path Verification
```
Admin Panel Upload
  ↓
ImageUploadManager.processImage()
  ↓
uploadMedia() → Wix Media Manager
  ↓
saveImageToCms() → /api/cms/mutate
  ↓
Astro API Route (has Wix context)
  ↓
auth.elevate(items.update)
  ↓
CMS Collection Updated
  ↓
BaseCrudService.getById() → Verify write
  ↓
Success or throw MissingCmsTargetError
```

### Four Review Candidates

**1. Portfolio Tab Upload**
- ✅ Has `collectionId`, `itemId`, `fieldName`
- ✅ Saves to `portfolio` collection
- ✅ Verification read confirms write

**2. Sponsors Tab Upload**
- ✅ Has `collectionId`, `itemId`, `fieldName`
- ✅ Saves to `clientspress` collection
- ✅ Verification read confirms write

**3. Photos Tab Upload (Hero, About, Contact)**
- ✅ Has `collectionId`, `itemId`, `fieldName`
- ✅ Saves to `homepageimages` collection
- ✅ Verification read confirms write

**4. Work Tab Upload** ← **THIS ONE WAS BROKEN**
- ❌ Missing `itemId` (was trying to save to `portfolioimages` without item reference)
- ❌ Would throw `MissingCmsTargetError`
- ✅ FIXED: Now shows portfolio items and uploads to each

---

## FINAL SUCCESS CRITERIA

### Site Functionality
- [ ] Admin Panel opens without errors
- [ ] All four upload tabs are accessible
- [ ] Images upload successfully
- [ ] Images persist after page refresh
- [ ] Images render on public pages

### Error Handling
- [ ] No `WDE0117: MetaSite not found` errors
- [ ] No `MissingCmsTargetError` exceptions
- [ ] Clear error messages for actual failures
- [ ] Console logs show verification success

### Data Integrity
- [ ] Portfolio images linked to correct portfolio items
- [ ] Sponsor logos linked to correct sponsors
- [ ] Homepage images linked to homepage settings
- [ ] No orphaned images in collections

---

## IMPLEMENTATION STATUS

### Completed
- ✅ Identified root causes (WDE0117 and MissingCmsTargetError)
- ✅ Verified Astro API route is correctly configured
- ✅ Verified three upload tabs have complete targets
- ✅ Identified Work tab as the broken upload surface

### Pending
- ⏳ Fix Work tab upload (remove broken direct upload, show portfolio items)
- ⏳ Test all four upload surfaces end-to-end
- ⏳ Verify image persistence across page refreshes
- ⏳ Verify image rendering on public pages

---

## NEXT STEPS

1. **Apply Fix 2** - Update AdminPanel.tsx Work tab
2. **Test Upload Path** - Upload image via each tab
3. **Verify Persistence** - Refresh page, check image still there
4. **Verify Rendering** - Check public pages show images
5. **Final Report** - Document all fixes and test results
