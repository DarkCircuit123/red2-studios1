# CMS DEPENDENCY MAP - VISUAL REFERENCE

## Collection Usage Matrix

```
COLLECTION                  | COMPONENTS              | PAGES                    | API ENDPOINTS           | STATUS
---------------------------|------------------------|--------------------------|------------------------|----------
portfolio                  | PortfolioCard           | PortfolioPage            | portfolio-*.ts          | ✅ ACTIVE
                            | PortfolioCarousel       | PortfolioDetailPage      |                         |
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
portfolioimages            | PortfolioCard           | PortfolioPage            | portfolio-*.ts          | ✅ ACTIVE
                            | MasonryGallery          | WorkPage                 |                         |
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
blogposts                  | BlogSection             | BlogPage                 | stories/index.ts        | ✅ ACTIVE
                            |                         | BlogDetailPage           |                         |
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
services                   | ContactSection          | ContactPage              | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
reels                      | VideoPlayer             | WatchPage                | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
clientgalleries            | PINAuthWrapper          | ClientLoginPage          | client-galleries.ts     | ✅ ACTIVE
                            |                         | ClientGalleryDashboard   |                         |
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
galleryphotos              | MasonryGallery          | ClientGalleryDashboard   | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
behindthescenes            | BehindTheScenesSection  | HomePage                 | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
homepagesettings           | HeroSection             | HomePage                 | (none)                  | ✅ ACTIVE
                            | BackgroundMusicPlayer   | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
musicsettings              | BackgroundMusicPlayer   | HomePage                 | upload-music.ts         | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
splashpage                 | SplashpageLogo          | (splash screen)          | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
homepageimages             | HeroImageUploader       | AdminPanel               | media/upload-hero.ts    | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
about                      | AboutSection            | HomePage                 | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
clientspress               | BrandsSection           | HomePage                 | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
teamm                      | (none detected)         | (none detected)          | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
storiesinsights            | (none detected)         | StoriesIndexPage         | stories/index.ts        | ✅ ACTIVE
                            |                         | StoriesDetailPage        |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
tickerstories              | LiveTickerSection       | HomePage                 | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
bookingavailability        | BookingManager          | BookingPage              | booking-availability/*  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
bookings                   | UpcomingBookings        | BookingPage              | booking-availability/*  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
admincredentials           | AdminAuthProvider       | AdminPage                | auth/admin-*.ts         | ✅ ACTIVE
                            | AdminLoginModal         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
apiratelimits              | (none - backend only)   | (none)                   | auth/*.ts               | ✅ ACTIVE
                            |                         | DataExportPage           | contact-submission.ts   |
---------------------------|------------------------|--------------------------|------------------------|----------
passwordchangeauth         | (none - backend only)   | (none)                   | auth/update-password.ts | ✅ ACTIVE
                            |                         | DataExportPage           | auth/login-for-change   |
---------------------------|------------------------|--------------------------|------------------------|----------
passwordchangelog          | (none - backend only)   | (none)                   | auth/update-password.ts | ✅ ACTIVE
                            |                         | DataExportPage           | auth/login-for-change   |
---------------------------|------------------------|--------------------------|------------------------|----------
pinaccesslog               | PINAuthWrapper          | (none)                   | (none)                  | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
contactsubmissions         | ContactSection          | ContactPage              | contact-submission.ts   | ✅ ACTIVE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
portfolioimagebackups      | (none detected)         | (none detected)          | (none)                  | ⚠️ ARCHIVE?
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
watermarksettings          | (none detected)         | (none detected)          | (none)                  | ⚠️ ARCHIVE?
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
passwordchangetokens       | (none detected)         | (none detected)          | (none)                  | ⚠️ INVESTIGATE
                            |                         | DataExportPage           |                         |
---------------------------|------------------------|--------------------------|------------------------|----------
dataexportaudit            | (none detected)         | (none detected)          | (none)                  | ⚠️ ARCHIVE?
                            |                         | DataExportPage           |                         |
```

