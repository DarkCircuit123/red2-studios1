# Professional Image Fitting System - Implementation Guide

## Overview

This document describes the complete professional image fitting system implemented for CMS-managed homepage images. The system ensures all images automatically fit their assigned containers while preserving focal points and maintaining quality across all devices.

## What Was Implemented

### 1. Core Image Fitting Library (`/src/lib/image-fitting.ts`)

**Purpose**: Calculates professional image fitting with focal point preservation

**Key Functions**:
- `calculateImageFitting()` - Main algorithm for image fitting calculations
- `generateResponsiveImageSizes()` - Creates responsive image size strings
- `getDefaultFocalPoint()` - Intelligent default focal points based on image aspect ratio
- `normalizeFocalPoint()` - Validates and constrains focal point coordinates
- `getResponsiveContainerDimensions()` - Calculates optimal container sizes

**Features**:
- Cover mode: Image fills container, may be cropped
- Contain mode: Entire image visible, may have empty space
- Focal point protection: Prevents accidental cropping of important areas
- Responsive sizing: Optimized for different screen sizes

### 2. Image Fitting Hook (`/src/hooks/useImageFitting.ts`)

**Purpose**: React hook for managing image fitting in components

**Usage**:
```tsx
const { fitting, responsiveSizes, focalPoint } = useImageFitting({
  imageWidth: 1920,
  imageHeight: 1080,
  containerWidth: 800,
  containerHeight: 600,
  focalPoint: { x: 50, y: 50 },
  fitMode: 'cover',
});
```

**Returns**:
- `fitting`: CSS properties for `object-fit` and `object-position`
- `responsiveSizes`: Responsive image sizes string
- `focalPoint`: Normalized focal point coordinates

### 3. Responsive Image Container (`/src/components/ResponsiveImageContainer.tsx`)

**Purpose**: Drop-in component for professional image fitting

**Features**:
- Automatic container dimension tracking with ResizeObserver
- Responsive behavior across all screen sizes
- Focal point preservation
- Simple API for common use cases

**Usage**:
```tsx
<ResponsiveImageContainer
  src="image.jpg"
  alt="Description"
  focalPointX={65}
  focalPointY={45}
  fitMode="cover"
/>
```

### 4. Updated Hero Section (`/src/components/sections/HeroSection.tsx`)

**Changes**:
- Integrated `useImageFitting` hook
- Added focal point support from CMS
- Implemented `object-fit` and `object-position` CSS
- Added image dimension tracking
- Preserved existing polling behavior

**Features**:
- Full-screen background treatment
- Focal point preservation for hero images
- Responsive sizing for all devices
- Automatic image loading from CMS

### 5. Updated Behind The Scenes Section (`/src/components/sections/BehindTheScenesSection.tsx`)

**Changes**:
- Integrated `useImageFitting` hook for each image
- Added support for CMS-managed images
- Implemented consistent card dimensions
- Added focal point positioning

**Features**:
- Grid layout with consistent sizing
- Automatic crop/scale to fill placeholder
- Focal point protection for each card
- Responsive grid (1 column mobile, 3 columns desktop)

### 6. Updated Carousel Section (`/src/components/sections/RubberBandCarouselSection.tsx`)

**Changes**:
- Integrated `useImageFitting` hook for carousel items
- Added focal point support per image
- Implemented responsive image fitting
- Maintained existing carousel animation

**Features**:
- Consistent card dimensions
- Focal point preservation during scroll
- Responsive sizing for different screen widths
- Smooth carousel animations

### 7. Demo Component (`/src/components/ImageFittingDemo.tsx`)

**Purpose**: Interactive demonstration of the image fitting system

**Features**:
- Focal point controls (X and Y sliders)
- Fit mode selector (cover/contain)
- Multiple demo sections (hero, gallery, behind-the-scenes)
- Responsive behavior showcase
- Real-time updates

## How It Works

### Image Fitting Algorithm

1. **Calculate Aspect Ratios**
   - Container aspect = width / height
   - Image aspect = width / height

2. **Determine Scaling**
   - If container is wider: scale image by width
   - If container is taller: scale image by height

3. **Calculate Crop Offsets**
   - Based on focal point position (0-100%)
   - Ensures focal point stays centered in visible area

