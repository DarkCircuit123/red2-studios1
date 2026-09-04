# Admin Panel Setup & Documentation

## Overview

A production-grade admin dashboard for managing home page content on the Wix website. Built with React, Tailwind CSS, and integrated with Wix CMS and Media Manager.

## Features Implemented (Phase 1)

### 1. Admin Dashboard Foundation
- **Location**: `/admin` route
- **Access**: Member-protected route (requires authentication)
- **Admin Check**: Verifies user is admin before granting access
- **Tab Structure**: 
  - Home Page (✅ Active)
  - About Page (Coming soon)
  - Portfolio Page (Coming soon)
  - Services Page (Coming soon)
  - Booking Page (Coming soon)
  - Contact Page (Coming soon)
  - Settings (Coming soon)

### 2. Home Page Management Tab

#### A. Hero Section Manager
**Features:**
- Upload/replace hero background image
- Drag-and-drop file upload
- Image preview before saving
- Remove existing images
- Uses Wix Media Manager for file storage
- Stores real Wix media URLs in database

**File**: `/src/components/AdminPanel/sections/HeroSectionManager.tsx`

#### B. Text Editor System
**Editable Fields:**
- Hero Title (max 100 chars)
- Hero Subtitle (max 150 chars)
- Button Text (max 50 chars)
- Section Content (max 1000 chars, multiline)

**Features:**
- Live character count
- Save/Cancel buttons
- Real-time validation
- Persistent storage in database

**File**: `/src/components/AdminPanel/sections/TextEditorSystem.tsx`

#### C. Background Music Manager
**Features:**
- Upload MP3/audio files
- Audio preview player
- Volume control (0-100%)
- Toggle music enabled/disabled
- Autoplay toggle (with browser compatibility notes)
- Loop toggle
- Music title display
- Remove music file

**File**: `/src/components/AdminPanel/sections/BackgroundMusicManager.tsx`

#### D. Home Page Preview
**Shows:**
- Live preview of hero section with current image
- Current text content
- Music status and settings
- Data summary
- Last updated timestamp
- Refresh button to reload latest data

**File**: `/src/components/AdminPanel/sections/HomePagePreview.tsx`

#### E. Reusable Image Uploader Component
**File**: `/src/components/AdminPanel/sections/ImageUploader.tsx`

**Features:**
- Drag-and-drop support
- File preview
- Upload/Replace/Remove actions
- Loading states
- Error handling

## Database Schema

### HomePageSettings Collection
**Collection ID**: `homepagesettings`

**Fields:**
```typescript
{
  _id: string;                          // Unique identifier
  _createdDate?: Date;                  // System field
  _updatedDate?: Date;                  // System field
  heroBackgroundImage?: string;         // Image URL
  heroForegroundImages?: string;        // Image URL
  heroTitle?: string;                   // Text (max 100)
  heroSubtitle?: string;                // Text (max 150)
  buttonText?: string;                  // Text (max 50)
  sectionContent?: string;              // Text (max 1000)
  musicTitle?: string;                  // Text
  backgroundMusicUrl?: string;          // URL to audio file
  musicEnabled?: boolean;               // Toggle
  autoplayEnabled?: boolean;            // Toggle
  loopMusic?: boolean;                  // Toggle
  volume?: number;                      // 0-100
  updatedDate?: Date;                   // Timestamp
}
```

**Permissions:**
- Insert: ANYONE (can be restricted to ADMIN)
- Update: ANYONE (can be restricted to ADMIN)
- Remove: ANYONE (can be restricted to ADMIN)
- Read: ANYONE

## API Endpoints

### Media Upload
**Endpoint**: `/api/media/generate-upload-url`
**Method**: POST
**Body**: `{ fileName: string, fileType: string }`
**Response**: `{ uploadUrl: string, fileId: string }`

### Get Media URL
**Endpoint**: `/api/media/get-media-url`
**Method**: GET
**Query**: `?fileId=<fileId>`
**Response**: `{ mediaUrl: string }`

## File Structure

```
/src/components/AdminPanel/
├── AdminDashboard.tsx                 # Main dashboard component
├── tabs/
│   └── HomePageTab.tsx               # Home page tab container
├── sections/
│   ├── HeroSectionManager.tsx        # Hero image management
│   ├── TextEditorSystem.tsx          # Text content editor
│   ├── BackgroundMusicManager.tsx    # Music upload & settings
│   ├── HomePagePreview.tsx           # Live preview
│   └── ImageUploader.tsx             # Reusable image uploader
└── ...

/src/pages/
└── AdminPage.tsx                      # Admin page wrapper with auth check

/src/pages/api/media/
├── generate-upload-url.ts            # Upload URL generation
└── get-media-url.ts                  # Media URL retrieval
```

## Usage

### Accessing the Admin Panel
1. Navigate to `/admin`
2. Sign in with your Wix member account
3. Verify admin permissions
4. Access the dashboard

