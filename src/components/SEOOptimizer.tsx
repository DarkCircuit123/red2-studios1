/**
 * SEO Optimizer Component
 * Initializes all SEO optimizations on app load
 */

import { useEffect } from 'react';
import { initializeSEOPerformance } from '@/lib/performance-seo';
import { generateSitemap, STATIC_ROUTES } from '@/lib/sitemap-generator';

export function SEOOptimizer() {
  useEffect(() => {
    // Initialize performance optimizations
    initializeSEOPerformance();

    // Generate and log sitemap (for reference)
    const sitemap = generateSitemap(STATIC_ROUTES);
    console.log('Sitemap generated:', sitemap.length, 'bytes');

    // Add structured data for organization
    const organizationSchema = {
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

    // Inject organization schema if not already present
    const existingScript = document.querySelector('script[type="application/ld+json"]');
    if (!existingScript) {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(organizationSchema);
      document.head.appendChild(script);
    }
  }, []);

  return null;
}

export default SEOOptimizer;
