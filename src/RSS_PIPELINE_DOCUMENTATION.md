# RED2 Studios Automated Content Pipeline Documentation

## Overview

This document describes the complete automated content pipeline for RED2 Studios on Wix, which fetches, parses, and displays RSS feed content from British Journal of Photography (1854.photography).

---

## PART 1: CMS COLLECTION SETUP

### Collection ID: `storiesinsights`

**Purpose:** Stores RSS feed data from British Journal of Photography with deduplication and slug generation.

**Fields:**

| Field | Type | Description |
|-------|------|-------------|
| `title` | TEXT | Main title of the story |
| `slug` | TEXT | URL-friendly identifier (auto-generated from title) |
| `sourceURL` | URL | Original article URL (used as dedup key) |
| `sourceName` | TEXT | Publication name ("British Journal of Photography") |
| `publicationDate` | DATE | Original publication date |
| `featuredImage` | IMAGE | Main image for the story |
| `excerpt` | TEXT | Short summary (max 300 chars, HTML stripped) |
| `fullSummary` | TEXT | Complete article summary/body |

**Permissions:** ANYONE (read, insert, update, remove)

**Display Field:** `title`

---

## PART 2: VELO BACKEND - RSS FETCH AND PARSE

### Files

- **`/src/lib/rss-service.ts`** - Core RSS parsing utilities
- **`/src/api/rss.ts`** - Backend processing logic
- **`/src/hooks/useRSSSync.ts`** - Frontend sync trigger

### RSS Feed Source

```
URL: https://1854.photography/feed
Source Name: British Journal of Photography
Sync Interval: Every 6 hours (automatic on page load)
```

### Processing Pipeline

#### 1. Fetch RSS Feed
```typescript
fetchRSSFeed() → RSSItem[]
```
- Fetches XML from the RSS URL
- Parses `<item>` elements
- Extracts title, link, pubDate, description, enclosure

#### 2. Deduplication
```typescript
itemExists(sourceURL: string) → boolean
```
- Queries `storiesinsights` collection
- Matches by `sourceURL` field
- Skips if duplicate found

#### 3. Image Extraction (Priority Order)
```typescript
extractFeaturedImage(item: RSSItem) → string
```
1. **RSS `<enclosure>` tag** (if present)
2. **First `<img>` in description** HTML
3. **Open Graph `og:image`** from article URL
4. **Default placeholder** image

#### 4. Slug Generation
```typescript
generateSlug(title: string) → string
```
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Max 60 characters

#### 5. Text Processing
```typescript
stripHtmlTags(html: string) → string
truncateText(text: string, maxLength: number) → string
```
- Removes all HTML tags
- Decodes HTML entities
- Truncates excerpt to 300 characters

#### 6. Insert into CMS
```typescript
processFeed() → StoriesInsightsItem[]
```
- Returns array of newly inserted items
- Called on page load and every 6 hours

### API Endpoints

#### GET `/api/stories`
Fetch all stories with pagination
```
Query Parameters:
- limit: number (default: 12)
- skip: number (default: 0)
- url: string (optional, fetch by sourceURL)

Response:
{
  items: Story[],
  totalCount: number,
  hasNext: boolean,
  currentPage: number,
  pageSize: number,
  nextSkip: number | null
}
```

#### GET `/api/stories/:slug`
Fetch single story by slug
```
Response: Story | { error: string }
```

#### GET `/api/stories/by-url`
Fetch story by source URL (for ticker matching)
```
Query Parameters:
- url: string (required, URL-encoded)

Response: Story | { error: string }
```

#### POST `/api/stories`
Manually trigger RSS feed sync
```
Response:
{
  success: boolean,
  itemsAdded: number,
  items: StoriesInsightsItem[]
}
```

---

## PART 3: DYNAMIC PAGE TEMPLATE

### Route: `/stories/{slug}`

**Component:** `StoriesDetailPage.tsx`

### Layout & Design

