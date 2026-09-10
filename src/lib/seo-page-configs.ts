/**
 * SEO Page Configurations - Aggressive Next-Gen SEO Strategy
 * Centralized SEO metadata for all pages with AI optimization
 */

import { generateAdvancedSchema } from './seo-magic-engine';

export interface PageSEOConfig {
  title: string;
  description: string;
  keywords: string[];
  image?: string;
  canonical: string;
  ogType?: string;
  twitterCard?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  isArticle?: boolean;
  articleSection?: string;
  wordCount?: number;
  readingTime?: number;
  breadcrumbs?: Array<{ name: string; url: string }>;
  schema?: any;
  rating?: number;
  ratingCount?: number;
  price?: string;
  priceCurrency?: string;
  availability?: string;
  locale?: string;
  alternateLocales?: string[];
}

// HOME PAGE - Maximum SEO Power
export const HOME_PAGE_SEO: PageSEOConfig = {
  title: 'Professional Fashion & Editorial Photographer | RED² Studios | Los Angeles',
  description: 'Jordan Michael Zuniga - Award-winning photographer with 25+ years of experience. 500+ completed projects in fashion, editorial, and campaign photography. Fully mobile across the US. Book your session today.',
  keywords: [
    'fashion photographer',
    'editorial photographer',
    'professional photographer',
    'Los Angeles photographer',
    'commercial photography',
    'campaign photography',
    'portrait photographer',
    'fashion photography',
    'photography services',
    'professional photography',
    'RED² Studios',
    'Jordan Michael Zuniga',
    'photography booking',
    'professional photo shoot',
    'creative photography',
  ],
  canonical: 'https://red2studios.com',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  author: 'Jordan Michael Zuniga',
  locale: 'en_US',
  schema: generateAdvancedSchema('Organization', {
    name: 'RED² Studios',
    description: 'Professional fashion and editorial photography studio',
  }),
};

// PORTFOLIO PAGE - Gallery Optimization
export const PORTFOLIO_PAGE_SEO: PageSEOConfig = {
  title: 'Photography Portfolio | 500+ Projects | Fashion & Editorial Work | RED² Studios',
  description: 'Explore our extensive portfolio of professional fashion, editorial, and campaign photography. 500+ completed projects showcasing 25 years of creative excellence, precision, and artistic vision.',
  keywords: [
    'photography portfolio',
    'fashion photography portfolio',
    'editorial photography portfolio',
    'professional photography gallery',
    'photography work samples',
    'creative photography portfolio',
    'commercial photography portfolio',
    'fashion photography gallery',
    'editorial photography gallery',
    'photography projects',
    'professional photo gallery',
    'photography showcase',
    'portfolio gallery',
    'photography examples',
    'professional work samples',
  ],
  canonical: 'https://red2studios.com/portfolio',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  author: 'Jordan Michael Zuniga',
  breadcrumbs: [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Portfolio', url: 'https://red2studios.com/portfolio' },
  ],
  schema: generateAdvancedSchema('ImageGallery', {
    name: 'Photography Portfolio Gallery',
    description: 'Professional photography portfolio with 500+ completed projects',
  }),
};

// ABOUT PAGE - Authority Building
export const ABOUT_PAGE_SEO: PageSEOConfig = {
  title: 'About Jordan Michael Zuniga | 25+ Years Photography Experience | RED² Studios',
  description: 'Learn about Jordan Michael Zuniga, an award-winning photographer with 25+ years of experience in fashion, editorial, and commercial photography. Discover our creative process and commitment to excellence.',
  keywords: [
    'about photographer',
    'Jordan Michael Zuniga',
    'photographer biography',
    'photography experience',
    'professional photographer',
    'fashion photographer',
    'editorial photographer',
    'photographer background',
    'photography expertise',
    'creative photographer',
    'award-winning photographer',
    'photography skills',
    'photographer portfolio',
    'professional experience',
    'photography career',
  ],
  canonical: 'https://red2studios.com/about',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  author: 'Jordan Michael Zuniga',
  isArticle: true,
  articleSection: 'About',
  breadcrumbs: [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'About', url: 'https://red2studios.com/about' },
  ],
  schema: generateAdvancedSchema('Person', {
    name: 'Jordan Michael Zuniga',
    description: 'Award-winning photographer with 25+ years of experience',
  }),
};

