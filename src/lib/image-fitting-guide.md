# Professional Image Fitting System

## Overview

This system provides professional image fitting behavior for all CMS-managed homepage images. It ensures images automatically fit their assigned containers while preserving focal points and maintaining image quality.

## Key Features

### 1. **Automatic Container Fitting**
- Images fill their containers without stretching or warping
- Responsive behavior across desktop, tablet, and mobile
- Fixed container dimensions while images adapt

### 2. **Focal Point Preservation**
- Protects important image areas (faces, details, focal points)
- Prevents accidental cropping of critical content
- Uses rule-of-thirds positioning by default

### 3. **Professional Image Modes**

#### Hero Image
- Full-screen background treatment
- Uses `object-fit: cover` with focal point protection
- Maintains aspect ratio while filling viewport
- Responsive sizing for all devices

#### Scrolling Gallery (Carousel)
- Consistent card dimensions
- `object-fit: cover` for uniform appearance
- Focal point positioning for each image
- Smooth responsive transitions

#### Behind The Scenes
- Automatic crop/scale to fill placeholder
- No distortion or stretching
- Maintains aspect ratio
- Grid layout with consistent sizing

## Usage

### Basic Usage with ResponsiveImageContainer

```tsx
import { ResponsiveImageContainer } from '@/components/ResponsiveImageContainer';

export function MyComponent() {
  return (
    <div className="w-full h-96">
      <ResponsiveImageContainer
        src="path/to/image.jpg"
        alt="Description"
        focalPointX={65}  // 0-100 (percentage from left)
        focalPointY={45}  // 0-100 (percentage from top)
        fitMode="cover"   // 'cover' or 'contain'
      />
    </div>
  );
}
```

### Using useImageFitting Hook

```tsx
import { useImageFitting } from '@/hooks/useImageFitting';

export function MyComponent() {
  const [imageDims, setImageDims] = useState({ width: 1920, height: 1080 });

  const { fitting } = useImageFitting({
    imageWidth: imageDims.width,
    imageHeight: imageDims.height,
    containerWidth: 800,
    containerHeight: 600,
    focalPoint: { x: 50, y: 50 },
    fitMode: 'cover',
  });

  return (
    <img
      src="image.jpg"
      style={{
        objectFit: fitting.objectFit,
        objectPosition: fitting.objectPosition,
      }}
    />
  );
}
```

## CMS Integration

### Adding Focal Point Fields to Collections

To enable focal point positioning in the CMS, add these optional fields to your image collections:

```typescript
// Example: HomepageImages collection
{
  heroImageFocalPointX: number;      // 0-100
  heroImageFocalPointY: number;      // 0-100
  behindTheScenesImageFocalPointX: number;
  behindTheScenesImageFocalPointY: number;
}
```

### Default Focal Points

If focal points aren't specified, the system uses intelligent defaults:

- **Landscape images** (aspect > 1): x: 65%, y: 45% (right third)
- **Portrait images** (aspect < 1): x: 50%, y: 35% (upper center)
- **Square images**: x: 50%, y: 50% (center)

## Technical Details

### Image Fitting Algorithm

1. **Calculate aspect ratios** for both container and image
2. **Determine scaling mode**:
   - `cover`: Image fills container, may be cropped
   - `contain`: Entire image visible, may have empty space
3. **Calculate crop offsets** based on focal point
4. **Clamp offsets** to valid range to prevent edge cropping
5. **Convert to CSS percentages** for `object-position`

### Responsive Sizing

The system generates responsive image sizes for optimal loading:

```
(max-width: 320px) 320px,
(max-width: 640px) 640px,
(max-width: 1024px) 1024px,
(max-width: 1280px) 1280px,
1920px
```

## Workflow

### For Photographers/Admins

1. **Upload finished JPG** to CMS (no pre-processing needed)
2. **Optionally set focal point** (x: 0-100, y: 0-100)
3. **Image automatically fits** all sections:
   - Hero: Full-screen background
   - Gallery: Consistent card dimensions
   - Behind The Scenes: Placeholder fill
4. **No manual resizing** required

### For Developers

1. **Use ResponsiveImageContainer** for simple cases
2. **Use useImageFitting hook** for custom layouts
3. **Set focalPoint props** from CMS data
4. **Container controls shape**, image fills it

## Best Practices

### Focal Point Positioning

- **Faces**: Position at x: 50-65%, y: 30-45%
- **Landscapes**: Position at x: 60-70%, y: 40-50%
- **Products**: Position at x: 50%, y: 45%
- **Architecture**: Position at x: 50%, y: 50%

### Container Sizing

- **Hero**: Full viewport (100vw × 100vh)
- **Gallery cards**: Fixed aspect ratio (e.g., 1:1, 4:3)
- **Behind The Scenes**: Grid cells with consistent dimensions

### Image Quality

- Upload high-resolution images (minimum 1920px width)
- Use modern formats (WebP with JPEG fallback)
- Optimize file size without quality loss
- Maintain original aspect ratios

## Troubleshooting

### Image appears cropped incorrectly
- Check focal point coordinates (should be 0-100)
- Verify container dimensions are set correctly
- Ensure image has loaded before fitting calculations

### Image appears stretched
- Verify `fitMode` is set to 'cover' or 'contain'
- Check that `object-fit` CSS is applied
- Ensure container has explicit dimensions

### Focal point not working
- Verify focal point values are passed to component
- Check that image has loaded (use `onImageLoad` callback)
- Ensure CMS fields are populated with focal point data

## Performance Considerations

- Uses ResizeObserver for responsive updates
- Minimal re-renders with memoization
- Efficient CSS-based fitting (no JavaScript transforms)
- Lazy loading support for images
- Responsive image sizes for optimal bandwidth

## Browser Support

- Modern browsers (Chrome, Firefox, Safari, Edge)
- CSS `object-fit` and `object-position` support required
- ResizeObserver for responsive behavior
- Fallback to basic fitting for older browsers
