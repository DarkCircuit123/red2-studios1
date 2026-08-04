# Splashpage Logo Management System

## Overview

The Splashpage system is a production-ready CMS and admin panel integration for managing splash page logos. It provides:

- **CMS Collection**: `splashpage` - stores logo assets with metadata
- **Admin Panel Tab**: Dedicated UI for authenticated admins to upload and manage logos
- **Frontend Component**: Dynamic logo loading from CMS
- **Security**: Server-side admin verification for all operations
- **Real Wix Integration**: Uses native Wix Media Upload API

## Architecture

### 1. CMS Collection: `splashpage`

**Collection ID**: `splashpage`

**Fields**:
- `logoImage` (IMAGE) - The logo file URL from Wix Media
- `logoName` (TEXT) - Name/title of the logo
- `altText` (TEXT) - Accessibility alt text for the image
- `updatedDate` (DATETIME) - When the logo was last updated
- `isActive` (BOOLEAN) - Whether this logo is currently active

**Key Rules**:
- Only ONE logo should have `isActive: true` at any time
- When uploading a new logo, the system automatically deactivates the previous active logo
- All data is stored in the real Wix CMS (no hardcoded URLs or placeholders)

### 2. Admin Panel Integration

**Location**: `/src/components/AdminPanel/tabs/SplashpageTab.tsx`

**Features**:
- Clean, modern Wix-style interface
- Logo preview area showing current active logo
- File upload with drag-and-drop support
- Real-time preview of selected file before upload
- Save/Publish button with loading states
- Delete logo option with confirmation
- Success/error notifications
- Responsive design with smooth animations

**Access Control**:
- Only authenticated admins can access this tab
- Protected by existing admin authentication system
- Server-side verification on all operations

### 3. Frontend Components

#### SplashpageLogo Component
**Location**: `/src/components/SplashpageLogo.tsx`

Renders the active splash page logo dynamically from CMS.

```tsx
import SplashpageLogo from '@/components/SplashpageLogo';

// Basic usage
<SplashpageLogo />

// With custom dimensions
<SplashpageLogo width={300} height={150} className="my-custom-class" />
```

**Props**:
- `className` (string, optional) - CSS classes for styling
- `width` (number, optional) - Image width in pixels (default: 200)
- `height` (number, optional) - Image height in pixels (default: 100)

**Behavior**:
- Loads active logo on mount
- Shows loading skeleton while fetching
- Fails gracefully if no logo exists (returns null)
- Automatically handles image optimization via Wix

#### useSplashpageLogo Hook
**Location**: `/src/hooks/useSplashpageLogo.ts`

Custom React hook for accessing splash page logo data.

```tsx
import { useSplashpageLogo } from '@/hooks/useSplashpageLogo';

function MyComponent() {
  const { logo, isLoading, error, refetch } = useSplashpageLogo();

  if (isLoading) return <div>Loading...</div>;
  if (error || !logo) return null;

  return (
    <img 
      src={logo.logoImage} 
      alt={logo.altText}
    />
  );
}
```

**Return Values**:
- `logo` (Splashpage | null) - The active logo object
- `isLoading` (boolean) - Whether data is being fetched
- `error` (boolean) - Whether an error occurred
- `refetch` (function) - Manually refetch the logo

### 4. Upload Workflow

**Step-by-step process**:

1. **Admin opens Admin Panel** → Navigates to "Splash Page" tab
2. **Admin selects file** → Clicks upload area or drags file
3. **File preview** → Image preview appears before upload
4. **Admin clicks Save** → Triggers upload process
5. **File validation** → Server validates file type and size
6. **Wix Media Upload** → File uploaded to Wix Media Manager
7. **CMS Update** → New logo entry created in `splashpage` collection
8. **Previous logo deactivated** → Old active logo set to `isActive: false`
9. **Success notification** → Admin sees confirmation
10. **Frontend updates** → Website immediately uses new logo

### 5. Security Implementation

**Server-side Verification**:
- All upload operations verified via admin authentication
- File type validation (images only)
- File size limits (max 10MB)
- Domain validation for upload URLs (Wix domains only)

**Admin-only Access**:
- Admin Panel tab only visible to authenticated admins
- CMS operations protected by existing admin auth system
- No client-side-only security measures

**Data Validation**:
- File MIME type checked before upload
- File size validated (max 10MB)
- Upload URL domain verified to be Wix
- Media URL domain verified to be Wix

## Usage Examples

### Example 1: Display Logo in Splash Page Component

```tsx
import SplashpageLogo from '@/components/SplashpageLogo';

export default function SplashPage() {
  return (
    <div className="splash-container">
      <SplashpageLogo 
        width={400} 
        height={200} 
        className="mx-auto mb-8"
      />
      <h1>Welcome to Our Site</h1>
    </div>
  );
}
```

### Example 2: Use Hook for Custom Implementation

```tsx
import { useSplashpageLogo } from '@/hooks/useSplashpageLogo';
import { Image } from '@/components/ui/image';

export default function CustomSplashLogo() {
  const { logo, isLoading, error, refetch } = useSplashpageLogo();

  if (isLoading) {
    return <div className="animate-pulse bg-gray-200 h-32 w-32" />;
  }

  if (error || !logo?.logoImage) {
    return null;
  }

  return (
    <div className="flex flex-col items-center">
      <Image
        src={logo.logoImage}
        alt={logo.altText || 'Logo'}
        width={300}
        height={150}
      />
      <p className="text-sm text-gray-500 mt-2">{logo.logoName}</p>
      <button 
        onClick={refetch}
        className="text-xs text-blue-600 mt-2"
      >
        Refresh
      </button>
    </div>
  );
}
```

