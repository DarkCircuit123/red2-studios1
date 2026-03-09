/**
 * Schema.org Structured Data Markup
 * Implements JSON-LD for SEO and rich snippets
 */

export interface SchemaMarkup {
  '@context': string;
  '@type': string;
  [key: string]: any;
}

/**
 * Organization Schema
 */
export function getOrganizationSchema(): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'RED² Photography Studio',
    url: 'https://red2studios.com',
    logo: 'https://red2studios.com/logo.png',
    description: 'Professional photography studio specializing in portraits, commercial photography, and studio services.',
    image: 'https://red2studios.com/hero.jpg',
    sameAs: [
      'https://www.instagram.com/red2studios',
      'https://www.facebook.com/red2studios',
      'https://www.linkedin.com/company/red2studios',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Service',
      email: 'contact@red2studios.com',
      telephone: '+1-555-0123',
      areaServed: 'US',
      availableLanguage: 'en',
    },
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Studio Lane',
      addressLocality: 'New York',
      addressRegion: 'NY',
      postalCode: '10001',
      addressCountry: 'US',
    },
  };
}

/**
 * LocalBusiness Schema
 */
export function getLocalBusinessSchema(): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: 'RED² Photography Studio',
    image: 'https://red2studios.com/hero.jpg',
    description: 'Professional photography studio offering portrait, commercial, and event photography services.',
    address: {
      '@type': 'PostalAddress',
      streetAddress: '123 Studio Lane',
      addressLocality: 'New York',
      addressRegion: 'NY',
      postalCode: '10001',
      addressCountry: 'US',
    },
    telephone: '+1-555-0123',
    url: 'https://red2studios.com',
    priceRange: '$$',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00',
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday'],
        opens: '10:00',
        closes: '16:00',
      },
    ],
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.8',
      reviewCount: '156',
    },
  };
}

/**
 * Service Schema
 */
export function getServiceSchema(serviceName: string, description: string, price?: string): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: serviceName,
    description: description,
    provider: {
      '@type': 'Organization',
      name: 'RED² Photography Studio',
      url: 'https://red2studios.com',
    },
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price,
        priceCurrency: 'USD',
      },
    }),
  };
}

/**
 * CreativeWork Schema for Portfolio Items
 */
export function getCreativeWorkSchema(
  title: string,
  description: string,
  imageUrl: string,
  datePublished: string
): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description: description,
    image: imageUrl,
    datePublished: datePublished,
    author: {
      '@type': 'Organization',
      name: 'RED² Photography Studio',
    },
    inLanguage: 'en',
  };
}

/**
 * BreadcrumbList Schema
 */
export function getBreadcrumbSchema(items: Array<{ name: string; url: string }>): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * FAQPage Schema
 */
export function getFAQSchema(faqs: Array<{ question: string; answer: string }>): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Event Schema
 */
export function getEventSchema(
  name: string,
  description: string,
  startDate: string,
  endDate: string,
  location: string
): SchemaMarkup {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: name,
    description: description,
    startDate: startDate,
    endDate: endDate,
    location: {
      '@type': 'Place',
      name: location,
    },
    organizer: {
      '@type': 'Organization',
      name: 'RED² Photography Studio',
      url: 'https://red2studios.com',
    },
  };
}

/**
 * Inject schema markup into document head
 */
export function injectSchema(schema: SchemaMarkup, id?: string): void {
  if (typeof document === 'undefined') return;

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  if (id) script.id = id;
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

/**
 * Remove schema markup by ID
 */
export function removeSchema(id: string): void {
  if (typeof document === 'undefined') return;
  const script = document.getElementById(id);
  if (script) script.remove();
}

/**
 * Update schema markup
 */
export function updateSchema(schema: SchemaMarkup, id: string): void {
  removeSchema(id);
  injectSchema(schema, id);
}