4. **Clamp Offsets**
   - Prevent cropping beyond image edges
   - Ensure valid CSS percentages

5. **Apply CSS**
   - `object-fit: cover` or `contain`
   - `object-position: X% Y%`

### Focal Point Positioning

**Default Focal Points** (Rule of Thirds):
- Landscape (aspect > 1): x: 65%, y: 45%
- Portrait (aspect < 1): x: 50%, y: 35%
- Square: x: 50%, y: 50%

**Custom Focal Points**:
- Can be set per image in CMS
- Range: 0-100% for both X and Y
- Automatically normalized and clamped

### Responsive Behavior

**Container Tracking**:
- ResizeObserver monitors container dimensions
- Automatic recalculation on resize
- Smooth transitions between breakpoints

**Image Sizes**:
- Optimized for: 320px, 640px, 1024px, 1280px, 1920px
- Reduces bandwidth for mobile devices
- Maintains quality on larger screens

## Integration with CMS

### Current Implementation

**HomepageImages Collection**:
- `heroImage`: Image URL
- `heroImageFocalPointX`: Optional focal point X (0-100)
- `heroImageFocalPointY`: Optional focal point Y (0-100)

### Adding to Other Collections

To add image fitting to other collections:

1. **Add focal point fields** (optional):
   ```typescript
   focalPointX: number;  // 0-100
   focalPointY: number;  // 0-100
   ```

2. **Update component** to read focal points:
   ```tsx
   const { fitting } = useImageFitting({
     // ... other props
     focalPoint: {
       x: item.focalPointX ?? 50,
       y: item.focalPointY ?? 50,
     },
   });
   ```

3. **Apply CSS** to image:
   ```tsx
   style={{
     objectFit: fitting.objectFit,
     objectPosition: fitting.objectPosition,
   }}
   ```

## Usage Examples

### Example 1: Hero Section

```tsx
import { ResponsiveImageContainer } from '@/components/ResponsiveImageContainer';

export function HeroSection() {
  return (
    <section className="w-full h-screen">
      <ResponsiveImageContainer
        src={heroImage}
        alt="Hero background"
        focalPointX={heroFocalPointX}
        focalPointY={heroFocalPointY}
        fitMode="cover"
      />
    </section>
  );
}
```

### Example 2: Gallery Grid

```tsx
import { ResponsiveImageContainer } from '@/components/ResponsiveImageContainer';

export function GalleryGrid({ items }) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {items.map((item) => (
        <div key={item.id} className="aspect-square">
          <ResponsiveImageContainer
            src={item.image}
            alt={item.title}
            focalPointX={item.focalPointX}
            focalPointY={item.focalPointY}
            fitMode="cover"
          />
        </div>
      ))}
    </div>
  );
}
```

### Example 3: Custom Hook Usage

```tsx
import { useImageFitting } from '@/hooks/useImageFitting';

export function CustomImageComponent() {
  const [imageDims, setImageDims] = useState({ width: 1920, height: 1080 });

  const { fitting } = useImageFitting({
    imageWidth: imageDims.width,
    imageHeight: imageDims.height,
    containerWidth: 800,
    containerHeight: 600,
    focalPoint: { x: 65, y: 45 },
    fitMode: 'cover',
  });

  return (
    <img
      src="image.jpg"
      onLoad={(e) => setImageDims({
        width: e.currentTarget.naturalWidth,
        height: e.currentTarget.naturalHeight,
      })}
      style={{
        objectFit: fitting.objectFit,
        objectPosition: fitting.objectPosition,
      }}
    />
  );
}
```

## Workflow for Photographers/Admins

### Step 1: Upload Image
- Upload finished JPG to CMS (no pre-processing needed)
- Image is automatically stored in HomepageImages collection

### Step 2: Set Focal Point (Optional)
- Open image in CMS editor
- Set focal point X and Y coordinates (0-100%)
- If not set, system uses intelligent defaults

### Step 3: Image Automatically Fits
- Hero section: Full-screen background with focal point preservation
- Gallery: Consistent card dimensions with automatic cropping
- Behind The Scenes: Placeholder fill without distortion

### Step 4: Responsive Behavior
- Image automatically adapts to different screen sizes
- Focal point remains protected across all breakpoints
- No manual resizing required

