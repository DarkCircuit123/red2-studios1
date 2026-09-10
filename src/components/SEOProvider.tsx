/**
 * SEO Provider - Global SEO optimization component
 * Injects comprehensive SEO meta tags, schema, and AI-optimized content
 */

import { useEffect } from 'react';
import { generateComprehensiveSiteSchema } from '@/lib/seo-schema-generator';

export default function SEOProvider() {
  useEffect(() => {
    // 1. Set global meta tags
    const setMetaTag = (name: string, content: string, isProperty = false) => {
      let element = document.querySelector(
        isProperty ? `meta[property="${name}"]` : `meta[name="${name}"]`
      ) as HTMLMetaElement;
      
      if (!element) {
        element = document.createElement('meta');
        if (isProperty) {
          element.setAttribute('property', name);
        } else {
          element.setAttribute('name', name);
        }
        document.head.appendChild(element);
      }
      element.content = content;
    };

    // 2. Core SEO meta tags
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0');
    setMetaTag('charset', 'utf-8');
    setMetaTag('language', 'English');
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    // 3. AI and search engine optimization
    setMetaTag('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('bingbot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    
    // 4. AI crawler optimization
    setMetaTag('ai-content-description', 'Professional fashion and editorial photography portfolio with 25+ years of experience');
    setMetaTag('ai-content-keywords', 'fashion photography, editorial photography, professional photographer, Los Angeles');
    
    // 5. Author and copyright
    setMetaTag('author', 'Jordan Michael Zuniga');
    setMetaTag('copyright', `© ${new Date().getFullYear()} RED² Studios. All rights reserved.`);
    
    // 6. Theme color for browser UI
    setMetaTag('theme-color', '#000000');
    
    // 7. Apple meta tags
    setMetaTag('apple-mobile-web-app-capable', 'yes');
    setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
    setMetaTag('apple-mobile-web-app-title', 'RED² Studios');
    
    // 8. Verification tags (add your actual verification codes)
    setMetaTag('google-site-verification', 'YOUR_GOOGLE_VERIFICATION_CODE');
    setMetaTag('msvalidate.01', 'YOUR_BING_VERIFICATION_CODE');
    
    // 9. Canonical URL
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.href = href;
    };
    
    setLinkTag('canonical', window.location.href);
    
    // 10. Alternate language links (if applicable)
    setLinkTag('alternate', window.location.href);
    
    // 11. Preconnect to external domains for performance
    const preconnectDomains = [
      'https://fonts.googleapis.com',
      'https://fonts.gstatic.com',
      'https://cdn.jsdelivr.net',
    ];
    
    preconnectDomains.forEach(domain => {
      let link = document.querySelector(`link[rel="preconnect"][href="${domain}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'preconnect');
        link.setAttribute('href', domain);
        link.setAttribute('crossorigin', 'anonymous');
        document.head.appendChild(link);
      }
    });
    
    // 12. DNS prefetch for external resources
    const dnsPrefetchDomains = [
      'https://www.google-analytics.com',
      'https://www.googletagmanager.com',
    ];
    
    dnsPrefetchDomains.forEach(domain => {
      let link = document.querySelector(`link[rel="dns-prefetch"][href="${domain}"]`);
      if (!link) {
        link = document.createElement('link');
        link.setAttribute('rel', 'dns-prefetch');
        link.setAttribute('href', domain);
        document.head.appendChild(link);
      }
    });
    
    // 13. Inject comprehensive JSON-LD schema
    const injectSchema = () => {
      const schemaScript = document.querySelector('script[type="application/ld+json"][data-seo-provider="true"]');
      if (!schemaScript) {
        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.setAttribute('data-seo-provider', 'true');
        script.textContent = JSON.stringify(generateComprehensiveSiteSchema());
        document.head.appendChild(script);
      }
    };
    
    injectSchema();
    
    // 14. Add structured data for breadcrumbs if on non-home page
    const addBreadcrumbSchema = () => {
      const path = window.location.pathname;
      if (path !== '/') {
        const breadcrumbs = [
          { name: 'Home', url: 'https://red2studios.com' },
          { name: path.split('/')[1].charAt(0).toUpperCase() + path.split('/')[1].slice(1), url: `https://red2studios.com${path}` },
        ];
        
        const breadcrumbScript = document.querySelector('script[type="application/ld+json"][data-breadcrumb="true"]');
        if (!breadcrumbScript) {
          const script = document.createElement('script');
          script.type = 'application/ld+json';
          script.setAttribute('data-breadcrumb', 'true');
          script.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: breadcrumbs.map((crumb, index) => ({
              '@type': 'ListItem',
              position: index + 1,
              name: crumb.name,
              item: crumb.url,
            })),
          });
          document.head.appendChild(script);
        }
      }
    };
    
    addBreadcrumbSchema();
    
  }, []);

  // This component doesn't render anything visible
  return null;
}
