# Settings Tab - Quick Reference Guide

## 🚀 Quick Start

### Access the Settings Tab
1. Navigate to `/admin` page
2. Click on "Settings" tab in the admin panel
3. Form will load with current settings or defaults

### File Locations
```
Component:     /src/components/AdminPanel/sections/SettingsManager.tsx
API Routes:    /src/pages/api/cms/get-sitesettings.ts
               /src/pages/api/cms/mutate-sitesettings.ts
Integration:   /src/components/AdminPanel/AdminDashboard.tsx
CMS Collection: sitesettings (in Wix CMS)
```

---

## 📋 Form Fields

### General Section
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Site Name | Text | Yes | Max 100 chars |
| Primary Color | Color/Hex | No | Valid hex code |

### SEO Section
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| SEO Title | Text | No | Recommended max 60 chars |
| SEO Description | Textarea | No | Recommended max 160 chars |

### Social Media Section
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Instagram Link | URL | No | Valid URL format |
| Twitter Link | URL | No | Valid URL format |
| Facebook Link | URL | No | Valid URL format |
| LinkedIn Link | URL | No | Valid URL format |

### Contact Section
| Field | Type | Required | Validation |
|-------|------|----------|-----------|
| Contact Email | Email | No | Valid email format |
| Contact Phone | Phone | No | Valid phone format |

---

## 🔌 API Endpoints

### GET /api/cms/get-sitesettings
**Purpose:** Fetch all site settings

**Response:**
```json
{
  "success": true,
  "items": [
    {
      "_id": "uuid",
      "siteName": "My Site",
      "seoTitle": "...",
      "seoDescription": "...",
      "instagramLink": "...",
      "twitterLink": "...",
      "facebookLink": "...",
      "linkedInLink": "...",
      "contactEmail": "...",
      "contactPhone": "...",
      "primaryColor": "#000000",
      "_createdDate": "2026-09-09T...",
      "_updatedDate": "2026-09-09T..."
    }
  ],
  "totalCount": 1
}
```

### POST /api/cms/mutate-sitesettings
**Purpose:** Create or update site settings

**Request:**
```json
{
  "_id": "optional-uuid-for-update",
  "siteName": "My Site",
  "seoTitle": "...",
  "seoDescription": "...",
  "instagramLink": "...",
  "twitterLink": "...",
  "facebookLink": "...",
  "linkedInLink": "...",
  "contactEmail": "...",
  "contactPhone": "...",
  "primaryColor": "#000000"
}
```

**Response:**
```json
{
  "success": true,
  "data": { ...updated settings... }
}
```

---

## 🧪 Testing

### Basic Test Flow
1. **Load Settings**
   - Navigate to Settings tab
   - Verify form loads with loading spinner
   - Verify form displays after loading

2. **Create Settings**
   - Fill in all fields
   - Click Save
   - Verify success message
   - Refresh page and verify data persists

3. **Update Settings**
   - Change a field value
   - Click Save
   - Verify success message
   - Verify change persists

4. **Validation**
   - Leave Site Name empty and try to save
   - Enter invalid email and try to save
   - Enter invalid URL and try to save
   - Verify error messages display

5. **Reset**
   - Make changes
   - Click Reset
   - Verify changes revert

---

## 🐛 Troubleshooting

### Settings Not Loading
**Problem:** Form shows loading spinner but never loads
**Solution:**
1. Check browser console for errors
2. Verify API route is accessible: `/api/cms/get-sitesettings`
3. Verify CMS collection `sitesettings` exists
4. Check network tab for failed requests

### Save Fails
**Problem:** Save button doesn't work or shows error
**Solution:**
1. Check browser console for errors
2. Verify all required fields are filled
3. Verify validation passes
4. Check network tab for API response
5. Verify API route is accessible: `/api/cms/mutate-sitesettings`

### Validation Not Working
**Problem:** Invalid data is accepted
**Solution:**
1. Check browser console for errors
2. Verify validateSettings() function is called
3. Check error state updates
4. Clear browser cache and reload

### Data Not Persisting
**Problem:** Changes don't persist after page refresh
**Solution:**
1. Check browser console for errors
2. Verify save was successful (check success message)
3. Verify API response contains updated data
4. Check CMS collection for data

---

## 💡 Common Tasks

### Add a New Field
1. Add field to `sitesettings` CMS collection
2. Update `SiteSettings` interface in SettingsManager.tsx
3. Add input element to form
4. Add validation rule if needed
5. Update API routes to handle new field

### Change Validation Rule
1. Locate validation rule in `validateSettings()` function
2. Modify validation logic
3. Update error message
4. Test with invalid data

### Customize Styling
1. Modify Tailwind classes in SettingsManager.tsx
2. Use admin theme colors (admin-bg, admin-text, etc.)
3. Maintain consistency with admin panel
4. Test on mobile and desktop

### Add New Section
1. Create new section div in form
2. Add section title and description
3. Add form fields for section
4. Add validation rules
5. Style consistently with other sections

---

## 📊 State Management

### Key States
```typescript
settings           // Current form data
originalSettings   // Original data (for reset)
isLoading         // Loading during fetch
isSaving          // Loading during save
errors            // Array of validation errors
successMessage    // Success feedback text
hasChanges        // Tracks if form has changes
```