## Performance Considerations

### Optimization Techniques

1. **CSS-Based Fitting**
   - Uses native CSS `object-fit` and `object-position`
   - No JavaScript transforms or calculations during render
   - Minimal performance impact

2. **Responsive Image Sizes**
   - Optimized breakpoints: 320px, 640px, 1024px, 1280px, 1920px
   - Reduces bandwidth for mobile devices
   - Maintains quality on larger screens

3. **ResizeObserver**
   - Efficient container dimension tracking
   - Only recalculates when dimensions change
   - Debounced updates prevent excessive renders

4. **Memoization**
   - Hook results cached between renders
   - Prevents unnecessary recalculations
   - Smooth performance even with many images

### Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS `object-fit` and `object-position` support required
- ResizeObserver for responsive behavior
- Graceful fallback for older browsers

## Troubleshooting

### Issue: Image appears cropped incorrectly

**Solution**:
1. Check focal point coordinates (should be 0-100)
2. Verify container dimensions are set correctly
3. Ensure image has loaded before fitting calculations
4. Check browser console for errors

### Issue: Image appears stretched

**Solution**:
1. Verify `fitMode` is set to 'cover' or 'contain'
2. Check that `object-fit` CSS is applied
3. Ensure container has explicit dimensions
4. Verify image aspect ratio is correct

### Issue: Focal point not working

**Solution**:
1. Verify focal point values are passed to component
2. Check that image has loaded (use `onImageLoad` callback)
3. Ensure CMS fields are populated with focal point data
4. Verify focal point values are within 0-100 range

### Issue: Images not responsive

**Solution**:
1. Check that ResizeObserver is supported (modern browsers)
2. Verify container has explicit dimensions
3. Ensure ResponsiveImageContainer is used correctly
4. Check browser console for ResizeObserver errors

## Best Practices

### For Photographers

1. **Upload high-resolution images** (minimum 1920px width)
2. **Use modern formats** (WebP with JPEG fallback)
3. **Optimize file size** without quality loss
4. **Maintain original aspect ratios**
5. **Set focal points** for important content

### For Developers

1. **Use ResponsiveImageContainer** for simple cases
2. **Use useImageFitting hook** for custom layouts
3. **Set focalPoint props** from CMS data
4. **Let container control shape**, image fills it
5. **Test across breakpoints** (mobile, tablet, desktop)

### For CMS Admins

1. **Always set focal points** for important images
2. **Use consistent focal points** across similar images
3. **Test on mobile** before publishing
4. **Monitor image quality** after upload
5. **Update focal points** if image content changes

## Future Enhancements

### Potential Improvements

1. **Focal Point Editor UI**
   - Visual focal point selector in CMS
   - Real-time preview of cropping
   - Preset focal points (face detection, rule of thirds)

2. **Advanced Image Optimization**
   - Automatic WebP conversion
   - AVIF format support
   - Lazy loading with blur-up effect

3. **Analytics Integration**
   - Track which focal points work best
   - Monitor image performance metrics
   - A/B testing for focal points

4. **AI-Powered Focal Points**
   - Automatic face detection
   - Content-aware cropping
   - Smart focal point suggestions

## Support & Documentation

### Files Included

- `/src/lib/image-fitting.ts` - Core fitting library
- `/src/hooks/useImageFitting.ts` - React hook
- `/src/components/ResponsiveImageContainer.tsx` - Reusable component
- `/src/components/ImageFittingDemo.tsx` - Interactive demo
- `/src/lib/image-fitting-guide.md` - User guide
- `/src/IMAGE_FITTING_IMPLEMENTATION.md` - This file

### Getting Help

1. **Review the demo component** - See interactive examples
2. **Check the guide** - Read detailed documentation
3. **Examine updated sections** - See real-world usage
4. **Test with different images** - Experiment with focal points

## Summary

The professional image fitting system provides:

✓ Automatic container fitting without stretching
✓ Focal point preservation for important content
✓ Responsive behavior across all devices
✓ Professional image handling for photography portfolios
✓ Simple workflow: upload → automatically fits
✓ No manual resizing required
✓ High performance with CSS-based fitting
✓ Easy integration with existing components

All CMS-managed homepage images now automatically fit their assigned containers while maintaining quality and protecting focal points.