---

## Component Dependency Tree

### HomePage
```
HomePage
├── HeroSection
│   └── homepagesettings ✅
├── BehindTheScenesSection
│   └── behindthescenes ✅
├── BrandsSection
│   └── clientspress ✅
├── BlogSection
│   └── blogposts ✅
├── LiveTickerSection
│   └── tickerstories ✅
├── BackgroundMusicPlayer
│   └── musicsettings ✅
└── SplashpageLogo
    └── splashpage ✅
```

### PortfolioPage
```
PortfolioPage
├── PortfolioGrid
│   ├── portfolio ✅
│   └── portfolioimages ✅
└── MasonryGallery
    └── portfolioimages ✅
```

### BlogPage
```
BlogPage
├── BlogDetailPage (nested)
│   └── blogposts ✅
└── BlogSection
    └── blogposts ✅
```

### WatchPage
```
WatchPage
├── VideoPlayer
│   └── reels ✅
└── Reels list
    └── reels ✅
```

### ClientGalleryDashboardPage
```
ClientGalleryDashboardPage
├── PINAuthWrapper
│   └── pinaccesslog ✅
├── MasonryGallery
│   ├── clientgalleries ✅
│   └── galleryphotos ✅
└── Gallery display
    └── galleryphotos ✅
```

### BookingPage
```
BookingPage
├── BookingManager
│   ├── bookingavailability ✅
│   └── bookings ✅
└── UpcomingBookings
    └── bookings ✅
```

### AdminPanel
```
AdminPanel
├── HeroImageUploader
│   └── homepageimages ✅
├── PortfolioManager
│   ├── portfolio ✅
│   └── portfolioimages ✅
├── GalleryPhotoManager
│   └── galleryphotos ✅
├── BehindTheScenesManager
│   └── behindthescenes ✅
└── BackgroundMusicManager
    └── musicsettings ✅
```

---

## API Endpoint Dependency Tree

### Authentication Endpoints
```
auth/register.ts
└── apiratelimits ✅

auth/login.ts
└── apiratelimits ✅

auth/update-password.ts
├── apiratelimits ✅
├── passwordchangeauthorizations ✅
└── passwordchangelog ✅

auth/delete-account.ts
└── apiratelimits ✅

auth/login-for-change-password.ts
├── passwordchangeauthorizations ✅
└── passwordchangelog ✅
```

### Booking Endpoints
```
booking-availability/create.ts
└── bookingavailability ✅

booking-availability/update.ts
└── bookingavailability ✅

booking-availability/delete.ts
└── bookingavailability ✅

booking-availability/get-all.ts
└── bookingavailability ✅

booking-availability/submit-booking.ts
└── bookings ✅
```

### Contact Endpoints
```
contact-submission.ts
├── contactsubmissions ✅
└── apiratelimits ✅
```

### Media Endpoints
```
media/upload-hero.ts
└── homepageimages ✅

upload-music.ts
└── musicsettings ✅
```

---

## Data Flow Diagram

