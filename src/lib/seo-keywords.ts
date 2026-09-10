/**
 * SEO Keywords and Content Strategy
 * Optimized for AI and search engine ranking
 */

export const SEO_KEYWORDS = {
  primary: [
    'fashion photographer',
    'editorial photographer',
    'campaign photography',
    'Los Angeles photographer',
    'professional photography',
    'commercial photographer',
    'portrait photographer',
    'fashion photography services',
  ],
  secondary: [
    'fashion photoshoot',
    'editorial photography services',
    'campaign photographer',
    'LA photographer',
    'professional photo services',
    'commercial photography',
    'portrait photography',
    'photography booking',
    'photographer for hire',
    'professional photographer',
  ],
  longTail: [
    'fashion photographer in Los Angeles',
    'professional editorial photography services',
    'campaign photography for brands',
    'book a fashion photographer',
    'commercial photography Los Angeles',
    'professional portrait photographer',
    'fashion photoshoot Los Angeles',
    'editorial photography portfolio',
    'hire a professional photographer',
    'fashion photography portfolio',
  ],
  technical: [
    'photography portfolio',
    'photographer services',
    'photography booking system',
    'professional photography',
    'photography gallery',
  ],
};

export const PAGE_KEYWORDS = {
  home: [
    'fashion photographer',
    'editorial photographer',
    'Los Angeles photographer',
    'professional photography',
    'photography services',
  ],
  portfolio: [
    'photography portfolio',
    'fashion photography',
    'editorial photography',
    'photography gallery',
    'professional work',
  ],
  booking: [
    'book photographer',
    'photography booking',
    'schedule photoshoot',
    'hire photographer',
    'photography session',
  ],
  contact: [
    'contact photographer',
    'photography inquiry',
    'hire photographer',
    'photography services',
    'get in touch',
  ],
};

export const CONTENT_STRATEGY = {
  homepage: {
    h1: 'Professional Fashion & Editorial Photographer | RED² Studios',
    description: 'Jordan Michael Zuniga - 25 years of experience, 500+ projects. Fashion, editorial, and campaign photography. Fully mobile across the US. Book your session today.',
    keywords: PAGE_KEYWORDS.home.join(', '),
  },
  portfolio: {
    h1: 'Photography Portfolio | Fashion & Editorial Work',
    description: 'Explore our extensive portfolio of fashion, editorial, and campaign photography projects. Professional work showcasing 25 years of experience.',
    keywords: PAGE_KEYWORDS.portfolio.join(', '),
  },
  booking: {
    h1: 'Book a Photography Session | RED² Studios',
    description: 'Schedule your professional photography session. Available for fashion, editorial, and commercial photography projects.',
    keywords: PAGE_KEYWORDS.booking.join(', '),
  },
  contact: {
    h1: 'Contact RED² Studios | Get in Touch',
    description: 'Contact us for photography inquiries, bookings, or collaborations. Professional photography services available.',
    keywords: PAGE_KEYWORDS.contact.join(', '),
  },
};

/**
 * Generate AI-optimized meta description
 */
export const generateAIOptimizedDescription = (
  baseDescription: string,
  keywords: string[]
): string => {
  // Ensure description includes primary keywords naturally
  let optimized = baseDescription;
  
  // Add keyword emphasis if not already present
  const primaryKeyword = keywords[0];
  if (!optimized.toLowerCase().includes(primaryKeyword.toLowerCase())) {
    optimized = `${primaryKeyword}. ${optimized}`;
  }
  
  // Ensure length is optimal for search engines (150-160 chars)
  if (optimized.length > 160) {
    optimized = optimized.substring(0, 157) + '...';
  }
  
  return optimized;
};

/**
 * Generate semantic HTML heading structure
 */
export const getHeadingStructure = (page: string) => {
  const structures: Record<string, { h1: string; h2: string[] }> = {
    home: {
      h1: 'Professional Fashion & Editorial Photographer',
      h2: [
        'About My Work',
        'Featured Projects',
        'Behind the Scenes',
        'Client Testimonials',
        'Book a Session',
      ],
    },
    portfolio: {
      h1: 'Photography Portfolio',
      h2: [
        'Fashion Photography',
        'Editorial Work',
        'Campaign Projects',
        'Recent Work',
      ],
    },
    booking: {
      h1: 'Book Your Photography Session',
      h2: [
        'Available Sessions',
        'Pricing',
        'Session Details',
        'Booking Process',
      ],
    },
    contact: {
      h1: 'Get in Touch',
      h2: [
        'Contact Information',
        'Send a Message',
        'Follow Us',
      ],
    },
  };
  
  return structures[page] || structures.home;
};

/**
 * Generate rich text content for AI understanding
 */
export const generateRichContent = (section: string): string => {
  const content: Record<string, string> = {
    about: `
      Professional photographer with 25 years of experience specializing in fashion, editorial, and campaign photography.
      Completed over 500 projects for leading brands and publications. Available for bookings across the United States.
      Expertise in fashion photography, editorial photography, commercial photography, and portrait photography.
    `,
    services: `
      Services include: Fashion Photography, Editorial Photography, Campaign Photography, Commercial Photography,
      Portrait Photography, Product Photography, Event Photography, and Corporate Photography.
    `,
    portfolio: `
      Extensive portfolio showcasing professional fashion photography, editorial work, and campaign projects.
      Each project demonstrates expertise in lighting, composition, and creative direction.
    `,
  };
  
  return content[section] || '';
};
