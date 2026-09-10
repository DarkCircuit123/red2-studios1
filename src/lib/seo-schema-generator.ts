/**
 * SEO Schema Generator - Creates JSON-LD structured data for AI and search engines
 * Supports: Organization, LocalBusiness, Person, Portfolio, Services, BreadcrumbList
 */

export interface SchemaOptions {
  type: 'Organization' | 'LocalBusiness' | 'Person' | 'CreativeWork' | 'BreadcrumbList' | 'Service' | 'ImageObject';
  [key: string]: any;
}

/**
 * Generate Organization schema for the main site
 */
export const generateOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  '@id': 'https://red2studios.com/#organization',
  name: 'RED² Studios',
  alternateName: 'RED2 Studios',
  url: 'https://red2studios.com',
  logo: 'https://red2studios.com/logo.png',
  description: 'Fashion, editorial, and campaign photography by Jordan Michael Zuniga. 25 years of experience, 500+ projects. Fully mobile across the US.',
  sameAs: [
    'https://instagram.com/red2studios',
    'https://linkedin.com/company/red2-studios',
    'https://facebook.com/red2studios',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'Customer Service',
    email: 'contact@red2studios.com',
    telephone: '+1-XXX-XXX-XXXX',
  },
  address: {
    '@type': 'PostalAddress',
    addressCountry: 'US',
    addressRegion: 'CA',
    addressLocality: 'Los Angeles',
  },
  areaServed: 'US',
  knowsAbout: [
    'Fashion Photography',
    'Editorial Photography',
    'Campaign Photography',
    'Portrait Photography',
    'Commercial Photography',
  ],
});

/**
 * Generate LocalBusiness schema
 */
export const generateLocalBusinessSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  '@id': 'https://red2studios.com/#localbusiness',
  name: 'RED² Studios',
  image: 'https://red2studios.com/logo.png',
  description: 'Professional photography studio in Los Angeles',
  url: 'https://red2studios.com',
  telephone: '+1-XXX-XXX-XXXX',
  email: 'contact@red2studios.com',
  address: {
    '@type': 'PostalAddress',
    streetAddress: 'Los Angeles',
    addressLocality: 'Los Angeles',
    addressRegion: 'CA',
    postalCode: '90001',
    addressCountry: 'US',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: '34.0522',
    longitude: '-118.2437',
  },
  priceRange: '$$$',
  openingHoursSpecification: {
    '@type': 'OpeningHoursSpecification',
    dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    opens: '09:00',
    closes: '18:00',
  },
});

/**
 * Generate Person schema for the photographer
 */
export const generatePersonSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': 'https://red2studios.com/#person',
  name: 'Jordan Michael Zuniga',
  url: 'https://red2studios.com',
  image: 'https://red2studios.com/jordan-photo.jpg',
  jobTitle: 'Fashion & Editorial Photographer',
  description: '25 years of professional photography experience with 500+ completed projects',
  worksFor: {
    '@type': 'Organization',
    name: 'RED² Studios',
  },
  knowsAbout: [
    'Fashion Photography',
    'Editorial Photography',
    'Campaign Photography',
    'Portrait Photography',
  ],
  sameAs: [
    'https://instagram.com/red2studios',
    'https://linkedin.com/in/jordanmichaelzuniga',
  ],
});

/**
 * Generate Portfolio/CreativeWork schema for individual projects
 */
export const generatePortfolioSchema = (project: {
  id: string;
  title: string;
  description: string;
  image: string;
  category?: string;
  date?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'CreativeWork',
  '@id': `https://red2studios.com/portfolio/${project.id}#work`,
  name: project.title,
  description: project.description,
  image: project.image,
  creator: {
    '@type': 'Person',
    name: 'Jordan Michael Zuniga',
  },
  datePublished: project.date || new Date().toISOString(),
  keywords: [project.category || 'Photography', 'Fashion', 'Editorial'].join(', '),
  genre: project.category || 'Photography',
});

/**
 * Generate Service schema
 */
export const generateServiceSchema = (service: {
  name: string;
  description: string;
  price?: string;
  priceCurrency?: string;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: service.name,
  description: service.description,
  provider: {
    '@type': 'Organization',
    name: 'RED² Studios',
  },
  ...(service.price && {
    offers: {
      '@type': 'Offer',
      price: service.price,
      priceCurrency: service.priceCurrency || 'USD',
    },
  }),
});

/**
 * Generate BreadcrumbList schema for navigation
 */
export const generateBreadcrumbSchema = (breadcrumbs: Array<{ name: string; url: string }>) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  itemListElement: breadcrumbs.map((crumb, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    name: crumb.name,
    item: crumb.url,
  })),
});

/**
 * Generate ImageObject schema for images
 */
export const generateImageSchema = (image: {
  url: string;
  name: string;
  description?: string;
  width?: number;
  height?: number;
}) => ({
  '@context': 'https://schema.org',
  '@type': 'ImageObject',
  url: image.url,
  name: image.name,
  description: image.description || image.name,
  ...(image.width && { width: image.width }),
  ...(image.height && { height: image.height }),
});

/**
 * Generate comprehensive site schema combining multiple types
 */
export const generateComprehensiveSiteSchema = () => ({
  '@context': 'https://schema.org',
  '@graph': [
    generateOrganizationSchema(),
    generateLocalBusinessSchema(),
    generatePersonSchema(),
  ],
});
