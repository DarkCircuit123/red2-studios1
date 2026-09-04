# Work Gallery Manager V4 - Debug & Verification Guide

## Overview
WorkGalleryManagerV4 is a **hardcoded proof-of-concept** that proves the UI can render 90 slots with visible controls. It uses **no CMS calls, no network requests, no external dependencies** - just pure React state and hardcoded data.

## What This Proves
✅ **90 slots render** - Every slot (1-90) is visible in the grid
✅ **Controls are visible** - Upload, Replace, Delete buttons appear on hover
✅ **Grid layout works** - Responsive grid with proper spacing
✅ **Interactions work** - File selection, preview, deletion all functional
✅ **No CMS dependency** - Works without any database calls

## How to Test

### 1. Access the Admin Panel
```
Navigate to: /admin
Click on "Work Gallery" tab
```

### 2. Verify All 90 Slots Render
- Scroll through the entire grid
- Count visible slot numbers (1-90)
- Each slot should have a number badge in top-left corner
- All slots should be visible with no rendering errors

### 3. Test Upload Flow
```
1. Click upload area or drag files
2. Select 1-3 image files
3. Click "Upload" button
4. Images should appear in first available slots
5. Slot numbers should update
```

### 4. Test Replace Flow
```
1. Hover over a filled slot
2. Click the amber "Replace" button (refresh icon)
3. Select a new image
4. Image should be replaced in that slot
```

### 5. Test Delete Flow
```
1. Hover over a filled slot
2. Click the red "Delete" button (trash icon)
3. Confirm deletion
4. Slot should become empty
```

### 6. Test Preview
```
1. Hover over a filled slot
2. Click the blue "Preview" button (maximize icon)
3. Full image should appear in modal
4. Click X or outside to close
```

## Browser Console Checks

### Check for Errors
Open DevTools (F12) → Console tab
- Should see NO red errors
- May see info messages about file selection

### Check Component Rendering
```javascript
// In console, verify slots are in DOM
document.querySelectorAll('[class*="grid"]').length > 0
// Should return true

// Count visible slot badges
document.querySelectorAll('div:contains("#")').length
// Should show ~90 elements
```

## Expected Behavior

### Initial Load
- Page loads immediately (no loading spinner)
- All 90 slots visible
- All slots empty (0/90)
- Upload area ready

### After Upload
- Files appear in first available slots
- Counter updates (e.g., 3/90)
- Status message shows success
- Slots can be replaced or deleted

### Error Handling
- If file selection fails: "Selected 0 file(s)" message
- If upload fails: Error status message appears
- Slots remain stable even if operation fails
- No cascading errors

## Debugging Steps

### Issue: Slots not rendering
1. Check browser console for errors
2. Verify grid CSS is applied: `display: grid; gridTemplateColumns: repeat(auto-fill, minmax(120px, 1fr))`
3. Check that `slots` state has 90 items: `Array(90).fill(null)`

### Issue: Controls not visible on hover
1. Check hover state CSS: `group-hover:opacity-100`
2. Verify button elements render inside overlay div
3. Check z-index values (should be z-10 for overlay)

### Issue: Upload not working
1. Check file input is not hidden: `className="hidden"`
2. Verify FileReader API works: `reader.readAsDataURL(file)`
3. Check state update: `setSlots(updatedSlots)`

### Issue: Preview modal not showing
1. Check modal render condition: `{previewImage && (...)}`
2. Verify onClick handlers set state correctly
3. Check z-index: should be z-50 for modal

## Next Steps After V4 Verification

Once V4 proves the UI works:

1. **Replace hardcoded data with CMS calls**
   - Use `getAllSlots()` from diagnostics
   - Map CMS items to slot positions
   - Handle missing slots gracefully

2. **Implement real upload pipeline**
   - Use `MultiThreadedUploader`
   - Save to Wix Media Manager
   - Create CMS records with proper displayOrder

3. **Add error recovery**
   - Implement `repairGallery()` function
   - Add sync/diagnostic buttons
   - Show repair status to user

4. **Optimize performance**
   - Lazy load images
   - Virtualize grid for large datasets
   - Cache image URLs

## File Locations
- Component: `/src/components/AdminPanel/sections/WorkGalleryManagerV4.tsx`
- Admin Dashboard: `/src/components/AdminPanel/AdminDashboard.tsx`
- Diagnostics: `/src/lib/work-gallery-diagnostics.ts`

## Key Code Sections

### Hardcoded Slots Initialization
```typescript
const [slots, setSlots] = useState<SlotData[]>(() => {
  return Array.from({ length: MAX_SLOTS }, (_, i) => ({
    slotNumber: i + 1,
    image: undefined,
    caption: '',
    altText: '',
  }));
});
```

### Grid Rendering
```typescript
<div style={{
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
  gap: '12px',
  width: '100%',
  minHeight: '1200px'
}}>
  {slots.map((slot) => (
    // Slot component
  ))}
</div>
```

### Status Messages
```typescript
const addStatusMessage = (type: StatusMessage['type'], message: string) => {
  const id = crypto.randomUUID();
  setStatusMessages(prev => [...prev, { id, type, message }]);
  setTimeout(() => {
    setStatusMessages(prev => prev.filter(m => m.id !== id));
  }, 5000);
};
```

## Success Criteria

✅ All 90 slots visible and numbered
✅ Upload, Replace, Delete controls visible on hover
✅ File selection and preview work
✅ No console errors
✅ Responsive on mobile/tablet
✅ Status messages appear and disappear
✅ Grid maintains layout during interactions

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify all 90 slots are in the DOM
3. Test each control individually
4. Check network tab for any failed requests (should be none)
5. Clear browser cache and reload

---

**V4 is a proof-of-concept. Once verified, we'll integrate real CMS data and upload pipeline.**
