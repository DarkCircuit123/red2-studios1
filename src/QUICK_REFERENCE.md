# 🚀 Quick Reference Guide

## 📋 Essential Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Linting
npm run lint            # Check code quality

# Testing
npm run test            # Run tests
```

## 🎯 Key URLs

```
Home:                   /
Portfolio Grid:         /portfolio
Portfolio Detail:       /portfolio/:id
```

## 📊 CMS Collections

| Collection | ID | Purpose |
|-----------|----|---------| 
| Portfolio | `portfolio` | Projects with images |
| Clients & Press | `clientspress` | Brands and magazines |
| Team Members | `teammembers` | Team profiles |

## 🎨 Color Codes

```
Primary:        #0f0fff (Electric Blue)
Accent:         #53d409 (Lime Green)
Secondary:      #add8e6 (Light Blue)
Dark:           #000000 (Black)
Light:          #ffffff (White)
```

## 📁 Component Locations

```
Header:                 /src/components/Header.tsx
Footer:                 /src/components/Footer.tsx
Home Page:              /src/components/pages/HomePage.tsx
Portfolio Page:         /src/components/pages/PortfolioPage.tsx
Portfolio Detail:       /src/components/pages/PortfolioDetailPage.tsx
Hero Section:           /src/components/sections/HeroSection.tsx
Gallery Section:        /src/components/sections/GallerySection.tsx
About Section:          /src/components/sections/AboutSection.tsx
Portfolio Grid:         /src/components/sections/PortfolioGrid.tsx
Clients Section:        /src/components/sections/ClientsSection.tsx
Contact Section:        /src/components/sections/ContactSection.tsx
```

## 🎨 Customization Quick Tips

### Change Primary Color
Edit `/src/tailwind.config.mjs`:
```javascript
colors: {
  primary: '#YOUR_COLOR',
}
```

### Change Fonts
Edit `/src/tailwind.config.mjs`:
```javascript
fontFamily: {
  heading: ['Your Font', 'sans-serif'],
  paragraph: ['Your Font', 'serif'],
}
```

### Update Contact Info
Edit `/src/components/sections/ContactSection.tsx`:
- Email: Line 87
- Phone: Line 98
- Location: Line 109

### Change Hero Title
Edit `/src/components/sections/HeroSection.tsx`:
- Title: Line 27
- Tagline: Line 32

## 📸 Image Sizes

| Section | Size | Format |
|---------|------|--------|
| Hero | 1920x1080 | JPEG |
| Portfolio | 1600x1200 | JPEG |
| Gallery | 1200x1200 | JPEG |
| Logos | 400x400 | PNG |
| Headshots | 600x600 | JPEG |

## 🔧 Common Tasks

### Add Portfolio Project
1. Go to Wix Dashboard → Database → Portfolio
2. Click "Add Item"
3. Fill in fields
4. Upload images
5. Save

### Add Client Logo
1. Go to Wix Dashboard → Database → Clients & Press
2. Click "Add Item"
3. Enter name and upload logo
4. Save

### Change Hero Image
1. Edit `/src/components/sections/HeroSection.tsx`
2. Line 17: Update image URL
3. Save and refresh

### Update About Section
1. Edit `/src/components/sections/AboutSection.tsx`
2. Update text in lines 33-50
3. Save and refresh

### Add New Section
1. Create file in `/src/components/sections/`
2. Import in `/src/components/pages/HomePage.tsx`
3. Add to JSX
4. Save and refresh

### Create New Page
1. Create file in `/src/components/pages/`
2. Add route to `/src/components/Router.tsx`
3. Link from Header
4. Save and refresh

## 🌓 Dark Mode

- Toggle: Moon/Sun icon in header
- Preference: Stored in localStorage
- Styling: Use `dark:` prefix in Tailwind

## 📱 Responsive Breakpoints

```
Mobile:     < 640px
Tablet:     640px - 1024px
Desktop:    > 1024px
```

## 🎬 Animation Tweaks

Edit Framer Motion variants in section components:
```typescript
staggerChildren: 0.1    // Delay between items
delayChildren: 0.2      // Initial delay
duration: 0.6           // Animation duration
```

## 🔗 Important Links

- [Wix Dashboard](https://manage.wix.com)
- [Wix Media Manager](https://manage.wix.com/media)
- [Tailwind CSS Docs](https://tailwindcss.com)
- [Framer Motion Docs](https://www.framer.com/motion/)
- [React Router Docs](https://reactrouter.com)

## 📞 Troubleshooting

| Issue | Solution |
|-------|----------|
| Images not loading | Check CMS URLs, verify images uploaded |
| Dark mode not working | Clear cache, check localStorage |
| Portfolio items missing | Verify items in CMS, check collection ID |
| Form not submitting | Check console, verify field names |
| Slow performance | Compress images, check network tab |

## 📚 Documentation Files

- `README.md` - Quick start guide
- `PORTFOLIO_GUIDE.md` - Content management
- `DEPLOYMENT_BLUEPRINT.md` - Deployment guide
- `IMPLEMENTATION_SUMMARY.md` - Feature overview
- `QUICK_REFERENCE.md` - This file

## ✅ Pre-Launch Checklist

- [ ] Portfolio projects added (6-12 items)
- [ ] Images optimized and uploaded
- [ ] Client logos added
- [ ] Contact info updated
- [ ] Social links configured
- [ ] Dark mode tested
- [ ] Mobile responsive verified
- [ ] All links working
- [ ] Performance acceptable
- [ ] Ready to deploy

## 🎯 Performance Targets

- Page Load: < 2.5s
- Lighthouse: > 90
- Mobile Score: > 85
- Bounce Rate: < 40%

## 💡 Pro Tips

1. Use high-res images (1600px+)
2. Compress before uploading
3. Keep descriptions concise
4. Update portfolio monthly
5. Monitor analytics
6. Test on mobile first
7. Use dark mode for testing
8. Check performance regularly

---

**Last Updated**: March 2026
**Version**: 1.0
**Status**: Production Ready ✅
