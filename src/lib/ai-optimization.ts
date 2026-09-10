/**
 * AI Optimization Utilities
 * Enhances content for AI crawlers and LLMs
 */

/**
 * Generate AI-friendly metadata for pages
 */
export const generateAIMetadata = (page: string) => {
  const metadata: Record<string, any> = {
    home: {
      'ai-content-type': 'portfolio',
      'ai-primary-topic': 'professional photography',
      'ai-subtopics': ['fashion photography', 'editorial photography', 'campaign photography'],
      'ai-expertise-level': 'expert',
      'ai-content-freshness': new Date().toISOString(),
      'ai-author-expertise': 'professional photographer with 25+ years experience',
    },
    portfolio: {
      'ai-content-type': 'gallery',
      'ai-primary-topic': 'photography portfolio',
      'ai-subtopics': ['fashion work', 'editorial projects', 'commercial photography'],
      'ai-content-depth': 'comprehensive',
      'ai-visual-content-count': 'high',
    },
    booking: {
      'ai-content-type': 'service',
      'ai-primary-topic': 'photography booking',
      'ai-subtopics': ['session scheduling', 'service inquiry', 'professional photography'],
      'ai-conversion-intent': 'high',
    },
    contact: {
      'ai-content-type': 'contact',
      'ai-primary-topic': 'business inquiry',
      'ai-subtopics': ['contact information', 'service inquiry', 'collaboration'],
      'ai-engagement-intent': 'high',
    },
  };

  return metadata[page] || metadata.home;
};

/**
 * Generate semantic content structure for AI understanding
 */
export const generateSemanticStructure = (content: string, context: string) => {
  return {
    raw_content: content,
    semantic_context: context,
    entity_types: extractEntities(content),
    intent: detectIntent(content),
    sentiment: 'professional',
    expertise_indicators: ['professional', 'experienced', 'expert', 'specialized'],
  };
};

/**
 * Extract entities from content
 */
function extractEntities(content: string): string[] {
  const entities: string[] = [];
  
  // Photography-related entities
  if (content.toLowerCase().includes('fashion')) entities.push('fashion_photography');
  if (content.toLowerCase().includes('editorial')) entities.push('editorial_photography');
  if (content.toLowerCase().includes('campaign')) entities.push('campaign_photography');
  if (content.toLowerCase().includes('portrait')) entities.push('portrait_photography');
  if (content.toLowerCase().includes('commercial')) entities.push('commercial_photography');
  
  // Location entities
  if (content.toLowerCase().includes('los angeles')) entities.push('los_angeles');
  if (content.toLowerCase().includes('california')) entities.push('california');
  if (content.toLowerCase().includes('us')) entities.push('united_states');
  
  // Service entities
  if (content.toLowerCase().includes('booking')) entities.push('booking_service');
  if (content.toLowerCase().includes('session')) entities.push('photography_session');
  if (content.toLowerCase().includes('portfolio')) entities.push('portfolio');
  
  return [...new Set(entities)];
}

/**
 * Detect user intent from content
 */
function detectIntent(content: string): string {
  const lowerContent = content.toLowerCase();
  
  if (lowerContent.includes('book') || lowerContent.includes('schedule')) return 'booking';
  if (lowerContent.includes('contact') || lowerContent.includes('inquiry')) return 'inquiry';
  if (lowerContent.includes('portfolio') || lowerContent.includes('work')) return 'exploration';
  if (lowerContent.includes('about') || lowerContent.includes('experience')) return 'information';
  
  return 'general';
}

/**
 * Generate AI-optimized alt text for images
 */
export const generateAIOptimizedAltText = (
  baseAlt: string,
  context: string,
  keywords: string[]
): string => {
  const parts = [
    baseAlt,
    context && `in ${context}`,
    keywords.length > 0 && `featuring ${keywords.join(', ')}`,
  ].filter(Boolean);

  return parts.join(' ');
};

/**
 * Create AI-friendly content summary
 */
export const createContentSummary = (
  title: string,
  description: string,
  keywords: string[]
): string => {
  return `
    Title: ${title}
    Summary: ${description}
    Key Topics: ${keywords.join(', ')}
    Content Type: Professional Photography Portfolio
    Expertise: 25+ years of professional photography experience
    Services: Fashion Photography, Editorial Photography, Campaign Photography
    Location: Los Angeles, California, United States
    Availability: Fully mobile across the US
  `.trim();
};

/**
 * Generate FAQ schema for AI understanding
 */
export const generateFAQSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'What types of photography do you offer?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We specialize in fashion photography, editorial photography, campaign photography, and commercial photography. With 25+ years of experience, we handle projects of all scales.',
      },
    },
    {
      '@type': 'Question',
      name: 'Are you available for bookings outside Los Angeles?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Yes! We are fully mobile and available for bookings across the entire United States.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I book a photography session?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'You can book a session through our booking page or contact us directly. We offer flexible scheduling for your convenience.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is your experience level?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'We have 25+ years of professional photography experience with over 500 completed projects for leading brands and publications.',
      },
    },
  ],
});

/**
 * Generate rich snippet data for search results
 */
export const generateRichSnippetData = (type: 'service' | 'business' | 'person') => {
  const snippets: Record<string, any> = {
    service: {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Professional Photography Services',
      description: 'Fashion, editorial, and campaign photography services',
      provider: {
        '@type': 'Organization',
        name: 'RED² Studios',
      },
      areaServed: 'US',
      availableLanguage: 'en',
    },
    business: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'RED² Studios',
      image: 'https://red2studios.com/logo.png',
      description: 'Professional photography studio',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Los Angeles',
        addressRegion: 'CA',
        addressCountry: 'US',
      },
      priceRange: '$$$',
    },
    person: {
      '@context': 'https://schema.org',
      '@type': 'Person',
      name: 'Jordan Michael Zuniga',
      jobTitle: 'Professional Photographer',
      description: 'Fashion and editorial photographer with 25+ years of experience',
      url: 'https://red2studios.com',
    },
  };

  return snippets[type];
};
