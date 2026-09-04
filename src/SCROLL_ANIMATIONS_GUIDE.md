# Premium Scroll-Based Motion System

## Overview

This document describes the luxury editorial scroll animation system implemented across the website. The system creates a cinematic, high-end fashion magazine aesthetic with smooth, intentional motion that enhances storytelling without distraction.

## Architecture

### Core Components

#### 1. **useScrollAnimation Hook** (`/src/hooks/useScrollAnimation.ts`)
A custom React hook that manages scroll-triggered animations using Intersection Observer API.

**Features:**
- Performant viewport detection
- Respects reduced-motion accessibility settings
- Configurable trigger behavior (once or repeating)
- Automatic cleanup

**Usage:**
```typescript
const { ref, isVisible } = useScrollAnimation({
  threshold: 0.1,        // When 10% of element is visible
  margin: '-50px',       // Trigger 50px before entering viewport
  triggerOnce: true      // Only animate once
});
```

#### 2. **Animation Variants** (`/src/lib/scroll-animation-variants.ts`)
Pre-designed animation patterns for consistent, luxury-focused motion.

**Available Variants:**
- `textSlideUp` - Text elements slide up 40px with fade
- `headingSlideUp` - Larger headings with subtle settling effect
- `imageSlideInLeft` - Images slide from left with 98% → 100% scale
- `imageSlideInRight` - Images slide from right with scale
- `cardSlideUp` - Cards/gallery items with staggered appearance
- `buttonSlideUp` - Buttons with soft snap into place
- `containerStagger` - Parent container for staggered children
- `fadeIn` - Subtle fade-only animation
- `slideInHorizontal` - Horizontal slide for accent elements
- `scaleIn` - Scale + fade for emphasis

**Helper Function:**
```typescript
getStaggeredVariant(index, baseDelay, staggerDelay)
// Creates staggered animations for list items
```

## Implementation Pattern

### Basic Section Animation

```typescript
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { scrollAnimationVariants } from '@/lib/scroll-animation-variants';

export default function MySection() {
  const { ref, isVisible } = useScrollAnimation({ triggerOnce: true });

  return (
    <section ref={ref}>
      {/* Heading */}
      <motion.h2
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={scrollAnimationVariants.headingSlideUp}
      >
        Section Title
      </motion.h2>

      {/* Text */}
      <motion.p
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={scrollAnimationVariants.textSlideUp}
        transition={{ delay: 0.15 }}
      >
        Description text
      </motion.p>

      {/* Staggered Items */}
      <motion.div
        initial="hidden"
        animate={isVisible ? "visible" : "hidden"}
        variants={scrollAnimationVariants.containerStagger}
      >
        {items.map((item, i) => (
          <motion.div
            key={i}
            variants={getStaggeredVariant(i, 0.15, 0.1)}
          >
            {item.content}
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
```

## Animation Specifications

### Easing Functions
All animations use professional easing curves:
- **Standard Motion**: `[0.25, 0.46, 0.45, 0.94]` - smooth, natural feel
- **Settling Effect**: `[0.23, 1, 0.32, 1]` - subtle bounce at end

### Duration Guidelines
- **Text Elements**: 0.8s
- **Headings**: 0.9s
- **Images**: 0.9s
- **Cards/Gallery**: 0.7s
- **Buttons**: 0.6s

### Stagger Timing
- **Base Delay**: 0.1s - 0.15s (delay before first item)
- **Stagger Delay**: 0.1s - 0.12s (delay between items)
- **Max Items**: 3-6 items per container (prevents excessive staggering)

## Sections Implemented

### 1. Hero Section
- Scroll indicator button with upward slide + fade
- Parallax background maintained
- Smooth entry animation

### 2. About Section
- Heading with settling effect
- Floated image slides in from right (desktop) or left (mobile)
- Biography text fades in
- Statistics stagger in with emphasis

### 3. Portfolio Grid
- Section heading with smooth slide
- Description text with delayed fade
- Gallery items stagger in with scale effect
- "View All" button snaps into place