// CONTACT PAGE - Conversion Optimization
export const CONTACT_PAGE_SEO: PageSEOConfig = {
  title: 'Contact RED² Studios | Book Your Photography Session | Los Angeles',
  description: 'Get in touch with RED² Studios to book your photography session. Professional fashion, editorial, and commercial photography services. Fast response time, flexible scheduling.',
  keywords: [
    'contact photographer',
    'book photographer',
    'photography booking',
    'photography services',
    'hire photographer',
    'professional photographer',
    'photography session',
    'photography inquiry',
    'contact RED² Studios',
    'photography consultation',
    'book photography session',
    'photography rates',
    'photography packages',
    'photography contact',
    'professional photography services',
  ],
  canonical: 'https://red2studios.com/contact',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  author: 'Jordan Michael Zuniga',
  breadcrumbs: [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Contact', url: 'https://red2studios.com/contact' },
  ],
  schema: generateAdvancedSchema('LocalBusiness', {
    name: 'RED² Studios',
    description: 'Professional photography studio',
  }),
};

// BOOKING PAGE - Service Optimization
export const BOOKING_PAGE_SEO: PageSEOConfig = {
  title: 'Book Photography Session | Professional Photographer | RED² Studios',
  description: 'Book your professional photography session with RED² Studios. Easy online booking, flexible scheduling, and transparent pricing for fashion, editorial, and commercial photography.',
  keywords: [
    'book photography',
    'photography booking',
    'schedule photography session',
    'book photographer',
    'photography appointment',
    'photography session booking',
    'professional photography booking',
    'online photography booking',
    'photography scheduling',
    'book photo shoot',
    'photography reservation',
    'photography calendar',
    'book session',
    'photography availability',
    'schedule photo session',
  ],
  canonical: 'https://red2studios.com/booking',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  author: 'Jordan Michael Zuniga',
  breadcrumbs: [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Booking', url: 'https://red2studios.com/booking' },
  ],
  schema: generateAdvancedSchema('LocalBusiness', {
    name: 'RED² Studios',
    description: 'Professional photography booking service',
  }),
};

// BLOG PAGE - Content Authority
export const BLOG_PAGE_SEO: PageSEOConfig = {
  title: 'Photography Blog | Tips, Insights & Behind-the-Scenes | RED² Studios',
  description: 'Explore our photography blog featuring expert tips, industry insights, behind-the-scenes stories, and creative techniques from 25+ years of professional photography experience.',
  keywords: [
    'photography blog',
    'photography tips',
    'photography advice',
    'photography insights',
    'photography techniques',
    'fashion photography tips',
    'editorial photography',
    'photography trends',
    'photography inspiration',
    'photography guide',
    'photography tutorial',
    'photography articles',
    'photography news',
    'photography industry',
    'creative photography',
  ],
  canonical: 'https://red2studios.com/blog',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  author: 'Jordan Michael Zuniga',
  breadcrumbs: [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Blog', url: 'https://red2studios.com/blog' },
  ],
  schema: generateAdvancedSchema('ImageGallery', {
    name: 'Photography Blog',
    description: 'Photography tips, insights, and behind-the-scenes stories',
  }),
};

// STORIES PAGE - Content Marketing
export const STORIES_PAGE_SEO: PageSEOConfig = {
  title: 'Photography Stories & Case Studies | RED² Studios',
  description: 'Read inspiring photography stories and detailed case studies from RED² Studios. Learn about our creative process, client collaborations, and successful photography projects.',
  keywords: [
    'photography stories',
    'case studies',
    'photography projects',
    'client stories',
    'photography case study',
    'project showcase',
    'photography success stories',
    'creative projects',
    'photography collaboration',
    'project details',
    'photography journey',
    'behind the scenes',
    'photography process',
    'creative process',
    'photography inspiration',
  ],
  canonical: 'https://red2studios.com/stories',
  ogType: 'website',
  twitterCard: 'summary_large_image',
  author: 'Jordan Michael Zuniga',
  breadcrumbs: [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Stories', url: 'https://red2studios.com/stories' },
  ],
  schema: generateAdvancedSchema('ImageGallery', {
    name: 'Photography Stories',
    description: 'Photography case studies and creative stories',
  }),
};