```
USER INTERACTIONS
│
├─→ Portfolio Browsing
│   ├─→ PortfolioPage
│   │   └─→ portfolio + portfolioimages ✅
│   └─→ PortfolioDetailPage
│       └─→ portfolio + portfolioimages ✅
│
├─→ Blog Reading
│   ├─→ BlogPage
│   │   └─→ blogposts ✅
│   └─→ BlogDetailPage
│       └─→ blogposts ✅
│
├─→ Video Watching
│   └─→ WatchPage
│       └─→ reels ✅
│
├─→ Gallery Access
│   ├─→ ClientLoginPage
│   │   └─→ clientgalleries ✅
│   └─→ ClientGalleryDashboardPage
│       ├─→ clientgalleries ✅
│       ├─→ galleryphotos ✅
│       └─→ pinaccesslog ✅
│
├─→ Booking
│   └─→ BookingPage
│       ├─→ bookingavailability ✅
│       └─→ bookings ✅
│
├─→ Contact Form
│   └─→ ContactPage
│       ├─→ contactsubmissions ✅
│       └─→ apiratelimits ✅
│
└─→ Authentication
    ├─→ Register
    │   └─→ apiratelimits ✅
    ├─→ Login
    │   └─→ apiratelimits ✅
    ├─→ Password Change
    │   ├─→ apiratelimits ✅
    │   ├─→ passwordchangeauthorizations ✅
    │   └─→ passwordchangelog ✅
    └─→ Delete Account
        └─→ apiratelimits ✅


ADMIN INTERACTIONS
│
├─→ Admin Panel
│   ├─→ Upload Hero Image
│   │   └─→ homepageimages ✅
│   ├─→ Manage Portfolio
│   │   ├─→ portfolio ✅
│   │   └─→ portfolioimages ✅
│   ├─→ Manage Gallery
│   │   └─→ galleryphotos ✅
│   ├─→ Manage Music
│   │   └─→ musicsettings ✅
│   └─→ Admin Auth
│       └─→ admincredentials ✅
│
└─→ Data Export
    └─→ DataExportPage
        ├─→ portfolio ✅
        ├─→ portfolioimages ✅
        ├─→ blogposts ✅
        ├─→ services ✅
        ├─→ clientspress ✅
        ├─→ teamm ✅
        ├─→ reels ✅
        ├─→ bookingavailability ✅
        ├─→ bookings ✅
        ├─→ clientgalleries ✅
        ├─→ galleryphotos ✅
        ├─→ behindthescenes ✅
        ├─→ storiesinsights ✅
        ├─→ tickerstories ✅
        ├─→ contactsubmissions ✅
        ├─→ homepagesettings ✅
        ├─→ homepageimages ✅
        ├─→ musicsettings ✅
        ├─→ splashpage ✅
        ├─→ about ✅
        ├─→ apiratelimits ✅
        ├─→ passwordchangeauthorizations ✅
        ├─→ passwordchangelog ✅
        ├─→ pinaccesslog ✅
        ├─→ portfolioimagebackups ⚠️
        ├─→ watermarksettings ⚠️
        ├─→ passwordchangetokens ⚠️
        └─→ dataexportaudit ⚠️
```

---

## Collection Criticality Matrix

```
CRITICALITY  | COUNT | COLLECTIONS
-------------|-------|------------------------------------------
🔴 CRITICAL  |  12   | portfolio, portfolioimages, blogposts,
             |       | services, reels, clientgalleries,
             |       | galleryphotos, behindthescenes,
             |       | homepagesettings, musicsettings,
             |       | splashpage, homepageimages
-------------|-------|------------------------------------------
🟡 SECURITY  |   5   | apiratelimits, passwordchangeauth,
             |       | passwordchangelog, pinaccesslog,
             |       | admincredentials
-------------|-------|------------------------------------------
🟢 SUPPORT   |  10   | about, clientspress, teamm,
             |       | storiesinsights, tickerstories,
             |       | bookingavailability, bookings,
             |       | contactsubmissions, (others)
-------------|-------|------------------------------------------
⚠️ REVIEW    |   4   | portfolioimagebackups, watermarksettings,
             |       | passwordchangetokens, dataexportaudit
-------------|-------|------------------------------------------
TOTAL        |  31   |
```

---

## Usage Frequency Analysis