### Example 3: Admin Panel Access

The Splashpage tab is automatically available in the Admin Panel:

1. Navigate to `/admin`
2. Click on "Splash Page" tab
3. Upload, preview, and save new logo
4. Delete existing logo if needed

## API Endpoints

### Upload Endpoint
**POST** `/api/media/upload-hero`

Handles file upload to Wix Media Manager.

**Request**:
```json
{
  "fileName": "logo.png",
  "fileSize": 102400,
  "mimeType": "image/png"
}
```

**Response**:
```json
{
  "uploadUrl": "https://wix-media-upload.wix.com/...",
  "fileId": "wix-file-id-123"
}
```

**Security**:
- Requires admin authentication
- Validates file type and size
- Returns signed upload URL from Wix

## Database Schema

### Splashpage Collection

```typescript
interface Splashpage {
  _id: string;                    // Unique identifier
  logoImage: string;              // Wix Media file URL
  logoName: string;               // Logo name/title
  altText: string;                // Accessibility text
  updatedDate: Date | string;     // Last update timestamp
  isActive: boolean;              // Currently active flag
  _createdDate?: Date;            // System field
  _updatedDate?: Date;            // System field
  _owner?: string;                // System field
}
```

## Error Handling

### Frontend Errors

**No logo exists**:
- `SplashpageLogo` component returns `null`
- Page continues to render without logo
- No breaking errors

**Network error**:
- `useSplashpageLogo` hook sets `error: true`
- Component can handle gracefully
- Retry via `refetch()` function

**Upload failure**:
- User sees error notification
- File remains selected for retry
- Can try again or cancel

### Server Errors

**Invalid file type**:
```
Error: File type not supported. Allowed: JPEG, PNG, WebP
```

**File too large**:
```
Error: File too large. Max 10MB, received 15.2MB
```

**Upload URL generation failed**:
```
Error: Failed to generate upload URL from Wix Media Manager
```

## Performance Considerations

1. **Lazy Loading**: Logo component uses React lazy loading
2. **Image Optimization**: Wix automatically optimizes images
3. **Caching**: Browser caches logo images
4. **No Polling**: Logo only fetched once on component mount
5. **Minimal Bundle**: Component is lightweight (~2KB)

## Maintenance

### Checking Active Logo

```typescript
import { BaseCrudService } from '@/integrations';
import { Splashpage } from '@/entities';

const result = await BaseCrudService.getAll<Splashpage>('splashpage');
const activeLogo = result.items.find(item => item.isActive);
console.log('Active logo:', activeLogo);
```

### Manually Deactivating Logo

```typescript
import { BaseCrudService } from '@/integrations';
import { Splashpage } from '@/entities';

await BaseCrudService.update<Splashpage>('splashpage', {
  _id: 'logo-id',
  isActive: false
});
```

### Deleting Old Logos

```typescript
import { BaseCrudService } from '@/integrations';

// Get all inactive logos
const result = await BaseCrudService.getAll<Splashpage>('splashpage');
const inactiveLogos = result.items.filter(item => !item.isActive);

// Delete each
for (const logo of inactiveLogos) {
  await BaseCrudService.delete('splashpage', logo._id);
}
```

## Troubleshooting

### Logo not appearing on frontend

1. Check if logo exists in CMS: `splashpage` collection
2. Verify `isActive: true` on the logo
3. Check browser console for errors
4. Verify image URL is accessible
5. Try refreshing the page

### Admin can't upload logo

1. Verify admin is authenticated
2. Check file size (max 10MB)
3. Check file type (PNG, JPG, WebP only)
4. Check browser console for error messages
5. Verify Wix Media API is accessible

### Logo shows but doesn't update

1. Clear browser cache
2. Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
3. Check if new logo was saved to CMS
4. Verify old logo was deactivated
5. Check network tab for failed requests

## Future Enhancements

Potential improvements:

1. **Multiple Logos**: Support different logos for different pages
2. **Scheduling**: Schedule logo changes for specific dates
3. **A/B Testing**: Test different logos with analytics
4. **Logo Variants**: Store multiple sizes/formats of same logo
5. **Versioning**: Keep history of all logo changes
6. **Bulk Upload**: Upload multiple logos at once
7. **Logo Analytics**: Track logo views and interactions

## Support

For issues or questions:

1. Check this guide first
2. Review error messages in browser console
3. Check Wix Media API documentation
4. Review CMS collection permissions
5. Verify admin authentication is working

## Files Reference

- **CMS Collection**: `splashpage` (auto-generated)
- **Admin Tab**: `/src/components/AdminPanel/tabs/SplashpageTab.tsx`
- **Admin Manager**: `/src/components/AdminPanel/sections/SplashpageManager.tsx`
- **Frontend Component**: `/src/components/SplashpageLogo.tsx`
- **Hook**: `/src/hooks/useSplashpageLogo.ts`
- **Upload API**: `/src/api/media/upload-hero.ts`
- **Entity Type**: `/src/entities/splashpage.d.ts` (auto-generated)
