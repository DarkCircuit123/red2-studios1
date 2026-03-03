# 🎨 Fashion Photography Portfolio Website

A modern, high-end fashion photography portfolio website built with React, Tailwind CSS, and Framer Motion. Fully CMS-integrated for easy content management.

## ✨ Features

- **Modern Design**: 2026 design trends with minimalist layouts and bold typography
- **CMS Integration**: Manage all content through Wix CMS without coding
- **Dark Mode**: Toggle between light and dark themes
- **Responsive**: Fully optimized for mobile, tablet, and desktop
- **Performance**: Lazy loading, optimized images, smooth animations
- **Interactive**: Carousel galleries, hover effects, lightbox views
- **Contact Form**: Integrated booking and inquiry form
- **Social Links**: Easy integration with Instagram, LinkedIn, and email

## 🚀 Quick Start

### Installation
```bash
npm install
npm run dev
```

### Build for Production
```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/
│   ├── Header.tsx              # Navigation & dark mode
│   ├── Footer.tsx              # Footer with links
│   ├── pages/
│   │   ├── HomePage.tsx        # Main landing page
│   │   ├── PortfolioPage.tsx   # Full portfolio grid
│   │   └── PortfolioDetailPage.tsx  # Project details
│   └── sections/
│       ├── HeroSection.tsx     # Hero banner
│       ├── GallerySection.tsx  # Carousel
│       ├── AboutSection.tsx    # About section
│       ├── PortfolioGrid.tsx   # Portfolio grid
│       ├── ClientsSection.tsx  # Clients & press
│       └── ContactSection.tsx  # Contact form
├── entities/
│   └── index.ts                # CMS types
└── styles/
    ├── global.css              # Global styles
    └── fonts.css               # Font imports
```

## 🎨 Design System

### Colors
- Primary: `#0f0fff` (Electric Blue)
- Primary Foreground: `#53d409` (Lime Green)
- Secondary: `#add8e6` (Light Blue)
- Foreground: `#000000` (Black)
- Background: `#ffffff` (White)

### Typography
- **Headings**: Inter (Sans-serif)
- **Body**: Merriweather (Serif)

## 📊 CMS Collections

### Portfolio (`portfolio`)
- `projectName` - Project title
- `shortDescription` - Brief description
- `fullDescription` - Detailed description
- `mainImage` - Hero image
- `category` - Project category
- `projectDate` - Completion date
- `galleryImage1/2/3` - Gallery images

### Clients & Press (`clientspress`)
- `clientName` - Brand/magazine name
- `clientLogo` - Logo image
- `externalLink` - Website link
- `highlightDescription` - Collaboration description
- `dateOfFeature` - Publication date
- `category` - Client type

### Team Members (`teammembers`)
- `name` - Member name
- `role` - Position
- `headshot` - Profile photo
- `bio` - Biography
- `specialization` - Expertise
- `socialLink` - Social profile

## 🎯 Pages

### Home Page (`/`)
- Hero section with CTA
- Featured gallery carousel
- About section with biography
- Portfolio grid (6 items)
- Clients & press highlights
- Contact form

### Portfolio Page (`/portfolio`)
- Full grid of all projects
- Category filtering
- Hover previews
- Click to view details

### Portfolio Detail (`/portfolio/:id`)
- Full project information
- Gallery lightbox
- Navigation to adjacent projects
- Related project suggestions

## 🎨 Customization

### Change Colors
Edit `tailwind.config.mjs`:
```javascript
colors: {
  primary: '#0f0fff',
  'primary-foreground': '#53d409',
  // ... more colors
}
```

### Change Fonts
Update `tailwind.config.mjs`:
```javascript
fontFamily: {
  heading: ['Inter', 'sans-serif'],
  paragraph: ['Merriweather', 'serif'],
}
```

### Add New Sections
1. Create component in `src/components/sections/`
2. Import in `HomePage.tsx`
3. Add to JSX

### Create New Pages
1. Create component in `src/components/pages/`
2. Add route to `Router.tsx`
3. Link from navigation

## 📸 Image Management

### Recommended Sizes
- Hero: 1920x1080px (16:9)
- Portfolio: 1600x1200px (4:3)
- Gallery: 1200x1200px (1:1)
- Logos: 400x400px (1:1)
- Headshots: 600x600px (1:1)

### Optimization
- Use JPEG for photos (80-90% quality)
- Use PNG for logos
- Compress with TinyPNG
- Images are lazy-loaded

## 🌓 Dark Mode

Toggle with moon/sun icon in header. Preference stored in localStorage.

Use `dark:` prefix in Tailwind:
```typescript
className="bg-white dark:bg-slate-950"
```

## 📱 Responsive Design

Breakpoints:
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

Use responsive prefixes:
```typescript
className="text-lg md:text-2xl lg:text-4xl"
```

## 🔧 Advanced

### Animations
Edit Framer Motion variants in section components:
```typescript
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};
```

### Form Integration
Contact form currently simulates submission. To integrate:
1. Use Wix Forms API
2. Integrate third-party service (Formspree, EmailJS)
3. Use Wix Contacts API

## 🚀 Deployment

### Pre-Deployment
- [ ] Add portfolio projects to CMS
- [ ] Upload high-quality images
- [ ] Add client logos
- [ ] Update contact info
- [ ] Test on mobile
- [ ] Check performance

### Deploy
```bash
npm run build
# Site automatically deployed on Wix
```

### Performance Targets
- Load time: < 2.5s
- Lighthouse: > 90
- Mobile score: > 85

## 📚 Documentation

- [Portfolio Guide](./PORTFOLIO_GUIDE.md) - Content management
- [Deployment Blueprint](./DEPLOYMENT_BLUEPRINT.md) - Deployment guide

## 🐛 Troubleshooting

**Images not loading?**
- Check URLs in CMS
- Verify images uploaded to Wix Media
- Check permissions

**Dark mode not working?**
- Clear browser cache
- Check localStorage
- Verify dark: classes

**Portfolio items not showing?**
- Verify items in CMS
- Check collection ID: `portfolio`
- Ensure fields are filled

**Form not submitting?**
- Check console for errors
- Verify field names
- Test with sample data

## 📞 Support

- [Wix Documentation](https://www.wix.com/velo/reference/wix-cms)
- [Tailwind CSS](https://tailwindcss.com)
- [Framer Motion](https://www.framer.com/motion/)
- [React Router](https://reactrouter.com)

## 📝 Content Checklist

- [ ] Portfolio projects added (6-12 items)
- [ ] Images uploaded and optimized
- [ ] Client logos added
- [ ] About section written
- [ ] Contact info updated
- [ ] Social links configured
- [ ] Dark mode tested
- [ ] Mobile tested
- [ ] Links verified
- [ ] Performance checked

## 🎯 Next Steps

1. **Add Content**: Populate CMS with projects and clients
2. **Customize**: Update colors and fonts
3. **Test**: Verify on all devices
4. **Deploy**: Site goes live automatically
5. **Monitor**: Track analytics and user feedback

## 💡 Tips

- Use high-resolution images (1600px+)
- Keep descriptions concise
- Compress images before uploading
- Update portfolio regularly
- Monitor analytics
- Test on mobile first

## 📄 License

Built on Wix platform. All rights reserved.

---

**Version**: 1.0
**Last Updated**: March 2026
**Status**: Production Ready ✅
