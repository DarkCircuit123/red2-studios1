# RED2 Photography Portfolio - Feature Guide

## 🎬 New Features Implemented

### 1. **Cinematic Splash Screen**
- Logo flies in with smooth scaling animation
- White background matching your logo
- Enlarges and fades out to home screen
- Duration: 3.5 seconds
- Fully customizable timing and animations

### 2. **Modern Typography**
- Changed from serif (Playfair Display) to modern sans-serif (Montserrat)
- Blocky, sharp, and aesthetically modern
- Perfect for fashion photography portfolio
- All headings use bold weights for impact

### 3. **Top 5 Photographer Features**

#### ✅ Client Proofing Gallery
- **Route**: `/galleries`
- **CMS Collection**: `clientgalleries`
- Clients access private galleries with unique access codes
- Approval status tracking (Pending, Approved, Rejected)
- Gallery expiration dates
- Cover images for each client gallery

#### ✅ Integrated Blog/Stories Section
- **Route**: `/blog`
- **CMS Collection**: `blogposts` (enhanced)
- Behind-the-scenes stories and photography tips
- Featured on homepage with latest posts
- Full blog page with all posts
- Support for video URLs
- Author and publication date tracking

#### ✅ Advanced Image SEO & Metadata
- **CMS Fields Added to Portfolio**:
  - `seoTitle` - Custom SEO title for search results
  - `seoDescription` - Meta description for SERPs
  - `imageAltText` - Descriptive alt text for accessibility
- Improves search engine visibility
- Better accessibility for screen readers

#### ✅ Dynamic Watermarking
- **CMS Collection**: `watermarksettings`
- Configure watermark images
- Adjust opacity (0-100%)
- Position options (top-left, center, bottom-right, etc.)
- Scale settings for watermark size
- Toggle watermarks on/off

#### ✅ Booking/Availability Calendar
- **Route**: `/booking`
- **CMS Collection**: `bookingavailability`
- Display available booking slots
- Filter by date and session type
- Manage availability directly in CMS
- Support for multiple session types (Portrait, Wedding, Commercial, etc.)

### 4. **Easy Content Management**

#### Admin Panel (Settings Icon in Header)
- Click the ⚙️ settings icon in the top-right
- Inline text editing for site content
- Drag-and-drop image uploads with auto-crop
- Quick access to CMS dashboard

#### Text Editing
- Click any text on the site to edit it inline
- Changes save automatically
- Supports multi-line content
- Easy keyboard shortcuts (Enter to save, Escape to cancel)

#### Image Management
- Drag & drop images anywhere
- Auto-crop to square (optimal for photography)
- Auto-resize to 1200x1200px (high quality)
- No quality degradation
- Supports all common image formats

#### CMS Dashboard
- Access full CMS at: https://manage.wix.com/dashboard
- Manage all collections:
  - Portfolio Projects
  - Blog Posts & Stories
  - Client Galleries
  - Booking Availability
  - Watermark Settings
  - Team Members
  - Services
  - Clients & Press

### 5. **Navigation Updates**
New navigation links added:
- **Booking** - Direct link to booking page
- **Galleries** - Client proofing galleries
- **Blog** - Stories and insights section

## 📋 How to Use Each Feature

### Adding a Blog Post
1. Go to CMS Dashboard
2. Open "Blog Posts" collection
3. Click "Add Item"
4. Fill in:
   - Title
   - Content
   - Excerpt (preview text)
   - Thumbnail Image
   - Author
   - Publication Date
   - Video URL (optional)

### Creating a Client Gallery
1. Go to CMS Dashboard
2. Open "Client Proofing Galleries"
3. Click "Add Item"
4. Fill in:
   - Client Name
   - Client Email
   - Gallery Access Code (unique code for client)
   - Approval Status
   - Gallery Cover Image
   - Expiration Date

### Setting Up Booking Slots
1. Go to CMS Dashboard
2. Open "Booking Availability"
3. Click "Add Item"
4. Fill in:
   - Booking Date
   - Start Time
   - End Time
   - Session Type
   - Is Available (toggle)

### Configuring Watermarks
1. Go to CMS Dashboard
2. Open "Watermark Settings"
3. Click "Add Item"
4. Upload watermark image
5. Set opacity (0-100%)
6. Choose position
7. Set scale percentage
8. Toggle active status

### Adding SEO to Portfolio Items
1. Go to CMS Dashboard
2. Open "Portfolio" collection
3. Edit any project
4. Scroll to new SEO fields:
   - SEO Title
   - SEO Description
   - Image Alt Text
5. Save changes

## 🎨 Design Enhancements

- **Cinematic Feel**: Smooth animations and transitions throughout
- **Modern Typography**: Clean, sharp, blocky fonts
- **Professional Layout**: Refined spacing and composition
- **Responsive Design**: Works perfectly on all devices
- **Dark Mode**: Sophisticated dark aesthetic for photography

## 🔧 Technical Details

### Collections Created
- `clientgalleries` - Client proofing galleries
- `watermarksettings` - Watermark configurations
- `bookingavailability` - Booking slots

### Fields Added to Existing Collections
- `portfolio`: seoTitle, seoDescription, imageAltText

### New Pages
- `/booking` - Booking availability page
- `/galleries` - Client galleries page
- `/blog` - Blog posts page

### New Components
- `SplashScreen.tsx` - Cinematic intro animation
- `AdminPanel.tsx` - Quick admin controls
- `TextEditableField.tsx` - Inline text editing
- `ImageUploadManager.tsx` - Drag-and-drop image upload
- `BlogSection.tsx` - Blog preview on homepage
- `BookingPage.tsx` - Booking calendar
- `ClientGalleriesPage.tsx` - Client gallery access
- `BlogPage.tsx` - Full blog listing

## 📱 Responsive & Accessible

- All features work on mobile, tablet, and desktop
- Keyboard navigation support
- WCAG accessibility standards
- Touch-friendly interfaces
- Fast loading times

## 🚀 Next Steps

1. **Customize the Splash Screen**: Edit timing and animations in `SplashScreen.tsx`
2. **Add Your Content**: Use the CMS to add portfolio items, blog posts, etc.
3. **Configure Booking**: Set up available booking slots in the CMS
4. **Create Client Galleries**: Generate access codes for clients
5. **Set Up Watermarks**: Configure your watermark settings

## 💡 Pro Tips

- Use the Admin Panel (⚙️) for quick edits
- Use the CMS Dashboard for bulk operations
- Images auto-crop to square for consistency
- All text is editable inline - just click and edit
- Booking slots can be managed entirely from CMS
- Client galleries are private and access-controlled

---

**Your photography portfolio is now production-ready with professional features!**
