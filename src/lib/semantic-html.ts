/**
 * Semantic HTML5 Utilities
 * Helpers for semantic markup and accessibility
 */

/**
 * Generate semantic heading hierarchy
 */
export function createSemanticHeading(
  level: 1 | 2 | 3 | 4 | 5 | 6,
  text: string,
  className?: string,
  id?: string
): HTMLHeadingElement {
  const heading = document.createElement(`h${level}`);
  heading.textContent = text;
  if (className) heading.className = className;
  if (id) heading.id = id;
  return heading;
}

/**
 * Create semantic article element
 */
export function createSemanticArticle(
  title: string,
  content: string,
  author?: string,
  publishDate?: string,
  className?: string
): HTMLArticleElement {
  const article = document.createElement('article');
  if (className) article.className = className;

  const heading = document.createElement('h2');
  heading.textContent = title;
  article.appendChild(heading);

  if (publishDate) {
    const time = document.createElement('time');
    time.dateTime = publishDate;
    time.textContent = new Date(publishDate).toLocaleDateString();
    article.appendChild(time);
  }

  if (author) {
    const byline = document.createElement('p');
    byline.className = 'byline';
    byline.textContent = `By ${author}`;
    article.appendChild(byline);
  }

  const contentDiv = document.createElement('div');
  contentDiv.innerHTML = content;
  article.appendChild(contentDiv);

  return article;
}

/**
 * Create semantic section with heading
 */
export function createSemanticSection(
  title: string,
  headingLevel: 1 | 2 | 3 | 4 | 5 | 6,
  className?: string,
  id?: string
): HTMLSectionElement {
  const section = document.createElement('section');
  if (className) section.className = className;
  if (id) section.id = id;

  const heading = document.createElement(`h${headingLevel}`);
  heading.textContent = title;
  section.appendChild(heading);

  return section;
}

/**
 * Create semantic navigation
 */
export function createSemanticNav(
  links: Array<{ text: string; href: string; ariaLabel?: string }>,
  className?: string
): HTMLElement {
  const nav = document.createElement('nav');
  if (className) nav.className = className;

  const ul = document.createElement('ul');
  links.forEach((link) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.href = link.href;
    a.textContent = link.text;
    if (link.ariaLabel) a.setAttribute('aria-label', link.ariaLabel);
    li.appendChild(a);
    ul.appendChild(li);
  });

  nav.appendChild(ul);
  return nav;
}

/**
 * Create semantic footer
 */
export function createSemanticFooter(
  content: string,
  className?: string
): HTMLElement {
  const footer = document.createElement('footer');
  if (className) footer.className = className;
  footer.innerHTML = content;
  return footer;
}

/**
 * Create semantic header
 */
export function createSemanticHeader(
  content: string,
  className?: string
): HTMLElement {
  const header = document.createElement('header');
  if (className) header.className = className;
  header.innerHTML = content;
  return header;
}

/**
 * Create semantic main content area
 */
export function createSemanticMain(
  content: string,
  className?: string
): HTMLElement {
  const main = document.createElement('main');
  if (className) main.className = className;
  main.innerHTML = content;
  return main;
}

/**
 * Create semantic aside (sidebar)
 */
export function createSemanticAside(
  content: string,
  className?: string
): HTMLElement {
  const aside = document.createElement('aside');
  if (className) aside.className = className;
  aside.innerHTML = content;
  return aside;
}

/**
 * Add ARIA labels for accessibility
 */
export function addAriaLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

/**
 * Add ARIA description
 */
export function addAriaDescription(element: HTMLElement, description: string): void {
  const id = `aria-desc-${Math.random().toString(36).substr(2, 9)}`;
  const desc = document.createElement('span');
  desc.id = id;
  desc.className = 'sr-only';
  desc.textContent = description;
  element.appendChild(desc);
  element.setAttribute('aria-describedby', id);
}

/**
 * Create skip to main content link
 */
export function createSkipLink(): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = '#main-content';
  link.textContent = 'Skip to main content';
  link.className = 'sr-only focus:not-sr-only';
  return link;
}

/**
 * Set up semantic document structure
 */
export function setupSemanticStructure(): void {
  if (typeof document === 'undefined') return;

  // Ensure proper lang attribute
  if (!document.documentElement.lang) {
    document.documentElement.lang = 'en';
  }

  // Add skip link
  const body = document.body;
  if (body && !document.querySelector('a[href="#main-content"]')) {
    body.insertBefore(createSkipLink(), body.firstChild);
  }

  // Ensure main element exists
  if (!document.querySelector('main')) {
    const main = document.createElement('main');
    main.id = 'main-content';
    body?.appendChild(main);
  }
}

/**
 * Validate semantic structure
 */
export function validateSemanticStructure(): {
  hasHeader: boolean;
  hasNav: boolean;
  hasMain: boolean;
  hasFooter: boolean;
  headingHierarchy: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  const hasHeader = !!document.querySelector('header');
  const hasNav = !!document.querySelector('nav');
  const hasMain = !!document.querySelector('main');
  const hasFooter = !!document.querySelector('footer');

  if (!hasHeader) issues.push('Missing <header> element');
  if (!hasNav) issues.push('Missing <nav> element');
  if (!hasMain) issues.push('Missing <main> element');
  if (!hasFooter) issues.push('Missing <footer> element');

  // Check heading hierarchy
  const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let headingHierarchy = true;
  let lastLevel = 0;

  for (const heading of headings) {
    const level = parseInt(heading.tagName[1]);
    if (level > lastLevel + 1) {
      headingHierarchy = false;
      issues.push(`Heading hierarchy broken: jumped from H${lastLevel} to H${level}`);
    }
    lastLevel = level;
  }

  return {
    hasHeader,
    hasNav,
    hasMain,
    hasFooter,
    headingHierarchy,
    issues,
  };
}