### Managing Home Page Content

#### Upload Hero Image
1. Go to "Home Page" tab → "Hero" section
2. Click "Upload Image" or drag-and-drop
3. Preview appears automatically
4. Image is saved to Wix Media Manager
5. URL is stored in database

#### Edit Text Content
1. Go to "Home Page" tab → "Text" section
2. Edit any field (title, subtitle, button, content)
3. Character count updates in real-time
4. Click "Save Changes" to persist
5. Click "Cancel" to discard changes

#### Manage Background Music
1. Go to "Home Page" tab → "Music" section
2. Upload MP3 file
3. Use preview player to test
4. Adjust volume (0-100%)
5. Toggle: Enabled, Autoplay, Loop
6. Settings save automatically

#### Preview Changes
1. Go to "Home Page" tab → "Preview" section
2. See live preview of all changes
3. Click "Refresh Preview" to reload latest data
4. View data summary and status

## Security

### Authentication
- Uses Wix Members SDK
- Protected route with `MemberProtectedRoute`
- Requires user login

### Authorization
- Admin check on AdminPage component
- Can be customized based on user role
- Currently checks for 'admin' nickname or email

### Data Protection
- All data stored in Wix CMS
- Media files stored in Wix Media Manager
- Backend API endpoints validate requests
- No sensitive data exposed client-side

## State Management

### Data Flow
1. **Load**: Component mounts → fetch from CMS
2. **Edit**: User modifies content → local state updates
3. **Save**: User clicks save → update CMS → refresh local state
4. **Display**: Component renders from state

### Error Handling
- Try-catch blocks on all API calls
- User-friendly error messages via toast notifications
- Loading states prevent duplicate submissions
- Graceful fallbacks for missing data

## Browser Compatibility

### Autoplay Handling
- Browsers block autoplay by default
- Admin panel shows warning about browser restrictions
- Recommend user interaction before autoplay
- Fallback: Manual play button for users

### File Upload
- Supports all modern browsers
- Drag-and-drop support
- File type validation
- Size validation (handled by Wix Media Manager)

## Performance Considerations

### Optimization
- Lazy loading of components
- Suspense boundaries for code splitting
- Optimistic updates where possible
- Debounced API calls
- Image compression recommendations

### Loading States
- Spinner shown during data fetch
- Button disabled during save
- Upload progress indication
- Prevents user interaction during operations

## Testing Checklist

- [ ] Access `/admin` route
- [ ] Verify authentication required
- [ ] Verify admin permission check
- [ ] Upload hero background image
- [ ] Replace hero background image
- [ ] Remove hero background image
- [ ] Edit hero title
- [ ] Edit hero subtitle
- [ ] Edit button text
- [ ] Edit section content
- [ ] Save text changes
- [ ] Cancel text changes
- [ ] Upload music file
- [ ] Play music preview
- [ ] Adjust volume
- [ ] Toggle music enabled
- [ ] Toggle autoplay
- [ ] Toggle loop
- [ ] Remove music file
- [ ] View preview
- [ ] Refresh preview
- [ ] Verify data persists after page refresh
- [ ] Test on mobile/tablet
- [ ] Test error handling

## Future Enhancements (Phase 2+)

### About Page Tab
- About section text editor
- About section image manager
- Team members management

### Portfolio Page Tab
- Portfolio item CRUD
- Image gallery management
- Category management
- Featured items toggle

### Services Page Tab
- Service listing
- Service descriptions
- Pricing management
- Service icons/images

### Booking Page Tab
- Availability management
- Booking settings
- Email notifications
- Calendar integration

### Contact Page Tab
- Contact form settings
- Email recipient configuration
- Form field customization

### Settings Tab
- General site settings
- Admin user management
- Backup/restore
- Activity logs

## Troubleshooting

### Images Not Uploading
1. Check file size (Wix Media Manager limits)
2. Verify file format (JPG, PNG, WebP)
3. Check browser console for errors
4. Verify Wix Media Manager API access

### Music Not Playing
1. Check file format (MP3, WAV, etc.)
2. Verify browser autoplay policies
3. Check volume setting
4. Test in different browser

### Data Not Persisting
1. Verify database connection
2. Check collection permissions
3. Verify user has write access
4. Check browser console for errors

### Admin Access Denied
1. Verify user is logged in
2. Check admin permission logic
3. Verify user email/nickname matches admin criteria
4. Check MemberProtectedRoute setup

## Support

For issues or questions:
1. Check browser console for errors
2. Review API responses
3. Verify database collection exists
4. Check Wix Media Manager settings
5. Review authentication setup

## Notes

- All data is stored in Wix CMS (persistent)
- Media files are stored in Wix Media Manager
- Admin panel is responsive (desktop/tablet/mobile)
- UI follows modern SaaS design patterns
- All components are reusable and modular