// WATCH PAGE - Video Content
export const WATCH_PAGE_SEO: PageSEOConfig = {
  title: 'Photography Videos & Reels | Behind-the-Scenes | RED² Studios',
  description: 'Watch professional photography videos, behind-the-scenes content, and creative reels from RED² Studios. See our photography process and creative techniques in action.',
  keywords: [
    'photography videos',
    'photography reels',
    'behind the scenes video',
    'photography content',
    'video portfolio',
    'photography process video',
    'creative video',
    'photography tutorial video',
    'professional video',
    'photography showcase video',
    'creative content',
    'video gallery',
    'photography clips',
    'professional content',
    'creative videos',
  ],
  canonical: 'https://red2studios.com/watch',
  ogType: 'video.other',
  twitterCard: 'player',
  author: 'Jordan Michael Zuniga',
  breadcrumbs: [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Watch', url: 'https://red2studios.com/watch' },
  ],
  schema: generateAdvancedSchema('ImageGallery', {
    name: 'Photography Videos',
    description: 'Professional photography videos and behind-the-scenes content',
  }),
};

/**
 * Get SEO config for a specific page
 */
export function getPageSEOConfig(pagePath: string): PageSEOConfig | null {
  const path = pagePath.toLowerCase().trim();

  if (path === '/' || path === '') {
    return HOME_PAGE_SEO;
  }
  if (path.includes('portfolio')) {
    return PORTFOLIO_PAGE_SEO;
  }
  if (path.includes('about')) {
    return ABOUT_PAGE_SEO;
  }
  if (path.includes('contact')) {
    return CONTACT_PAGE_SEO;
  }
  if (path.includes('booking')) {
    return BOOKING_PAGE_SEO;
  }
  if (path.includes('blog')) {
    return BLOG_PAGE_SEO;
  }
  if (path.includes('stories')) {
    return STORIES_PAGE_SEO;
  }
  if (path.includes('watch')) {
    return WATCH_PAGE_SEO;
  }

  return null;
}

/**
 * Generate dynamic blog post SEO config
 */
export function generateBlogPostSEO(post: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
}): PageSEOConfig {
  const wordCount = post.content.split(/\s+/).length;
  const readingTime = Math.ceil(wordCount / 200);

  return {
    title: `${post.title} | Photography Blog | RED² Studios`,
    description: post.excerpt || post.content.substring(0, 160),
    keywords: [
      'photography',
      'blog',
      post.title.toLowerCase(),
      'photography tips',
      'photography guide',
      'photography tutorial',
    ],
    canonical: `https://red2studios.com/blog/${post.slug}`,
    ogType: 'article',
    twitterCard: 'summary_large_image',
    author: post.author || 'Jordan Michael Zuniga',
    datePublished: post.datePublished || new Date().toISOString(),
    dateModified: post.dateModified || new Date().toISOString(),
    isArticle: true,
    articleSection: 'Photography',
    wordCount,
    readingTime,
    image: post.image,
    breadcrumbs: [
      { name: 'Home', url: 'https://red2studios.com' },
      { name: 'Blog', url: 'https://red2studios.com/blog' },
      { name: post.title, url: `https://red2studios.com/blog/${post.slug}` },
    ],
    schema: generateAdvancedSchema('Article', {
      title: post.title,
      description: post.excerpt,
      image: post.image,
      author: post.author || 'Jordan Michael Zuniga',
      datePublished: post.datePublished,
      dateModified: post.dateModified,
      wordCount,
      section: 'Photography',
    }),
  };
}

/**
 * Generate dynamic portfolio item SEO config
 */
export function generatePortfolioItemSEO(item: {
  id: string;
  title: string;
  description: string;
  image?: string;
  category?: string;
  dateCreated?: string;
}): PageSEOConfig {
  return {
    title: `${item.title} | Photography Portfolio | RED² Studios`,
    description: item.description || `Professional ${item.category || 'photography'} work by RED² Studios`,
    keywords: [
      'photography',
      'portfolio',
      item.category || 'photography',
      item.title.toLowerCase(),
      'professional photography',
      'creative photography',
    ],
    canonical: `https://red2studios.com/portfolio/${item.id}`,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    author: 'Jordan Michael Zuniga',
    datePublished: item.dateCreated || new Date().toISOString(),
    image: item.image,
    breadcrumbs: [
      { name: 'Home', url: 'https://red2studios.com' },
      { name: 'Portfolio', url: 'https://red2studios.com/portfolio' },
      { name: item.title, url: `https://red2studios.com/portfolio/${item.id}` },
    ],
    schema: generateAdvancedSchema('ImageGallery', {
      name: item.title,
      description: item.description,
      images: [{ url: item.image, name: item.title }],
    }),
  };
}
