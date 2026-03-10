# Image Upload Functionality - Test Guide

## Overview
This document provides comprehensive testing instructions for the enhanced image upload system with support for multiple graphic file types across all major sections.

## Supported Image Formats
✅ **JPEG/JPG** (.jpg, .jpeg) - Standard web format
✅ **PNG** (.png) - Lossless with transparency
✅ **WebP** (.webp) - Modern compressed format
✅ **GIF** (.gif) - Animated or static
✅ **SVG** (.svg) - Vector graphics
✅ **TIFF** (.tiff, .tif) - High-quality archival
✅ **BMP** (.bmp) - Bitmap format
✅ **HEIC/HEIF** (.heic, .heif) - Apple formats
✅ **ICO** (.ico) - Icon format
✅ **PSD** (.psd) - Photoshop files

## Upload Constraints
- **Maximum file size:** 50MB
- **Drag & drop support:** Yes
- **Click to upload:** Yes
- **Auto-save to CMS:** Yes
- **Real-time preview:** Yes

## Testing Sections

### 1. Hero Image Upload
**Location:** Admin Panel → Site Photos Tab
**CMS Collection:** `homepageimages`
**Field:** `heroImage`

**Test Steps:**
1. Click the settings icon in the header
2. Navigate to "Site Photos" tab
3. Find "Hero Background Image" section
4. Try uploading with different formats:
   - JPG (recommended)
   - PNG with transparency
   - WebP (modern format)
   - SVG (vector)
5. Verify image appears in hero section immediately
6. Check that image persists after page refresh

**Expected Results:**
- ✅ Image uploads successfully
- ✅ Preview shows in admin panel
- ✅ Hero section updates in real-time
- ✅ File size validation works
- ✅ Unsupported formats show error message

---

### 2. About Section Image Upload
**Location:** Admin Panel → Site Photos Tab
**CMS Collection:** `homepageimages`
**Field:** `aboutSectionImage`

**Test Steps:**
1. In Admin Panel, go to "Site Photos" tab
2. Find "About Section Image" section
3. Upload various formats:
   - PNG (for transparency)
   - JPG (for photos)
   - WebP (for optimization)
4. Verify image appears in about section
5. Test drag & drop functionality

**Expected Results:**
- ✅ Image uploads and displays
- ✅ Drag & drop works smoothly
- ✅ Processing indicator shows during upload
- ✅ Success message appears after upload

---

### 3. Contact Section Background Upload
**Location:** Admin Panel → Site Photos Tab
**CMS Collection:** `homepageimages`
**Field:** `contactBackgroundImage`

**Test Steps:**
1. In Admin Panel, go to "Site Photos" tab
2. Find "Contact Section Background" section
3. Upload background image:
   - Try JPG for photos
   - Try PNG for graphics
   - Try WebP for optimization
4. Verify background appears in contact section
5. Check text readability over background

**Expected Results:**
- ✅ Background image loads correctly
- ✅ Text remains readable
- ✅ Image scales responsively

---

### 4. Portfolio Images Upload
**Location:** Admin Panel → Portfolio Tab
**CMS Collection:** `portfolio`
**Fields:** `mainImage`, `galleryImage1`, `galleryImage2`, `galleryImage3`

**Test Steps:**
1. In Admin Panel, click "Portfolio" tab
2. For each portfolio item, upload:
   - **Main Image:** Project thumbnail
   - **Gallery Image 1-3:** Additional project photos
3. Test with different formats:
   - JPG for photos
   - PNG for graphics
   - WebP for optimization
4. Verify images appear in:
   - Portfolio grid
   - Portfolio detail pages
   - 3D gallery section

**Expected Results:**
- ✅ All 4 images per project upload successfully
- ✅ Images display in correct locations
- ✅ Gallery navigation works smoothly
- ✅ Images load quickly

**Portfolio Upload Checklist:**
- [ ] Main image uploads
- [ ] Gallery image 1 uploads
- [ ] Gallery image 2 uploads
- [ ] Gallery image 3 uploads
- [ ] Images appear in portfolio grid
- [ ] Images appear in detail page
- [ ] Images appear in 3D gallery
- [ ] All formats work (JPG, PNG, WebP)

---

### 5. Sponsor/Clients Logo Upload
**Location:** Admin Panel → Sponsors Tab
**CMS Collection:** `clientspress`
**Field:** `clientLogo`

**Test Steps:**
1. In Admin Panel, click "Sponsors" tab
2. For each sponsor, upload logo:
   - PNG (for transparency)
   - SVG (for scalability)
   - JPG (for photos)
3. Verify logos appear in:
   - Sponsors section grid
   - Sponsor hover states
4. Test with high-resolution logos

**Expected Results:**
- ✅ Logos upload successfully
- ✅ Logos display in sponsors section
- ✅ Hover effects work
- ✅ Logos scale properly on mobile

**Sponsors Upload Checklist:**
- [ ] Logo uploads for each sponsor
- [ ] Logos appear in grid
- [ ] Hover overlay works
- [ ] Logos responsive on mobile
- [ ] SVG logos scale correctly
- [ ] PNG logos with transparency work

---

## File Format Testing Matrix

