/**
 * Open Graph Meta Tags
 * Implements OG tags for social media sharing and SEO
 */

export interface OGConfig {
  title: string;
  description: string;
  image: string;
  url: string;
  type?: string;
  locale?: string;
  siteName?: string;
  twitterHandle?: string;
  twitterCardType?: string;
}

/**
 * Set Open Graph meta tags
 */
export function setOpenGraphTags(config: OGConfig): void {
  if (typeof document === 'undefined') return;

  const tags = [
    { property: 'og:title', content: config.title },
    { property: 'og:description', content: config.description },
    { property: 'og:image', content: config.image },
    { property: 'og:url', content: config.url },
    { property: 'og:type', content: config.type || 'website' },
    { property: 'og:locale', content: config.locale || 'en_US' },
    { property: 'og:site_name', content: config.siteName || 'RED² Photography Studio' },
    // Twitter Card tags
    { name: 'twitter:card', content: config.twitterCardType || 'summary_large_image' },
    { name: 'twitter:title', content: config.title },
    { name: 'twitter:description', content: config.description },
    { name: 'twitter:image', content: config.image },
    ...(config.twitterHandle ? [{ name: 'twitter:creator', content: config.twitterHandle }] : []),
  ];

  tags.forEach((tag) => {
    let meta = document.querySelector(`meta[${tag.property ? 'property' : 'name'}="${tag.property || tag.name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      if (tag.property) {
        meta.setAttribute('property', tag.property);
      } else if (tag.name) {
        meta.setAttribute('name', tag.name);
      }
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', tag.content);
  });
}

/**
 * Set canonical URL
 */
export function setCanonicalURL(url: string): void {
  if (typeof document === 'undefined') return;

  let canonical = document.querySelector('link[rel="canonical"]');
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  canonical.setAttribute('href', url);
}

/**
 * Set alternate language links
 */
export function setAlternateLanguages(languages: Record<string, string>): void {
  if (typeof document === 'undefined') return;

  // Remove existing alternate links
  document.querySelectorAll('link[rel="alternate"]').forEach((link) => link.remove());

  // Add new alternate links
  Object.entries(languages).forEach(([lang, url]) => {
    const link = document.createElement('link');
    link.rel = 'alternate';
    link.hrefLang = lang;
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Set meta description
 */
export function setMetaDescription(description: string): void {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector('meta[name="description"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'description';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', description);
}

/**
 * Set meta keywords
 */
export function setMetaKeywords(keywords: string[]): void {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector('meta[name="keywords"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'keywords';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', keywords.join(', '));
}

/**
 * Set viewport meta tag for mobile responsiveness
 */
export function setViewportMeta(): void {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector('meta[name="viewport"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'viewport';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', 'width=device-width, initial-scale=1, maximum-scale=5, user-scalable=yes');
}

/**
 * Set theme color meta tag
 */
export function setThemeColor(color: string): void {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', color);
}

/**
 * Set robots meta tag
 */
export function setRobotsMeta(robots: string): void {
  if (typeof document === 'undefined') return;

  let meta = document.querySelector('meta[name="robots"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'robots';
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', robots);
}

/**
 * Comprehensive page SEO setup
 */
export function setupPageSEO(config: OGConfig & { keywords?: string[]; robots?: string }): void {
  setOpenGraphTags(config);
  setCanonicalURL(config.url);
  setMetaDescription(config.description);
  if (config.keywords) setMetaKeywords(config.keywords);
  if (config.robots) setRobotsMeta(config.robots);
  setViewportMeta();
  setThemeColor('#860f0f');
}
