/**
 * SEO Keywords & Content Strategy
 * Optimized keywords for photography studio and photographer rankings
 */

export const PRIMARY_KEYWORDS = [
  'photography studio',
  'professional photographer',
  'portrait photography',
  'commercial photography',
  'studio photography',
  'photography services',
  'professional headshots',
  'event photography',
  'product photography',
  'photography booking',
];

export const SECONDARY_KEYWORDS = [
  'photography studio near me',
  'professional photographer near me',
  'best photography studio',
  'affordable photography services',
  'studio rental',
  'photo session booking',
  'professional portraits',
  'commercial photo shoot',
  'photography portfolio',
  'photographer for hire',
  'studio equipment rental',
  'photography editing services',
  'digital photography',
  'photography consultation',
  'photo retouching',
];

export const LONG_TAIL_KEYWORDS = [
  'professional photography studio for portraits',
  'commercial photography services near me',
  'book a professional photo session',
  'affordable studio photography services',
  'professional headshot photography studio',
  'event photography services',
  'product photography for e-commerce',
  'photography studio with equipment rental',
  'professional photographer for corporate events',
  'photography editing and retouching services',
  'studio photography for small business',
  'professional photography portfolio showcase',
  'photography booking system online',
  'high-quality portrait photography services',
  'commercial photography for marketing',
];

export const LOCAL_KEYWORDS = [
  'photography studio [city]',
  'professional photographer [city]',
  'portrait photography [city]',
  'commercial photography [city]',
  'photography services [city]',
  'studio rental [city]',
  'photographer for hire [city]',
  'professional headshots [city]',
  'event photography [city]',
  'product photography [city]',
];

/**
 * Generate keyword-rich content suggestions
 */
export function generateContentSuggestions() {
  return {
    homepage: {
      title: 'RED² - Professional Photography & Studio Services | Award-Winning Photographer',
      description: 'Discover RED² - a premier photography studio offering professional portraits, commercial shoots, and studio services. Award-winning photographer specializing in high-quality imagery.',
      h1: 'Professional Photography Studio & Services',
      keywords: PRIMARY_KEYWORDS.slice(0, 5),
    },
    portfolio: {
      title: 'Photography Portfolio - RED² Studio | Professional Work Showcase',
      description: 'Explore RED² photography portfolio featuring professional portraits, commercial work, and studio photography. See our award-winning projects and creative vision.',
      h1: 'Professional Photography Portfolio',
      keywords: ['photography portfolio', 'professional photography examples', 'portrait gallery'],
    },
    booking: {
      title: 'Book Your Photography Session - RED² Studio | Easy Online Booking',
      description: 'Schedule your photography session with RED² studio. Easy online booking for portraits, headshots, commercial shoots, and more. Professional photography services available.',
      h1: 'Book Your Professional Photography Session',
      keywords: ['book photographer', 'photography appointment', 'schedule photo session'],
    },
    services: {
      title: 'Photography Services - RED² Studio | Professional Solutions',
      description: 'Explore our comprehensive photography services including portraits, commercial photography, studio rental, and more. Professional solutions for all your photography needs.',
      h1: 'Professional Photography Services',
      keywords: ['photography services', 'professional photography', 'studio services'],
    },
  };
}

/**
 * SEO checklist for photographers
 */
export const SEO_CHECKLIST = [
  {
    category: 'On-Page SEO',
    items: [
      'Unique, keyword-rich title tags (50-60 characters)',
      'Compelling meta descriptions (150-160 characters)',
      'Proper heading hierarchy (H1, H2, H3)',
      'Keyword optimization in content (2-3% density)',
      'Image alt text with keywords',
      'Internal linking strategy',
      'Mobile-friendly design',
      'Fast page load speed',
    ],
  },
  {
    category: 'Technical SEO',
    items: [
      'XML sitemap submission',
      'Robots.txt optimization',
      'Structured data markup (Schema.org)',
      'Mobile responsiveness',
      'SSL certificate (HTTPS)',
      'Core Web Vitals optimization',
      'Canonical URLs',
      'Breadcrumb navigation',
    ],
  },
  {
    category: 'Content Strategy',
    items: [
      'Blog posts about photography tips',
      'Before/after portfolio showcases',
      'Client testimonials and reviews',
      'FAQ section for common questions',
      'Service pages with detailed descriptions',
      'Location-based content',
      'Video content (portfolio videos)',
      'Regular content updates',
    ],
  },
  {
    category: 'Link Building',
    items: [
      'Local business directory listings',
      'Photography association memberships',
      'Guest blogging opportunities',
      'Social media profiles',
      'Press releases',
      'Partnerships with complementary businesses',
      'Client testimonials with links',
      'Industry awards and recognition',
    ],
  },
  {
    category: 'Local SEO',
    items: [
      'Google Business Profile optimization',
      'Local keyword targeting',
      'Location-specific landing pages',
      'Local citations and NAP consistency',
      'Local reviews and ratings',
      'Local schema markup',
      'Service area pages',
      'Local link building',
    ],
  },
];

/**
 * Generate meta tags for different pages
 */
export function generateMetaTags(page: string) {
  const suggestions = generateContentSuggestions();
  const pageData = suggestions[page as keyof typeof suggestions];

  if (!pageData) return null;

  return {
    title: pageData.title,
    description: pageData.description,
    keywords: pageData.keywords.join(', '),
    ogTitle: pageData.title,
    ogDescription: pageData.description,
    ogType: 'website',
    twitterCard: 'summary_large_image',
    twitterTitle: pageData.title,
    twitterDescription: pageData.description,
  };
}
