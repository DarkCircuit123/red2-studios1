# Admin Login Fix & Behind The Scenes Photo Upload Implementation

## Summary
Fixed the 500 server error in admin login and implemented photo upload functionality for the Behind The Scenes section.

## Issues Fixed

### 1. Admin Login Server Error (500)
**Problem:** The admin login endpoint was throwing an unhandled error when `signAdminToken()` failed due to missing `SESSION_SECRET`.

**Root Cause:** 
- `signAdminToken()` throws an error if `SESSION_SECRET` is not configured
- The error was not being caught in `/src/pages/api/auth/admin-login.ts`
- This caused a 500 error instead of a proper error response

**Solution:**
- Added try-catch block around `signAdminToken()` in `/src/pages/api/auth/admin-login.ts`
- Returns a proper 500 error response with message "Failed to create session token"
- Logs the error for debugging

**File Modified:**
- `/src/pages/api/auth/admin-login.ts` - Added error handling for token signing

## Features Implemented

### 2. Behind The Scenes Photo Upload Manager
**What was added:**
- New component: `/src/components/AdminPanel/sections/BehindTheScenesManager.tsx`
- Allows admins to upload, delete, and edit photos in the Behind The Scenes section
- Integrated into the Admin Panel with a new "Behind Scenes" tab

**Features:**
- Upload photos to individual Behind The Scenes items
- Delete photos from items
- Edit title and description for each item
- Real-time preview of uploaded images
- Loading states and error handling
- Uses Wix Media Manager for image storage (CSP-compliant)

**How it works:**
1. Admin clicks "Upload" button on a Behind The Scenes item
2. Selects an image file (JPEG, PNG, WebP)
3. Image is uploaded to Wix Media Manager via `/api/media/upload-hero`
4. Image URL is saved to the CMS collection `behindthescenes`
5. Changes are reflected immediately on the homepage

**Files Modified:**
- `/src/components/AdminPanel.tsx` - Added BehindTheScenesManager import and tab
- `/src/components/AdminPanel/sections/BehindTheScenesManager.tsx` - New component

## Technical Details

### Image Upload Flow
1. User selects file in BehindTheScenesManager
2. File is sent to `/api/media/upload-hero` endpoint
3. Endpoint validates file (type, size) and uploads to Wix Media
4. Returns `mediaUrl` which is saved to CMS
5. Component reloads data to show updated image

### CMS Integration
- Uses `BaseCrudService` to fetch and update `behindthescenes` collection
- Supports all BehindTheScenes fields: photo, title, description, order, dateTaken
- Changes are persisted to the database immediately

### Admin Panel Integration
- New tab "Behind Scenes" in the Admin Panel
- Accessible only to authenticated admins
- Displays all Behind The Scenes items with their current photos
- Allows inline editing of title and description

## Testing Checklist

- [ ] Admin can log in without 500 error
- [ ] Admin panel opens successfully after login
- [ ] "Behind Scenes" tab is visible in Admin Panel
- [ ] Can upload photos to Behind The Scenes items
- [ ] Photos appear immediately after upload
- [ ] Can delete photos from items
- [ ] Can edit title and description
- [ ] Changes persist after page refresh
- [ ] Photos display correctly on homepage

## Environment Requirements

For login to work, ensure `SESSION_SECRET` is configured:
- In development: Set in `.env` file
- In production: Set in Wix Secrets Manager

Example:
```
SESSION_SECRET=your-random-32-character-secret-here
```

## Notes

- The upload endpoint requires admin authentication
- Images are stored in Wix Media Manager (not in CMS)
- Image URLs are CSP-compliant and use the `<Image>` component
- All changes are optimistic (UI updates immediately, reverts on error)
