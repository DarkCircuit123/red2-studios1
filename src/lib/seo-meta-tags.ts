/**
 * SEO Meta Tags Utility
 * Provides helper functions for adding meta tags to pages
 */

export interface MetaTagConfig {
  title?: string;
  description?: string;
  noindex?: boolean;
  nofollow?: boolean;
  robots?: string;
}

/**
 * Generate robots meta tag value
 */
export function generateRobotsMetaTag(config: MetaTagConfig): string {
  const directives: string[] = [];

  if (config.noindex) directives.push('noindex');
  else directives.push('index');

  if (config.nofollow) directives.push('nofollow');
  else directives.push('follow');

  return directives.join(', ');
}

/**
 * Create meta tags for a page
 */
export function createMetaTags(config: MetaTagConfig): Record<string, string> {
  const tags: Record<string, string> = {};

  if (config.title) {
    tags['title'] = config.title;
  }

  if (config.description) {
    tags['description'] = config.description;
  }

  if (config.noindex || config.nofollow || config.robots) {
    tags['robots'] = config.robots || generateRobotsMetaTag(config);
  }

  return tags;
}

/**
 * Add noindex/nofollow meta tags to prevent indexing
 */
export function addNoindexMetaTags(): void {
  if (typeof document === 'undefined') return;

  const meta = document.createElement('meta');
  meta.name = 'robots';
  meta.content = 'noindex, nofollow';
  document.head.appendChild(meta);
}