#### Hero Section
- **Full-bleed featured image**, 70vh height
- **Dark gradient overlay** on bottom 40%: `linear-gradient(transparent, #0a0a0a)`
- **Title** in Cormorant Garamond, large weight, white
- **Zero rounded corners** on image

#### Meta Row
- **Format:** `{sourceName} · {publicationDate}`
- **Font:** Montserrat Light, small, letter-spacing: 0.15em
- **Color:** #888888
- **Border:** 1px top and bottom, #2a2a2a

#### Body Content
- **Excerpt** (pull quote treatment)
  - Font: Cormorant Garamond, italic
  - Color: #aaaaaa
  - Margin bottom: 3rem
  
- **Full Summary**
  - Font: Montserrat Light, regular
  - Color: #e8e0d0
  - Line-height: 1.8
  - Max width: 720px, centered

#### Article Footer
- **Separator:** 1px rule, #2a2a2a
- **Link:** "READ ORIGINAL STORY →"
  - Font: Montserrat Light, wide tracking
  - No button styling, no underline
  - Opens sourceURL in new tab
  
- **Attribution:** "Via British Journal of Photography — 1854.photography"
  - Font: Montserrat Light, small
  - Color: #555555

#### Global Styles
- **Background:** #0a0a0a
- **Text:** #e8e0d0 (primary), #888888 (secondary)
- **No rounded corners**
- **No drop shadows**

---

## PART 4: RSS TICKER LINK BEHAVIOR

### File: `/src/components/FashionTicker.tsx`

### Behavior

1. **Fetch blog posts** from `blogposts` CMS collection
2. **For each item**, attempt to match with `storiesinsights` by `sourceURL`
3. **If match found:** Link to `/stories/{slug}` (internal)
4. **If no match:** Link to external `sourceURL` (fallback)
5. **Next sync cycle** will populate missing matches

### Implementation

```typescript
// For each blog post:
const story = await fetchStoryBySourceURL(externalLink);
const link = story ? `/stories/${story.slug}` : externalLink;
```

### Ticker Display
- Continuous scrolling animation
- Duplicated items for seamless loop
- Hover state transitions to primary color
- 30-minute refresh interval

---

## PART 5: STORIES & INSIGHTS INDEX PAGE

### Route: `/stories`

**Component:** `StoriesIndexPage.tsx`

### Layout & Design

#### Page Header
- **Title:** "Stories & Insights" (Cormorant Garamond, 6xl)
- **Subtitle:** "Curated from British Journal of Photography" (Montserrat Light, small, tracking-widest)

#### Masonry Grid
- **Asymmetric layout** (not uniform)
- **Gap:** 12px
- **Responsive:** 1 col (mobile), 2 cols (tablet), 3 cols (desktop)
- **Featured items:** Every 5th item spans 2x2

#### Card Design
- **Featured image:** Full bleed, no border, no rounded corners
- **Aspect ratio:** Square (1:1)
- **Title overlay:** Bottom of card
  - Font: Cormorant Garamond, white
  - Positioned over vignette

- **Meta:** Below title
  - Format: `{sourceName} · {publicationDate}`
  - Font: Montserrat Light, #888888, small

- **Hover effect:**
  - Scale: 1.02
  - Vignette opacity: 0.6 → 0.8
  - Transition: 300ms

- **Entire card clickable** → `/stories/{slug}`

#### Infinite Scroll
- **Initial load:** 12 items
- **Load more:** On scroll to bottom
- **Trigger:** IntersectionObserver on sentinel element
- **Loading state:** "Loading more stories..." text

#### Empty State
- **Message:** "No stories available yet. Check back soon!"
- **Centered, Montserrat Light, #888888**

### Global Styles
- **Background:** #0a0a0a
- **Text:** #e8e0d0 (primary), #888888 (secondary)
- **No rounded corners**
- **No drop shadows**
- **Max width:** 100rem (1600px)

---

## INTEGRATION POINTS

### 1. Homepage RSS Sync
- **File:** `/src/components/pages/HomePage.tsx`
- **Hook:** `useRSSSync()`
- **Behavior:** Syncs feed on page load, then every 6 hours

