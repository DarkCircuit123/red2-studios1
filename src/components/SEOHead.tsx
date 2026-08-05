import React, { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'video.other' | 'profile';
  noindex?: boolean;
  nofollow?: boolean;
  schema?: Record<string, any>;
  canonical?: string;
}

export default function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  noindex = false,
  nofollow = false,
  schema,
  canonical,
}: SEOHeadProps) {
  const siteUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  
  let robotsContent = '';
  if (noindex) robotsContent += 'noindex';
  if (nofollow) robotsContent += (robotsContent ? ', ' : '') + 'nofollow';

  useEffect(() => {
    // Update document title
    document.title = title;

    // Helper function to set or update meta tag
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

    // Helper function to set or update link tag
    const setLinkTag = (rel: string, href: string) => {
      let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;
      
      if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
      }
      element.href = href;
    };

    // Set basic meta tags
    setMetaTag('description', description || '');
    if (robotsContent) {
      setMetaTag('robots', robotsContent);
    }
    if (canonical) {
      setLinkTag('canonical', canonical);
    }

    // Set Open Graph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:type', type, true);
    if (description) {
      setMetaTag('og:description', description, true);
    }
    if (image) {
      setMetaTag('og:image', image, true);
    }
    if (siteUrl) {
      setMetaTag('og:url', siteUrl, true);
    }

    // Set Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    if (description) {
      setMetaTag('twitter:description', description);
    }
    if (image) {
      setMetaTag('twitter:image', image);
    }

    // Set JSON-LD Schema
    if (schema) {
      let scriptElement = document.querySelector('script[type="application/ld+json"]') as HTMLScriptElement;
      if (!scriptElement) {
        scriptElement = document.createElement('script');
        scriptElement.type = 'application/ld+json';
        document.head.appendChild(scriptElement);
      }
      scriptElement.textContent = JSON.stringify(schema);
    }
  }, [title, description, image, url, type, noindex, nofollow, schema, canonical, siteUrl, robotsContent]);

  // This component doesn't render anything visible
  return null;
}
