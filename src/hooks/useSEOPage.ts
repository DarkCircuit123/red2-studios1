/**
 * Page-specific SEO Hook
 * Manages SEO for individual pages with schema markup and OG tags
 */

import { useEffect } from 'react';
import { setupPageSEO, setCanonicalURL } from '@/lib/og-tags';
import { injectSchema, removeSchema, updateSchema, getCreativeWorkSchema, getBreadcrumbSchema } from '@/lib/schema-markup';

export interface PageSEOConfig {
  title: string;
  description: string;
  image: string;
  url: string;
  keywords?: string[];
  type?: string;
  breadcrumbs?: Array<{ name: string; url: string }>;
  schemaType?: 'article' | 'product' | 'event' | 'creativework';
  author?: string;
  publishDate?: string;
}

/**
 * Hook for page-specific SEO setup
 */
export function useSEOPage(config: PageSEOConfig): void {
  useEffect(() => {
    // Setup basic SEO
    setupPageSEO({
      title: config.title,
      description: config.description,
      image: config.image,
      url: config.url,
      keywords: config.keywords,
      type: config.type,
    });

    // Set canonical URL
    setCanonicalURL(config.url);

    // Setup breadcrumbs if provided
    if (config.breadcrumbs && config.breadcrumbs.length > 0) {
      const breadcrumbSchema = getBreadcrumbSchema(config.breadcrumbs);
      updateSchema(breadcrumbSchema, 'breadcrumb-schema');
    }

    // Setup schema based on type
    if (config.schemaType === 'creativework' && config.publishDate) {
      const schema = getCreativeWorkSchema(
        config.title,
        config.description,
        config.image,
        config.publishDate
      );
      updateSchema(schema, 'creativework-schema');
    }

    // Cleanup on unmount
    return () => {
      removeSchema('breadcrumb-schema');
      removeSchema('creativework-schema');
    };
  }, [config]);
}

/**
 * Hook for portfolio item SEO
 */
export function usePortfolioItemSEO(
  title: string,
  description: string,
  image: string,
  id: string,
  category?: string
): void {
  const url = `https://red2studios.com/portfolio/${id}`;
  const breadcrumbs = [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Portfolio', url: 'https://red2studios.com/portfolio' },
    { name: title, url },
  ];

  useSEOPage({
    title: `${title} | RED² Photography Studio`,
    description,
    image,
    url,
    keywords: [
      'photography',
      'portfolio',
      title,
      ...(category ? [category] : []),
    ],
    type: 'article',
    breadcrumbs,
    schemaType: 'creativework',
    publishDate: new Date().toISOString(),
  });
}

/**
 * Hook for service page SEO
 */
export function useServiceSEO(
  serviceName: string,
  description: string,
  image: string
): void {
  const url = `https://red2studios.com/services/${serviceName.toLowerCase().replace(/\s+/g, '-')}`;
  const breadcrumbs = [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Services', url: 'https://red2studios.com/#services' },
    { name: serviceName, url },
  ];

  useSEOPage({
    title: `${serviceName} | RED² Photography Studio`,
    description,
    image,
    url,
    keywords: ['photography', 'service', serviceName.toLowerCase()],
    type: 'service',
    breadcrumbs,
  });
}

/**
 * Hook for blog post SEO
 */
export function useBlogPostSEO(
  title: string,
  excerpt: string,
  image: string,
  slug: string,
  publishDate: string,
  author?: string
): void {
  const url = `https://red2studios.com/blog/${slug}`;
  const breadcrumbs = [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Blog', url: 'https://red2studios.com/blog' },
    { name: title, url },
  ];

  useSEOPage({
    title: `${title} | RED² Photography Blog`,
    description: excerpt,
    image,
    url,
    keywords: ['blog', 'photography', 'tips', 'insights'],
    type: 'article',
    breadcrumbs,
    schemaType: 'article',
    author,
    publishDate,
  });
}

/**
 * Hook for gallery page SEO
 */
export function useGallerySEO(
  galleryName: string,
  description: string,
  image: string,
  clientName?: string
): void {
  const url = `https://red2studios.com/galleries/${galleryName.toLowerCase().replace(/\s+/g, '-')}`;
  const breadcrumbs = [
    { name: 'Home', url: 'https://red2studios.com' },
    { name: 'Galleries', url: 'https://red2studios.com/galleries' },
    { name: galleryName, url },
  ];

  useSEOPage({
    title: `${galleryName} Gallery | RED² Photography Studio`,
    description,
    image,
    url,
    keywords: ['gallery', 'photography', 'client work', clientName || ''].filter(Boolean),
    type: 'article',
    breadcrumbs,
  });
}