### 4. Contact Section
- Left column (info) slides in from left
- Right column (form) slides in from right
- Contact methods stagger with icon emphasis
- Form fields animate in sequence
- Submit button with settling effect

### 5. Behind The Scenes
- Section heading with slide up
- Gallery items stagger with scale

### 6. Sponsors Section
- Heading with settling effect
- Description text with fade
- Sponsor cards stagger with subtle lift on hover

## Accessibility

### Reduced Motion Support
All animations respect the `prefers-reduced-motion` media query:
```typescript
const prefersReducedMotion = respectReducedMotion();
// When true, animations are skipped or simplified
```

**Behavior:**
- Animations are disabled for users with reduced motion preference
- Elements appear instantly in their final state
- No performance impact for accessibility-conscious users

### Color Contrast
- All animated text maintains WCAG AA contrast ratios
- Primary color (#6F0809) tested against backgrounds
- Hover states provide sufficient contrast

## Performance Optimization

### Intersection Observer
- Uses native browser API (no polling)
- Efficient viewport detection
- Automatic cleanup on unmount
- Configurable margins for early triggering

### Framer Motion
- GPU-accelerated transforms (translate, scale, opacity)
- Optimized for 60fps performance
- Automatic will-change management
- Reduced motion detection built-in

### Best Practices
1. **Trigger Once**: Use `triggerOnce: true` to prevent re-animation on scroll
2. **Stagger Limits**: Keep staggered items to 3-6 per container
3. **Delay Chains**: Maximum 0.5s total delay for any animation
4. **Viewport Margins**: Use `-50px` to trigger slightly before visibility

## Customization

### Creating Custom Variants
```typescript
export const customVariant = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};
```

### Adjusting Timing
```typescript
<motion.div
  initial="hidden"
  animate={isVisible ? "visible" : "hidden"}
  variants={scrollAnimationVariants.textSlideUp}
  transition={{ delay: 0.2, duration: 1.0 }} // Override defaults
>
  Content
</motion.div>
```

### Combining Animations
```typescript
<motion.div
  initial={{ opacity: 0, y: 40, scale: 0.95 }}
  animate={isVisible ? { opacity: 1, y: 0, scale: 1 } : {}}
  transition={{ duration: 0.8, ease: 'easeOut' }}
>
  Combined effect
</motion.div>
```

## Testing

### Visual Testing
1. Scroll through each section slowly
2. Verify animations trigger at correct viewport position
3. Check stagger timing between items
4. Test on mobile (smaller viewport)

### Accessibility Testing
1. Enable "Reduce motion" in OS settings
2. Verify animations are disabled
3. Check that content is still readable
4. Test keyboard navigation

### Performance Testing
1. Open DevTools Performance tab
2. Record scroll interaction
3. Check for 60fps consistency
4. Monitor GPU usage

## Browser Support

- **Chrome/Edge**: Full support (Intersection Observer, GPU acceleration)
- **Firefox**: Full support
- **Safari**: Full support (iOS 12.2+)
- **Mobile**: Optimized for touch scrolling

## Future Enhancements

1. **Scroll Progress**: Tie animations to scroll position
2. **Parallax Depth**: Layered parallax for hero sections
3. **Scroll Velocity**: Adjust animation speed based on scroll speed
4. **Custom Easing**: User-defined easing curves per section
5. **Animation Presets**: Theme-based animation sets

## Troubleshooting

### Animations Not Triggering
- Check `ref` is attached to section element
- Verify `isVisible` is being used in `animate` prop
- Ensure `triggerOnce: true` if animation should only play once

### Animations Stuttering
- Check for excessive staggering (reduce number of items)
- Verify GPU acceleration is enabled
- Reduce animation duration slightly

### Accessibility Issues
- Test with `prefers-reduced-motion` enabled
- Verify color contrast ratios
- Check keyboard navigation works

## References

- [Framer Motion Documentation](https://www.framer.com/motion/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [Web Animations Performance](https://web.dev/animations-guide/)
- [Accessibility Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
