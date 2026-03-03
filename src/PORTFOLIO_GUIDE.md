# Fashion Photography Portfolio Website - Complete Guide

## 🎨 Project Overview

This is a modern, high-end fashion photography portfolio website built with React, Tailwind CSS, and Framer Motion. The site is fully CMS-integrated, allowing easy management and updating of portfolio content without touching code.

### Key Features
- ✨ **Modern 2026 Design Trends**: Minimalist layouts, bold typography, smooth animations
- 🎯 **CMS-Driven Content**: All portfolio items, clients, and projects managed via Wix CMS
- 🌓 **Dark Mode Support**: Toggle between light and dark themes
- 📱 **Fully Responsive**: Optimized for mobile, tablet, and desktop
- ⚡ **Performance Optimized**: Lazy loading, optimized images, smooth scroll
- 🎬 **Interactive Elements**: Carousel galleries, hover effects, lightbox views
- 📧 **Contact Form**: Integrated booking/inquiry form
- 🔗 **Social Integration**: Links to Instagram, LinkedIn, and email

---

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.tsx              # Navigation with dark mode toggle
│   ├── Footer.tsx              # Footer with social links
│   ├── pages/
│   │   ├── HomePage.tsx        # Main landing page
│   │   ├── PortfolioPage.tsx   # Full portfolio grid with filters
│   │   └── PortfolioDetailPage.tsx  # Individual project detail view
│   ├── sections/
│   │   ├── HeroSection.tsx     # Full-screen hero with CTA
│   │   ├── GallerySection.tsx  # Carousel gallery
│   │   ├── AboutSection.tsx    # About/Vision section
│   │   ├── PortfolioGrid.tsx   # Portfolio grid component
│   │   ├── ClientsSection.tsx  # Clients & Press highlights
│   │   └── ContactSection.tsx  # Contact form
│   └── ui/                     # shadcn/ui components
├── entities/
│   └── index.ts                # CMS collection types
├── styles/
│   ├── global.css              # Global styles
│   └── fonts.css               # Font imports
└── tailwind.config.mjs         # Tailwind configuration
```

---

## 🎨 Design System

### Color Palette
- **Primary**: `#0f0fff` (Electric Blue)
- **Primary Foreground**: `#53d409` (Lime Green)
- **Secondary**: `#add8e6` (Light Blue)
- **Foreground**: `#000000` (Black)
- **Background**: `#ffffff` (White)

### Typography
- **Headings**: Inter (Sans-serif) - Modern, clean
- **Body**: Merriweather (Serif) - Elegant, readable

### Spacing & Layout
- Max-width: `100rem` (1600px)
- Responsive breakpoints: `sm`, `md`, `lg`, `xl`
- Padding: Consistent 6px base unit

---

## 📊 CMS Collections

### 1. **Portfolio Collection** (`portfolio`)
Stores all portfolio projects with images and descriptions.

**Fields:**
- `projectName` (Text) - Project title
- `shortDescription` (Text) - Brief description
- `fullDescription` (Text) - Detailed description
- `mainImage` (Image) - Hero image
- `category` (Text) - Project category (e.g., "Editorial", "Commercial")
- `projectDate` (Date) - Project completion date
- `galleryImage1`, `galleryImage2`, `galleryImage3` (Images) - Additional gallery images

**How to Add Projects:**
1. Go to Wix Dashboard → Database → Portfolio collection
2. Click "Add Item"
3. Fill in all fields with project details
4. Upload images (recommended: 1600x1200px or larger)
5. Click "Save"

### 2. **Clients & Press Collection** (`clientspress`)
Showcases brands and magazines featured in.

**Fields:**
- `clientName` (Text) - Brand/magazine name
- `clientLogo` (Image) - Logo or representative image
- `externalLink` (URL) - Link to brand website
- `highlightDescription` (Text) - Brief collaboration description
- `dateOfFeature` (Date) - Publication/collaboration date
- `category` (Text) - Type (e.g., "Fashion Brand", "Magazine")

**How to Add Clients:**
1. Go to Wix Dashboard → Database → Clients & Press collection
2. Click "Add Item"
3. Enter client name and upload logo
4. Add optional link and description
5. Click "Save"

### 3. **Team Members Collection** (`teammembers`)
For team/about section (optional).

**Fields:**
- `name` (Text) - Team member name
- `role` (Text) - Position/role
- `headshot` (Image) - Profile photo
- `bio` (Text) - Biography
- `specialization` (Text) - Area of expertise
- `socialLink` (URL) - Social media profile

---

## 🚀 Getting Started