### State Flow
```
Component Mount
    ↓
loadSettings() → isLoading = true
    ↓
API Call → fetch settings
    ↓
Response → settings = data, isLoading = false
    ↓
User Input → handleInputChange()
    ↓
hasChanges = true → Save button enabled
    ↓
Save Click → handleSave()
    ↓
Validate → validateSettings()
    ↓
API Call → POST to mutate-sitesettings
    ↓
Success → successMessage, originalSettings = data
    ↓
Auto-dismiss → successMessage = '' after 5s
```

---

## 🔒 Validation Rules

### Site Name
- **Required:** Yes
- **Max Length:** 100 characters
- **Error:** "Site Name is required" or "Site Name must be 100 characters or less"

### SEO Title
- **Required:** No
- **Recommended Max:** 60 characters
- **Error:** "SEO Title should be 60 characters or less (recommended)"

### SEO Description
- **Required:** No
- **Recommended Max:** 160 characters
- **Error:** "SEO Description should be 160 characters or less (recommended)"

### URLs (Instagram, Twitter, Facebook, LinkedIn)
- **Required:** No
- **Format:** Valid URL
- **Validation:** Uses URL constructor
- **Error:** "[Platform] must be a valid URL"

### Contact Email
- **Required:** No
- **Format:** Valid email
- **Regex:** `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- **Error:** "Contact Email must be a valid email address"

### Contact Phone
- **Required:** No
- **Format:** Valid phone number
- **Regex:** `/^[\d\s\-\+\(\)]+$/`
- **Error:** "Contact Phone must contain only numbers and common phone characters"

### Primary Color
- **Required:** No
- **Format:** Valid hex color
- **Regex:** `/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/`
- **Formats:** #RRGGBB or #RGB
- **Error:** "Primary Color must be a valid hex color code (e.g., #000000)"

---

## 🎨 Styling Reference

### Admin Theme Colors
```css
bg-admin-bg          /* Main background */
bg-admin-surface     /* Surface/card background */
bg-admin-raise       /* Raised/input background */
text-admin-text      /* Main text */
text-admin-dim       /* Dimmed text */
text-admin-faint     /* Faint text */
border-admin-line    /* Border color */
text-oxblood         /* Accent color */
text-oxblood-hi      /* Accent hover */
text-ok              /* Success color */
text-danger          /* Error color */
```

### Common Classes
```css
/* Inputs */
bg-admin-raise border border-admin-line text-admin-text
focus:border-oxblood focus:ring-1 focus:ring-oxblood/50

/* Buttons */
bg-oxblood text-admin-text hover:bg-oxblood-hi
disabled:opacity-50 disabled:cursor-not-allowed

/* Text */
font-heading text-[13px] uppercase tracking-[0.1em]
text-admin-faint text-[11px]
```

---

## 📱 Responsive Breakpoints

### Mobile (< 640px)
- Single column layout
- Full-width inputs
- Stacked sections
- Smaller font sizes

### Tablet (640px - 1024px)
- Single column layout
- Full-width inputs
- Stacked sections
- Medium font sizes

### Desktop (> 1024px)
- Single column layout (form is vertical)
- Full-width inputs
- Organized sections
- Standard font sizes

---

## ⚡ Performance Tips

### Optimization
- Component uses React.memo for inputs (if needed)
- Validation is debounced (not on every keystroke)
- API calls are minimized
- State updates are batched

### Best Practices
- Don't call loadSettings() multiple times
- Use handleInputChange() for all input updates
- Validate before saving
- Clear errors when user types

---

## 🔗 Related Files

### Main Component
- `/src/components/AdminPanel/sections/SettingsManager.tsx`

### API Routes
- `/src/pages/api/cms/get-sitesettings.ts`
- `/src/pages/api/cms/mutate-sitesettings.ts`

### Integration
- `/src/components/AdminPanel/AdminDashboard.tsx`

### Documentation
- `/src/SETTINGS_TAB_IMPLEMENTATION.md`
- `/src/SETTINGS_IMPLEMENTATION_PROGRESS.md`
- `/src/SETTINGS_VERIFICATION_CHECKLIST.md`
- `/src/SETTINGS_DEPLOYMENT_SUMMARY.md`
- `/src/SETTINGS_QUICK_REFERENCE.md` (this file)

### CMS Collection
- Collection ID: `sitesettings`
- Access: Wix CMS Dashboard

---

## 🆘 Getting Help

### Check Documentation
1. Read SETTINGS_TAB_IMPLEMENTATION.md for technical details
2. Read SETTINGS_IMPLEMENTATION_PROGRESS.md for implementation notes
3. Read SETTINGS_VERIFICATION_CHECKLIST.md for testing info
4. Read SETTINGS_DEPLOYMENT_SUMMARY.md for deployment info

### Check Code
1. Review SettingsManager.tsx for component logic
2. Review API routes for backend logic
3. Check AdminDashboard.tsx for integration

### Debug
1. Check browser console for errors
2. Check network tab for API calls
3. Check CMS collection for data
4. Add console.log() for debugging

---

## ✅ Checklist for New Developers

- [ ] Read this Quick Reference
- [ ] Read SETTINGS_TAB_IMPLEMENTATION.md
- [ ] Review SettingsManager.tsx code
- [ ] Review API routes code
- [ ] Test Settings tab in admin panel
- [ ] Test creating/updating settings
- [ ] Test validation
- [ ] Test error handling
- [ ] Understand state management
- [ ] Understand validation system

---

**Quick Reference Complete** ✅
**Ready to Use** 🚀
