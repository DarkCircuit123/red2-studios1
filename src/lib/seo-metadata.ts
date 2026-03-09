/**
 * SEO Metadata Configuration
 * Provides structured data and meta tags for all pages
 */

export interface SEOMetadata {
  title: string;
  description: string;
  keywords: string[];
  ogImage?: string;
  ogType?: string;
  canonicalUrl?: string;
  author?: string;
  robots?: string;
}

export const DEFAULT_SEO: SEOMetadata = {
  title: 'RED² - Professional Photography & Studio Services',
  description: 'Award-winning photography studio specializing in professional portraits, commercial photography, and studio services. Book your session with RED² today.',
  keywords: [
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
  ],
  ogType: 'website',
  robots: 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1',
  author: 'RED² Studios',
};

export const PAGE_SEO: Record<string, SEOMetadata> = {
  home: {
    title: 'RED² - Professional Photography & Studio Services | Book Now',
    description: 'Discover RED² - a premier photography studio offering professional portraits, commercial shoots, and studio services. Award-winning photographer specializing in high-quality imagery.',
    keywords: [
      'photography studio near me',
      'professional photographer',
      'portrait photography',
      'commercial photography',
      'studio rental',
      'photography services',
      'professional headshots',
      'photography booking',
      'RED² studios',
    ],
    ogType: 'website',
  },
  portfolio: {
    title: 'Portfolio - RED² Photography Studio | Professional Work Showcase',
    description: 'Explore RED² photography portfolio featuring professional portraits, commercial work, and studio photography. See our award-winning projects and creative vision.',
    keywords: [
      'photography portfolio',
      'professional photography examples',
      'portrait gallery',
      'commercial photography work',
      'photography showcase',
      'professional photographer portfolio',
    ],
    ogType: 'website',
  },
  booking: {
    title: 'Book Your Session - RED² Photography Studio',
    description: 'Schedule your photography session with RED² studio. Easy online booking for portraits, headshots, commercial shoots, and more. Professional photography services available.',
    keywords: [
      'book photographer',
      'photography appointment',
      'schedule photo session',
      'book studio session',
      'photography booking online',
      'professional photography services',
    ],
    ogType: 'website',
  },
  galleries: {
    title: 'Client Galleries - RED² Photography | Proofing & Approval',
    description: 'Access your RED² client gallery for proofing, selection, and approval of your professional photographs. Secure online gallery for your photos.',
    keywords: [
      'photo gallery',
      'client proofing',
      'photography gallery',
      'online photo gallery',
      'professional photo gallery',
      'secure photo sharing',
    ],
    ogType: 'website',
  },
  blog: {
    title: 'Photography Blog - RED² Studio | Tips & Insights',
    description: 'Read photography tips, industry insights, and behind-the-scenes stories from RED² studio. Learn about professional photography techniques and trends.',
    keywords: [
      'photography blog',
      'photography tips',
      'photography advice',
      'photography tutorials',
      'professional photography insights',
      'photography industry news',
    ],
    ogType: 'website',
  },
};

/**
 * Generate structured data (JSON-LD) for SEO
 */
export function generateStructuredData(type: 'Organization' | 'LocalBusiness' | 'Service' | 'BlogPosting', data?: any) {
  const baseOrganization = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RED² Photography Studio',
    url: 'https://red2studios.com',
    logo: 'https://red2studios.com/logo.png',
    description: 'Professional photography studio specializing in portraits, commercial photography, and studio services.',
    sameAs: [
      'https://www.instagram.com/red2studios',
      'https://www.facebook.com/red2studios',
      'https://www.linkedin.com/company/red2studios',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'contact@red2studios.com',
    },
  };

  if (type === 'Organization') {
    return baseOrganization;
  }

  if (type === 'LocalBusiness') {
    return {
      ...baseOrganization,
      '@type': 'LocalBusiness',
      address: {
        '@type': 'PostalAddress',
        streetAddress: data?.address || '',
        addressLocality: data?.city || '',
        addressRegion: data?.state || '',
        postalCode: data?.zip || '',
        addressCountry: 'US',
      },
      telephone: data?.phone || '',
      priceRange: data?.priceRange || '$$',
      openingHoursSpecification: data?.hours || [],
    };
  }

  if (type === 'Service') {
    return {
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: data?.name || 'Photography Services',
      description: data?.description || '',
      provider: baseOrganization,
      areaServed: data?.areaServed || 'US',
      priceRange: data?.priceRange || '$$',
    };
  }

  if (type === 'BlogPosting') {
    return {
      '@context': 'https://schema.org',
      '@type': 'BlogPosting',
      headline: data?.title || '',
      description: data?.excerpt || '',
      image: data?.image || '',
      datePublished: data?.publishedDate || new Date().toISOString(),
      dateModified: data?.modifiedDate || new Date().toISOString(),
      author: {
        '@type': 'Person',
        name: data?.author || 'RED² Studios',
      },
      publisher: baseOrganization,
    };
  }

  return baseOrganization;
}

/**
 * Update document head with SEO metadata
 */
export function updateSEOMetadata(metadata: SEOMetadata) {
  if (typeof document === 'undefined') return;

  // Title
  document.title = metadata.title;

  // Meta tags
  const updateOrCreateMeta = (name: string, content: string, isProperty = false) => {
    const attr = isProperty ? 'property' : 'name';
    let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute(attr, name);
      document.head.appendChild(meta);
    }
    meta.content = content;
  };

  updateOrCreateMeta('description', metadata.description);
  updateOrCreateMeta('keywords', metadata.keywords.join(', '));
  updateOrCreateMeta('author', metadata.author || DEFAULT_SEO.author!);
  updateOrCreateMeta('robots', metadata.robots || DEFAULT_SEO.robots!);

  // Open Graph
  updateOrCreateMeta('og:title', metadata.title, true);
  updateOrCreateMeta('og:description', metadata.description, true);
  updateOrCreateMeta('og:type', metadata.ogType || 'website', true);
  if (metadata.ogImage) {
    updateOrCreateMeta('og:image', metadata.ogImage, true);
  }

  // Twitter Card
  updateOrCreateMeta('twitter:card', 'summary_large_image');
  updateOrCreateMeta('twitter:title', metadata.title);
  updateOrCreateMeta('twitter:description', metadata.description);
  if (metadata.ogImage) {
    updateOrCreateMeta('twitter:image', metadata.ogImage);
  }

  // Canonical URL
  if (metadata.canonicalUrl) {
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = metadata.canonicalUrl;
  }
}

/**
 * Inject structured data into page
 */
export function injectStructuredData(data: any) {
  if (typeof document === 'undefined') return;

  let script = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
  if (!script) {
    script = document.createElement('script');
    script.type = 'application/ld+json';
    document.head.appendChild(script);
  }
  script.textContent = JSON.stringify(data);
}