### Installation
```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

### Environment Setup
The site uses Wix integrations automatically. No additional setup needed for:
- CMS data fetching
- Authentication
- Member management

---

## 🎯 Key Pages & Sections

### Home Page (`/`)
**Sections:**
1. **Hero Section** - Full-screen image with title and CTAs
2. **Gallery Section** - Carousel of featured work
3. **About Section** - Biography with portrait
4. **Portfolio Grid** - 6-item grid with hover effects
5. **Clients Section** - Brand logos and press highlights
6. **Contact Section** - Booking form and contact info

### Portfolio Page (`/portfolio`)
- Full grid of all portfolio items
- Category filtering
- Hover previews
- Click to view details

### Portfolio Detail Page (`/portfolio/:id`)
- Full project information
- Gallery lightbox
- Navigation to previous/next projects
- Related project suggestions

---

## 🎨 Customization Guide

### Changing Colors
Edit `/src/tailwind.config.mjs`:
```javascript
colors: {
  primary: '#0f0fff',           // Change primary color
  'primary-foreground': '#53d409',
  secondary: '#add8e6',
  foreground: '#000000',
  background: '#ffffff',
}
```

### Changing Fonts
The fonts are configured in `tailwind.config.mjs`:
```javascript
fontFamily: {
  heading: ['Inter', 'sans-serif'],      // Headings
  paragraph: ['Merriweather', 'serif'],  // Body text
}
```

To use different fonts:
1. Import from Google Fonts in `/src/styles/fonts.css`
2. Update the font names in `tailwind.config.mjs`

### Modifying Hero Section
Edit `/src/components/sections/HeroSection.tsx`:
- Change background image URL
- Update title and tagline
- Modify button text and actions

### Customizing Contact Form
Edit `/src/components/sections/ContactSection.tsx`:
- Add/remove form fields
- Change email address
- Update contact information

---

## 📸 Image Management

### Recommended Image Sizes
- **Hero Background**: 1920x1080px (16:9)
- **Portfolio Main Image**: 1600x1200px (4:3)
- **Gallery Images**: 1200x1200px (1:1)
- **Client Logos**: 400x400px (1:1)
- **Team Headshots**: 600x600px (1:1)

### Image Optimization
- Use JPEG for photographs (80-90% quality)
- Use PNG for logos and graphics
- Compress before uploading using tools like TinyPNG
- Images are lazy-loaded for performance

### Placeholder Images
All sections use placeholder images from Wix CDN. Replace with your own:
1. Upload images to Wix Media Manager
2. Copy image URLs
3. Update image URLs in CMS collections

---

## 🔧 Advanced Customization

### Adding New Sections
1. Create new component in `/src/components/sections/`
2. Import in `/src/components/pages/HomePage.tsx`
3. Add to JSX with proper spacing

### Creating New Pages
1. Create component in `/src/components/pages/`
2. Add route to `/src/components/Router.tsx`
3. Link from navigation in `/src/components/Header.tsx`

### Modifying Animations
Edit Framer Motion variants in section components:
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,  // Delay between items
      delayChildren: 0.2,    // Initial delay
    },
  },
};
```

---

## 📱 Responsive Design

The site is fully responsive with breakpoints:
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

All components use Tailwind's responsive prefixes:
```typescript
className="text-lg md:text-2xl lg:text-4xl"
```

---

## 🌓 Dark Mode

Dark mode is toggled via the moon/sun icon in the header. The preference is stored in browser localStorage.

To customize dark mode colors, use `dark:` prefix in Tailwind:
```typescript
className="bg-white dark:bg-slate-950 text-black dark:text-white"
```

---

## 📧 Contact Form Setup

The contact form is functional but currently simulates submission. To integrate with email:

1. **Option 1: Wix Forms API**
   - Use Wix backend functions
   - Store submissions in CMS collection

2. **Option 2: Third-party Service**
   - Integrate Formspree, EmailJS, or similar
   - Add API key to environment variables

3. **Option 3: Wix Contacts**
   - Use Wix Members API
   - Store as contact records

---

## 🚀 Deployment

### Wix Deployment
The site is built on Wix and automatically deployed. Changes are live immediately.

### Performance Optimization
- ✅ Images are lazy-loaded
- ✅ Code is minified and bundled
- ✅ CSS is optimized with Tailwind
- ✅ Animations use GPU acceleration
- ✅ No external dependencies beyond essentials

### SEO Optimization
- Add meta tags in `/src/components/Head.tsx`
- Use semantic HTML
- Include alt text on all images
- Structure data with proper headings

---

## 🐛 Troubleshooting

### Images Not Loading
- Check image URLs in CMS
- Ensure images are uploaded to Wix Media
- Verify image permissions are public

### Dark Mode Not Working
- Clear browser cache
- Check localStorage in DevTools
- Verify `dark:` classes in Tailwind config

### Portfolio Items Not Showing
- Verify items exist in CMS collection
- Check collection ID is correct: `portfolio`
- Ensure items have required fields filled

### Form Not Submitting
- Check browser console for errors
- Verify form fields have `name` attributes
- Test with sample data

---

## 📚 Resources

### Documentation
- [Wix CMS Documentation](https://www.wix.com/velo/reference/wix-cms)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [React Router](https://reactrouter.com)

### Tools
- [Wix Dashboard](https://manage.wix.com)
- [Wix Media Manager](https://manage.wix.com/media)
- [Google Fonts](https://fonts.google.com)
- [TinyPNG](https://tinypng.com) - Image compression

---

## 📝 Content Management Checklist

- [ ] Add portfolio projects to CMS
- [ ] Upload high-quality images
- [ ] Add client/brand logos
- [ ] Update about section biography
- [ ] Add contact information
- [ ] Update social media links
- [ ] Test dark mode
- [ ] Test on mobile devices
- [ ] Verify all links work
- [ ] Check image loading times

---

## 🎯 Next Steps

1. **Populate CMS**: Add your portfolio projects and client logos
2. **Customize Colors**: Update brand colors in tailwind.config
3. **Update Content**: Edit text in each section
4. **Test**: Preview on different devices
5. **Deploy**: Site is live immediately on Wix

---

## 💡 Tips & Best Practices

1. **Image Quality**: Always use high-resolution images (1600px+)
2. **Consistency**: Keep image aspect ratios consistent within sections
3. **Performance**: Compress images before uploading
4. **Content**: Keep descriptions concise and impactful
5. **Updates**: Regularly add new portfolio items to keep site fresh
6. **Testing**: Test on mobile before publishing
7. **Analytics**: Monitor visitor behavior and adjust content

---

## 📞 Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Wix documentation
3. Check browser console for error messages
4. Test in incognito/private mode

---

**Last Updated**: March 2026
**Version**: 1.0
**Status**: Production Ready