| Format | Extension | Test File | Expected Result |
|--------|-----------|-----------|-----------------|
| JPEG | .jpg | photo.jpg | ✅ Upload & display |
| PNG | .png | graphic.png | ✅ Upload & display |
| WebP | .webp | modern.webp | ✅ Upload & display |
| GIF | .gif | animation.gif | ✅ Upload & display |
| SVG | .svg | vector.svg | ✅ Upload & display |
| TIFF | .tiff | archive.tiff | ✅ Upload & display |
| BMP | .bmp | bitmap.bmp | ✅ Upload & display |
| HEIC | .heic | iphone.heic | ✅ Upload & display |
| PSD | .psd | photoshop.psd | ✅ Upload & display |

---

## Error Handling Tests

### Test 1: Unsupported File Type
**Action:** Try uploading a .txt or .pdf file
**Expected:** Error message: "Unsupported file type"
**Result:** ✅ Pass / ❌ Fail

### Test 2: File Size Exceeded
**Action:** Try uploading file > 50MB
**Expected:** Error message: "File size exceeds 50MB limit"
**Result:** ✅ Pass / ❌ Fail

### Test 3: Corrupted File
**Action:** Try uploading corrupted image file
**Expected:** Error message or graceful failure
**Result:** ✅ Pass / ❌ Fail

### Test 4: Network Error
**Action:** Disconnect internet during upload
**Expected:** Error message and retry option
**Result:** ✅ Pass / ❌ Fail

---

## Performance Tests

### Test 1: Large File Upload
- Upload 10MB JPG file
- Measure upload time
- Verify no UI freezing
- **Expected:** < 5 seconds, smooth UI

### Test 2: Multiple Uploads
- Upload 5 images in sequence
- Verify each completes successfully
- Check CMS updates correctly
- **Expected:** All succeed, no conflicts

### Test 3: Rapid Uploads
- Upload same field multiple times quickly
- Verify last upload wins
- Check no data corruption
- **Expected:** Smooth handling, correct final state

---

## Responsive Design Tests

### Mobile (iPhone 12)
- [ ] Admin panel opens on mobile
- [ ] Image upload works on mobile
- [ ] Drag & drop works (if supported)
- [ ] Preview displays correctly
- [ ] Success message visible

### Tablet (iPad)
- [ ] All upload features work
- [ ] Layout is readable
- [ ] Touch interactions smooth
- [ ] Images display properly

### Desktop (1920x1080)
- [ ] All features fully functional
- [ ] Admin panel layout optimal
- [ ] Images preview clearly
- [ ] No overflow issues

---

## Real-Time Update Tests

### Test 1: Hero Image Update
1. Upload new hero image
2. Refresh page
3. Verify new image persists
4. Check other pages still show update

### Test 2: Portfolio Image Update
1. Upload new portfolio image
2. Navigate to portfolio page
3. Verify image displays
4. Check detail page shows update

### Test 3: Sponsor Logo Update
1. Upload new sponsor logo
2. Navigate to sponsors section
3. Verify logo displays
4. Check hover state works

---

## Browser Compatibility Tests

| Browser | Version | Status |
|---------|---------|--------|
| Chrome | Latest | ✅ Test |
| Firefox | Latest | ✅ Test |
| Safari | Latest | ✅ Test |
| Edge | Latest | ✅ Test |
| Mobile Safari | Latest | ✅ Test |
| Chrome Mobile | Latest | ✅ Test |

---

## Accessibility Tests

- [ ] Upload button has proper ARIA labels
- [ ] Error messages are announced
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA
- [ ] Screen reader compatible

---

## Test Results Summary

**Date:** _______________
**Tester:** _______________

### Overall Status
- [ ] ✅ All tests passed
- [ ] ⚠️ Some tests failed (see below)
- [ ] ❌ Critical issues found

### Failed Tests (if any)
1. _______________________________
2. _______________________________
3. _______________________________

### Notes
_________________________________________________________________
_________________________________________________________________
_________________________________________________________________

---

## Quick Test Checklist

**Before Deployment:**
- [ ] Hero image upload works
- [ ] Portfolio images upload (all 4 fields)
- [ ] Sponsor logos upload
- [ ] About section image uploads
- [ ] Contact background uploads
- [ ] All formats supported (JPG, PNG, WebP, SVG, etc.)
- [ ] File size validation works
- [ ] Error messages display correctly
- [ ] Images persist after refresh
- [ ] Mobile responsive
- [ ] No console errors
- [ ] Admin panel tabs switch smoothly
- [ ] Real-time updates work

---

## Support & Troubleshooting

### Issue: Image doesn't upload
**Solution:** 
1. Check file format is supported
2. Verify file size < 50MB
3. Check browser console for errors
4. Try different browser

### Issue: Image uploads but doesn't display
**Solution:**
1. Refresh page
2. Check CMS dashboard for image
3. Verify field name is correct
4. Check image URL in browser dev tools

### Issue: Drag & drop not working
**Solution:**
1. Try click to upload instead
2. Check browser supports drag & drop
3. Verify file is valid image
4. Try different browser

---

## Deployment Checklist

- [ ] All image upload features tested
- [ ] Error handling verified
- [ ] Performance acceptable
- [ ] Mobile responsive
- [ ] Browser compatibility confirmed
- [ ] Accessibility standards met
- [ ] No console errors
- [ ] CMS integration working
- [ ] Real-time updates functional
- [ ] Documentation complete

**Ready for Production:** ✅ Yes / ❌ No
