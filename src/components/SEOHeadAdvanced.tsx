/**
 * Advanced SEO Head Component - Next-Gen Aggressive SEO Optimization
 * Implements cutting-edge techniques for maximum search engine and AI ranking
 */

import { useEffect } from 'react';

interface SEOHeadAdvancedProps {
  title: string;
  description: string;
  image?: string;
  canonical?: string;
  schema?: any;
  keywords?: string[];
  author?: string;
  datePublished?: string;
  dateModified?: string;
  ogType?: string;
  twitterCard?: string;
  isArticle?: boolean;
  articleSection?: string;
  wordCount?: number;
  readingTime?: number;
  breadcrumbs?: Array<{ name: string; url: string }>;
  rating?: number;
  ratingCount?: number;
  price?: string;
  priceCurrency?: string;
  availability?: string;
  locale?: string;
  alternateLocales?: string[];
}

export default function SEOHeadAdvanced({
  title,
  description,
  image,
  canonical,
  schema,
  keywords = [],
  author,
  datePublished,
  dateModified,
  ogType = 'website',
  twitterCard = 'summary_large_image',
  isArticle = false,
  articleSection,
  wordCount,
  readingTime,
  breadcrumbs,
  rating,
  ratingCount,
  price,
  priceCurrency,
  availability,
  locale = 'en_US',
  alternateLocales = [],
}: SEOHeadAdvancedProps) {
  useEffect(() => {
    // Set title
    document.title = title;

    // Helper function to set meta tags
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

    // Helper function to set link tags
    const setLinkTag = (rel: string, href: string, hreflang?: string) => {
      let element = document.querySelector(
        hreflang ? `link[rel="${rel}"][hreflang="${hreflang}"]` : `link[rel="${rel}"]`
      ) as HTMLLinkElement;

      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        if (hreflang) {
          element.setAttribute('hreflang', hreflang);
        }
        document.head.appendChild(element);
      }
      element.href = href;
    };

    // 1. CORE META TAGS
    setMetaTag('description', description);
    if (keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '));
    }

    // 2. OPEN GRAPH TAGS (Social signals + AI crawlers)
    setMetaTag('og:type', ogType, true);
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:locale', locale, true);
    
    if (image) {
      setMetaTag('og:image', image, true);
      setMetaTag('og:image:width', '1200', true);
      setMetaTag('og:image:height', '630', true);
      setMetaTag('og:image:type', 'image/png', true);
    }

    // 3. TWITTER CARD TAGS
    setMetaTag('twitter:card', twitterCard);
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    if (image) {
      setMetaTag('twitter:image', image);
    }

    // 4. AUTHOR & PUBLICATION METADATA
    if (author) {
      setMetaTag('author', author);
      setMetaTag('article:author', author, true);
    }
    if (datePublished) {
      setMetaTag('article:published_time', datePublished, true);
    }
    if (dateModified) {
      setMetaTag('article:modified_time', dateModified, true);
    }

    // 5. ARTICLE-SPECIFIC METADATA
    if (isArticle) {
      if (articleSection) {
        setMetaTag('article:section', articleSection, true);
      }
      if (wordCount) {
        setMetaTag('word-count', wordCount.toString());
      }
      if (readingTime) {
        setMetaTag('reading-time', `${readingTime} min`);
      }
    }

    // 6. RATING & REVIEW METADATA
    if (rating) {
      setMetaTag('rating', rating.toString());
    }
    if (ratingCount) {
      setMetaTag('ratingCount', ratingCount.toString());
    }

    // 7. PRODUCT/PRICING METADATA
    if (price) {
      setMetaTag('price', price);
      setMetaTag('priceCurrency', priceCurrency || 'USD');
      setMetaTag('availability', availability || 'InStock');
    }

    // 8. AI-SPECIFIC META TAGS
    setMetaTag('ai-content-description', description);
    if (keywords.length > 0) {
      setMetaTag('ai-content-keywords', keywords.join(', '));
    }
    setMetaTag('ai-content-type', ogType);

    // 9. ROBOTS DIRECTIVES
    setMetaTag('robots', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('googlebot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');
    setMetaTag('bingbot', 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1');

    // 10. CANONICAL URL
    if (canonical) {
      setLinkTag('canonical', canonical);
    }

    // 11. ALTERNATE LANGUAGE LINKS
    if (alternateLocales.length > 0) {
      alternateLocales.forEach(altLocale => {
        setLinkTag('alternate', canonical || window.location.href, altLocale);
      });
    }

    // 12. INJECT SCHEMA
    if (schema || breadcrumbs) {
      // Remove existing schema
      const existingSchema = document.querySelector('script[type="application/ld+json"][data-seo-head="true"]');
      if (existingSchema) {
        existingSchema.remove();
      }

      // Create schema array
      const schemas = [];
      
      if (schema) {
        schemas.push(schema);
      }

      if (breadcrumbs && breadcrumbs.length > 0) {
        schemas.push({
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: breadcrumbs.map((crumb, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: crumb.name,
            item: crumb.url,
          })),
        });
      }

      // Inject schema
      if (schemas.length > 0) {
        const schemaScript = document.createElement('script');
        schemaScript.type = 'application/ld+json';
        schemaScript.setAttribute('data-seo-head', 'true');
        
        if (schemas.length === 1) {
          schemaScript.textContent = JSON.stringify(schemas[0]);
        } else {
          schemaScript.textContent = JSON.stringify({
            '@context': 'https://schema.org',
            '@graph': schemas,
          });
        }
        
        document.head.appendChild(schemaScript);
      }
    }
  }, [
    title,
    description,
    image,
    canonical,
    schema,
    keywords,
    author,
    datePublished,
    dateModified,
    ogType,
    twitterCard,
    isArticle,
    articleSection,
    wordCount,
    readingTime,
    breadcrumbs,
    rating,
    ratingCount,
    price,
    priceCurrency,
    availability,
    locale,
    alternateLocales,
  ]);

  return null;
}