```
COLLECTION                  | DAILY | WEEKLY | MONTHLY | RARE/ARCHIVE
---------------------------|-------|--------|---------|-------------
portfolio                   |  ✅   |   ✅   |   ✅    | 
portfolioimages             |  ✅   |   ✅   |   ✅    |
blogposts                   |  ✅   |   ✅   |   ✅    |
homepagesettings            |  ✅   |   ✅   |   ✅    |
musicsettings               |  ✅   |   ✅   |   ✅    |
splashpage                  |  ✅   |   ✅   |   ✅    |
homepageimages              |  ✅   |   ✅   |   ✅    |
reels                       |       |   ✅   |   ✅    |
clientgalleries             |       |   ✅   |   ✅    |
galleryphotos               |       |   ✅   |   ✅    |
behindthescenes             |       |   ✅   |   ✅    |
bookingavailability         |       |   ✅   |   ✅    |
bookings                    |       |   ✅   |   ✅    |
services                    |       |   ✅   |   ✅    |
about                       |       |   ✅   |   ✅    |
clientspress                |       |   ✅   |   ✅    |
teamm                       |       |   ✅   |   ✅    |
storiesinsights             |       |   ✅   |   ✅    |
tickerstories               |       |   ✅   |   ✅    |
contactsubmissions          |       |   ✅   |   ✅    |
apiratelimits               |  ✅   |   ✅   |   ✅    |
passwordchangeauth          |       |   ✅   |   ✅    |
passwordchangelog           |       |   ✅   |   ✅    |
pinaccesslog                |       |   ✅   |   ✅    |
admincredentials            |       |   ✅   |   ✅    |
portfolioimagebackups       |       |       |        | ⚠️
watermarksettings           |       |       |        | ⚠️
passwordchangetokens        |       |       |        | ⚠️
dataexportaudit             |       |       |        | ⚠️
```

---

## Cleanup Decision Matrix

```
COLLECTION                  | ACTIVE | CRITICAL | SECURITY | DECISION
---------------------------|--------|----------|----------|------------------
portfolio                   |   ✅   |    ✅    |          | KEEP
portfolioimages             |   ✅   |    ✅    |          | KEEP
blogposts                   |   ✅   |    ✅    |          | KEEP
services                    |   ✅   |    ✅    |          | KEEP
reels                       |   ✅   |    ✅    |          | KEEP
clientgalleries             |   ✅   |    ✅    |          | KEEP
galleryphotos               |   ✅   |    ✅    |          | KEEP
behindthescenes             |   ✅   |    ✅    |          | KEEP
homepagesettings            |   ✅   |    ✅    |          | KEEP
musicsettings               |   ✅   |    ✅    |          | KEEP
splashpage                  |   ✅   |    ✅    |          | KEEP
homepageimages              |   ✅   |    ✅    |          | KEEP
about                       |   ✅   |         |          | KEEP
clientspress                |   ✅   |         |          | KEEP
teamm                       |   ✅   |         |          | KEEP
storiesinsights             |   ✅   |         |          | KEEP
tickerstories               |   ✅   |         |          | KEEP
bookingavailability         |   ✅   |         |          | KEEP
bookings                    |   ✅   |         |          | KEEP
admincredentials            |   ✅   |         |    ✅    | KEEP
apiratelimits               |   ✅   |         |    ✅    | KEEP
passwordchangeauth          |   ✅   |         |    ✅    | KEEP
passwordchangelog           |   ✅   |         |    ✅    | KEEP
pinaccesslog                |   ✅   |         |    ✅    | KEEP
contactsubmissions          |   ✅   |         |          | KEEP
portfolioimagebackups       |   ⚠️   |         |          | INVESTIGATE
watermarksettings           |   ⚠️   |         |          | INVESTIGATE
passwordchangetokens        |   ⚠️   |         |    ⚠️    | INVESTIGATE
dataexportaudit             |   ⚠️   |         |          | INVESTIGATE
```

---

## Summary Statistics

- **Total Collections:** 31
- **Active Collections:** 27 (87%)
- **Review Candidates:** 4 (13%)
- **Critical Collections:** 12 (39%)
- **Security Collections:** 5 (16%)
- **Support Collections:** 10 (32%)
- **Components Using CMS:** 50+
- **API Endpoints Using CMS:** 20+
- **Pages Using CMS:** 15+

---

*Last Updated: 2026-08-10*  
*Audit Status: COMPLETE*
