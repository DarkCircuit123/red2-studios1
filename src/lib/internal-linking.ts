/**
 * Internal Linking Strategy
 * Optimizes internal links for SEO and user navigation
 */

export interface InternalLink {
  text: string;
  href: string;
  title?: string;
  rel?: string;
  context?: string;
}

/**
 * Generate contextual internal links
 */
export function generateContextualLinks(currentPage: string): InternalLink[] {
  const linkMap: Record<string, InternalLink[]> = {
    home: [
      { text: 'Portfolio', href: '/portfolio', title: 'View our photography portfolio' },
      { text: 'Services', href: '/#services', title: 'Explore our services' },
      { text: 'Booking', href: '/booking', title: 'Book a session' },
      { text: 'Galleries', href: '/galleries', title: 'Client galleries' },
      { text: 'Blog', href: '/blog', title: 'Photography tips and insights' },
    ],
    portfolio: [
      { text: 'Home', href: '/', title: 'Back to home' },
      { text: 'Services', href: '/#services', title: 'Our services' },
      { text: 'Booking', href: '/booking', title: 'Book a session' },
      { text: 'Blog', href: '/blog', title: 'Photography insights' },
    ],
    booking: [
      { text: 'Home', href: '/', title: 'Back to home' },
      { text: 'Portfolio', href: '/portfolio', title: 'View our work' },
      { text: 'Services', href: '/#services', title: 'Service details' },
      { text: 'Galleries', href: '/galleries', title: 'Client galleries' },
    ],
    galleries: [
      { text: 'Home', href: '/', title: 'Back to home' },
      { text: 'Portfolio', href: '/portfolio', title: 'View portfolio' },
      { text: 'Booking', href: '/booking', title: 'Book now' },
    ],
    blog: [
      { text: 'Home', href: '/', title: 'Back to home' },
      { text: 'Portfolio', href: '/portfolio', title: 'View portfolio' },
      { text: 'Services', href: '/#services', title: 'Our services' },
    ],
  };

  return linkMap[currentPage] || [];
}

/**
 * Create breadcrumb navigation
 */
export function createBreadcrumbs(
  path: string
): Array<{ text: string; url: string }> {
  const segments = path.split('/').filter(Boolean);
  const breadcrumbs = [{ text: 'Home', url: '/' }];

  let currentPath = '';
  segments.forEach((segment) => {
    currentPath += `/${segment}`;
    const text = segment.charAt(0).toUpperCase() + segment.slice(1);
    breadcrumbs.push({ text, url: currentPath });
  });

  return breadcrumbs;
}

/**
 * Inject breadcrumb schema
 */
export function injectBreadcrumbSchema(breadcrumbs: Array<{ text: string; url: string }>): void {
  if (typeof document === 'undefined') return;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.text,
      item: `https://red2studios.com${crumb.url}`,
    })),
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

/**
 * Optimize anchor text for SEO
 */
export function optimizeAnchorText(links: HTMLAnchorElement[]): void {
  links.forEach((link) => {
    const text = link.textContent?.trim();
    const href = link.getAttribute('href');

    // Avoid generic anchor text
    const genericTexts = ['click here', 'read more', 'link', 'here', 'more'];
    if (text && genericTexts.includes(text.toLowerCase())) {
      console.warn(`Generic anchor text detected: "${text}" on link ${href}`);
    }

    // Ensure descriptive title attribute
    if (!link.getAttribute('title') && href) {
      link.setAttribute('title', text || href);
    }
  });
}

/**
 * Add rel attributes for internal links
 */
export function addRelAttributes(links: HTMLAnchorElement[]): void {
  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) return;

    // External links
    if (href.startsWith('http') && !href.includes(window.location.hostname)) {
      link.setAttribute('rel', 'noopener noreferrer');
      link.setAttribute('target', '_blank');
    }

    // Internal links - ensure no rel="nofollow" unless intentional
    if (href.startsWith('/') || href.startsWith('#')) {
      const currentRel = link.getAttribute('rel') || '';
      if (!currentRel.includes('nofollow')) {
        link.setAttribute('rel', 'internal');
      }
    }
  });
}

/**
 * Create related posts/items links
 */
export function createRelatedLinks(
  currentItem: { id: string; category: string; tags: string[] },
  allItems: Array<{ id: string; title: string; category: string; tags: string[] }>,
  limit: number = 3
): InternalLink[] {
  // Filter items with matching category or tags
  const related = allItems
    .filter((item) => item.id !== currentItem.id)
    .filter(
      (item) =>
        item.category === currentItem.category ||
        item.tags.some((tag) => currentItem.tags.includes(tag))
    )
    .slice(0, limit);

  return related.map((item) => ({
    text: item.title,
    href: `/portfolio/${item.id}`,
    title: `View ${item.title}`,
  }));
}

/**
 * Setup internal link tracking
 */
export function setupInternalLinkTracking(): void {
  if (typeof window === 'undefined') return;

  document.addEventListener('click', (e) => {
    const link = (e.target as HTMLElement).closest('a');
    if (!link) return;

    const href = link.getAttribute('href');
    if (href && (href.startsWith('/') || href.startsWith('#'))) {
      // Track internal link click
      if (window.gtag) {
        window.gtag('event', 'internal_link_click', {
          link_url: href,
          link_text: link.textContent,
        });
      }
    }
  });
}

/**
 * Validate internal links
 */
export function validateInternalLinks(): {
  total: number;
  valid: number;
  broken: string[];
  issues: string[];
} {
  const links = Array.from(document.querySelectorAll('a[href^="/"], a[href^="#"]'));
  const broken: string[] = [];
  const issues: string[] = [];

  links.forEach((link) => {
    const href = link.getAttribute('href');
    if (!href) {
      issues.push('Link missing href attribute');
      return;
    }

    // Check for empty anchor links
    if (href === '#') {
      issues.push('Empty anchor link detected');
      return;
    }

    // Check if anchor target exists
    if (href.startsWith('#')) {
      const target = document.querySelector(href);
      if (!target) {
        broken.push(href);
      }
    }

    // Check anchor text
    const text = link.textContent?.trim();
    if (!text || text.length === 0) {
      issues.push(`Link without text: ${href}`);
    }
  });

  return {
    total: links.length,
    valid: links.length - broken.length - issues.length,
    broken,
    issues,
  };
}

/**
 * Generate sitemap links
 */
export function generateSitemapLinks(): InternalLink[] {
  return [
    { text: 'Home', href: '/', title: 'Home' },
    { text: 'Portfolio', href: '/portfolio', title: 'Portfolio' },
    { text: 'Services', href: '/#services', title: 'Services' },
    { text: 'Booking', href: '/booking', title: 'Booking' },
    { text: 'Galleries', href: '/galleries', title: 'Client Galleries' },
    { text: 'Blog', href: '/blog', title: 'Blog' },
    { text: 'Contact', href: '/#contact', title: 'Contact' },
  ];
}

/**
 * Initialize internal linking optimizations
 */
export function initializeInternalLinking(): void {
  if (typeof document === 'undefined') return;

  const links = Array.from(document.querySelectorAll('a'));
  optimizeAnchorText(links);
  addRelAttributes(links);
  setupInternalLinkTracking();

  const validation = validateInternalLinks();
}