### 2. Ticker Link Routing
- **File:** `/src/components/FashionTicker.tsx`
- **Behavior:** Matches blog posts to stories, routes internally if match found

### 3. Dynamic Page Routing
- **File:** `/src/components/Router.tsx`
- **Routes:**
  - `/stories` → StoriesIndexPage
  - `/stories/:slug` → StoriesDetailPage

---

## DATA FLOW DIAGRAM

```
RSS Feed (1854.photography)
    ↓
fetchRSSFeed() [rss-service.ts]
    ↓
Parse XML → Extract items
    ↓
For each item:
  ├─ Check if exists (sourceURL match)
  ├─ If duplicate → Skip
  └─ If new:
      ├─ Extract featured image (4-priority fallback)
      ├─ Generate slug
      ├─ Strip HTML from excerpt
      └─ Insert into storiesinsights collection
    ↓
Return newly inserted items
    ↓
Frontend displays via:
  ├─ StoriesIndexPage (masonry grid)
  ├─ StoriesDetailPage (full article)
  └─ FashionTicker (linked headlines)
```

---

## USAGE EXAMPLES

### Trigger Manual Sync
```typescript
const response = await fetch('/api/stories', { method: 'POST' });
const { itemsAdded } = await response.json();
console.log(`Added ${itemsAdded} new stories`);
```

### Fetch Stories for Index Page
```typescript
const response = await fetch('/api/stories?limit=12&skip=0');
const { items, hasNext } = await response.json();
```

### Fetch Single Story
```typescript
const response = await fetch('/api/stories/my-story-slug');
const story = await response.json();
```

### Match Ticker Item to Story
```typescript
const response = await fetch(`/api/stories/by-url?url=${encodeURIComponent(externalLink)}`);
const story = await response.json();
const internalLink = story ? `/stories/${story.slug}` : externalLink;
```

---

## TROUBLESHOOTING

### No stories appearing
1. Check RSS feed URL is accessible: https://1854.photography/feed
2. Verify `storiesinsights` collection exists in CMS
3. Check browser console for fetch errors
4. Manually trigger sync: `POST /api/stories`

### Duplicate stories
1. Check `sourceURL` field for duplicates in CMS
2. Clear collection and re-sync if needed
3. Verify deduplication logic in `itemExists()`

### Images not loading
1. Check featured image URL is valid
2. Verify fallback priority order in `extractFeaturedImage()`
3. Check default placeholder image URL

### Ticker not linking internally
1. Verify blog post has `externalLink` field populated
2. Check if matching story exists in `storiesinsights`
3. Verify slug generation is correct

---

## PERFORMANCE NOTES

- **RSS Sync:** Runs every 6 hours (configurable in `useRSSSync`)
- **Image Extraction:** May fetch OG image from external URL (async)
- **Pagination:** Default 12 items per page (configurable)
- **Infinite Scroll:** Uses IntersectionObserver (efficient)
- **Caching:** Consider implementing HTTP caching headers for API responses

---

## SECURITY NOTES

- **HTML Stripping:** All user-generated content from RSS is sanitized
- **URL Validation:** External URLs are validated before use
- **CORS:** Ensure RSS feed allows cross-origin requests
- **Rate Limiting:** Consider implementing rate limits on sync endpoint

---

## FUTURE ENHANCEMENTS

1. **Search functionality** for stories
2. **Category/tag filtering** on index page
3. **Related stories** on detail page
4. **Social sharing** buttons
5. **Comment system** integration
6. **Email newsletter** signup
7. **Advanced analytics** tracking
8. **Multi-source RSS** feeds
9. **Manual story creation** (non-RSS)
10. **Story archiving** by date

---

## Support

For issues or questions, refer to:
- CMS Collection: https://manage.wix.com/dashboard/3e83fde1-087e-4b66-b0cf-76bdb8b35929/database
- RSS Feed: https://1854.photography/feed
- Component Files: `/src/components/pages/Stories*`
- API Files: `/src/api/stories.ts`, `/src/api/rss.ts`
- Utilities: `/src/lib/rss-service.ts`
