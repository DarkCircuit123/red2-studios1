import { useEffect } from 'react';
import { initializeSEOPerformance } from '@/lib/performance-seo';
import { generateSitemap, STATIC_ROUTES } from '@/lib/sitemap-generator';
import { injectSchema, getOrganizationSchema, getLocalBusinessSchema } from '@/lib/schema-markup';
import { setupPageSEO } from '@/lib/og-tags';
import { setupSemanticStructure } from '@/lib/semantic-html';
import { initializeImageOptimizations } from '@/lib/image-optimization';
import { initializeGPUAnimations } from '@/lib/gpu-animations';
import { initializeInternalLinking } from '@/lib/internal-linking';
import { SecurityHeadersManager } from '@/lib/security-enhanced';

export function SEOOptimizer() {
  useEffect(() => {
    initializeSEOPerformance();
    initializeImageOptimizations();
    initializeGPUAnimations();
    initializeInternalLinking();
    setupSemanticStructure();
    SecurityHeadersManager.applyHeaders();
    // CSP is now defined in src/components/Head.tsx as the single source of truth

    const sitemap = generateSitemap(STATIC_ROUTES);

    injectSchema(getOrganizationSchema(), 'org-schema');
    injectSchema(getLocalBusinessSchema(), 'local-business-schema');

    setupPageSEO({
      title: 'RED² Photography Studio - Professional Photography Services',
      description: 'Professional photography studio specializing in portraits, commercial photography, and studio services. Book your session today.',
      image: 'https://red2studios.com/hero.jpg',
      url: 'https://red2studios.com',
      keywords: [
        'photography studio',
        'professional photography',
        'portrait photography',
        'commercial photography',
        'studio photography',
        'RED² Studios',
      ],
      robots: 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1',
      twitterHandle: '@red2studios',
    });
  }, []);

  return null;
}

export default SEOOptimizer;
