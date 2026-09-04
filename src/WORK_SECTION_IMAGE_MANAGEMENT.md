# Work Section - Image Management Guide

## Overview
All images in the **Work section** (under "All Photos") are fully changeable through the admin panel. The system is already configured to manage portfolio images dynamically from the CMS.

## How It Works

### 1. **Frontend (WorkPage.tsx)**
- Automatically fetches all portfolio items from the `portfolio` CMS collection
- Displays projects in a responsive grid layout
- Images are loaded dynamically from the database (not hardcoded)

### 2. **Admin Panel (AdminPanel.tsx)**
- **Portfolio Tab** allows you to manage all portfolio images
- Each project can have up to 4 images:
  - **Main Image** - Primary project image (displayed in the grid)
  - **Gallery Image 1, 2, 3** - Additional project images

### 3. **CMS Collection (portfolio)**
The `portfolio` collection contains:
- `projectName` - Project title
- `shortDescription` - Brief description
- `mainImage` - Main project image
- `galleryImage1`, `galleryImage2`, `galleryImage3` - Gallery images
- Other metadata fields

## How to Change Images

### Via Admin Panel:
1. Click the **Settings icon** (⚙️) in the header
2. Enter your admin credentials (if not already logged in)
3. Click the **"Portfolio"** tab
4. Find the project you want to edit
5. Click **"Upload"** on any image field to replace it
6. Select a new image from your computer
7. The image updates automatically

### Via CMS Dashboard:
1. Go to https://manage.wix.com/dashboard
2. Navigate to **Database** → **Portfolio** collection
3. Click on a project to edit
4. Update the image fields directly
5. Save changes

## Image Fields

Each portfolio project has these image slots:

| Field | Purpose | Used In |
|-------|---------|---------|
| `mainImage` | Primary project image | Work page grid display |
| `galleryImage1` | First gallery image | Portfolio detail view |
| `galleryImage2` | Second gallery image | Portfolio detail view |
| `galleryImage3` | Third gallery image | Portfolio detail view |

## Adding New Projects

To add new projects to the Work section:

1. Go to **CMS Dashboard** (https://manage.wix.com/dashboard)
2. Navigate to **Database** → **Portfolio**
3. Click **"Add Item"**
4. Fill in:
   - `projectName` - Project title
   - `shortDescription` - Brief description
   - `mainImage` - Upload main image
   - `galleryImage1`, `galleryImage2`, `galleryImage3` - Upload gallery images
5. Save the item

The new project will automatically appear in the Work section.

## Supported Image Formats

- JPEG (.jpg, .jpeg)
- PNG (.png)
- WebP (.webp)
- GIF (.gif)
- SVG (.svg)
- TIFF (.tiff, .tif)
- BMP (.bmp)
- ICO (.ico)
- PSD (.psd)
- HEIC (.heic)
- HEIF (.heif)

## Technical Details

### Data Flow:
```
Admin Panel (Portfolio Tab)
    ↓
ImageUploadManager Component
    ↓
BaseCrudService.update() → CMS API
    ↓
Portfolio Collection Updated
    ↓
WorkPage fetches updated data
    ↓
Images display in Work section
```

### Key Components:
- **WorkPage.tsx** - Displays portfolio items
- **AdminPanel.tsx** - Portfolio tab for image management
- **ImageUploadManager.tsx** - Handles image uploads
- **BaseCrudService** - CMS data operations

## Troubleshooting

### Images not updating?
1. Clear browser cache (Ctrl+Shift+Delete or Cmd+Shift+Delete)
2. Refresh the page
3. Check admin panel for upload errors

### Can't upload images?
1. Ensure image is in a supported format
2. Check file size (should be reasonable)
3. Verify you're logged in as admin
4. Try uploading via CMS dashboard directly

### Images not showing in Work section?
1. Verify `mainImage` field is filled for the project
2. Check that the image URL is valid
3. Ensure project has `projectName` set
4. Refresh the page

## Admin Access

To access the admin panel:
1. Click the **Settings icon** (⚙️) in the header
2. Enter admin credentials:
   - Username: Stored in Wix Secrets Manager
   - Password: Stored in Wix Secrets Manager
3. Once logged in, click **"Portfolio"** tab

## Notes

- All changes are saved immediately to the CMS
- Images are stored in Wix's media storage
- The Work page automatically reflects all changes
- No manual deployment needed - changes are live instantly
