/**
 * SEO Hook
 * Manages SEO metadata and structured data for pages
 */

import { useEffect } from 'react';
import { updateSEOMetadata, injectStructuredData, PAGE_SEO, DEFAULT_SEO, SEOMetadata } from '@/lib/seo-metadata';

export function useSEO(pageKey?: keyof typeof PAGE_SEO, customMetadata?: Partial<SEOMetadata>) {
  useEffect(() => {
    // Get page metadata
    const pageMetadata = pageKey && PAGE_SEO[pageKey] ? PAGE_SEO[pageKey] : DEFAULT_SEO;
    
    // Merge with custom metadata
    const finalMetadata = {
      ...pageMetadata,
      ...customMetadata,
    };

    // Update document head
    updateSEOMetadata(finalMetadata);

    // Inject structured data
    const structuredData = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: finalMetadata.title,
      description: finalMetadata.description,
      url: typeof window !== 'undefined' ? window.location.href : '',
    };

    injectStructuredData(structuredData);
  }, [pageKey, customMetadata]);
}

export default useSEO;
