/**
 * SEO Magic Engine - Next-Gen Aggressive SEO Optimization
 * Implements cutting-edge techniques for maximum search engine and AI ranking
 */

export interface SEOMagicConfig {
  title: string;
  description: string;
  keywords: string[];
  image?: string;
  canonical?: string;
  ogType?: string;
  twitterCard?: string;
  author?: string;
  datePublished?: string;
  dateModified?: string;
  schema?: any;
  locale?: string;
  alternateLocales?: string[];
  robots?: string;
  rating?: number;
  ratingCount?: number;
  price?: string;
  priceCurrency?: string;
  availability?: string;
  inLanguage?: string;
  isArticle?: boolean;
  articleSection?: string;
  wordCount?: number;
  readingTime?: number;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

/**
 * Generate comprehensive SEO meta tags with AI optimization
 */
export function generateSEOMagicTags(config: SEOMagicConfig): string {
  const tags: string[] = [];

  // 1. CORE META TAGS
  tags.push(`<title>${escapeHtml(config.title)}</title>`);
  tags.push(`<meta name="description" content="${escapeHtml(config.description)}">`);
  tags.push(`<meta name="keywords" content="${escapeHtml(config.keywords.join(', '))}">`);

  // 2. CANONICAL URL (CRITICAL for SEO)
  if (config.canonical) {
    tags.push(`<link rel="canonical" href="${config.canonical}">`);
  }

  // 3. OPEN GRAPH TAGS (Social signals + AI crawlers)
  tags.push(`<meta property="og:type" content="${config.ogType || 'website'}">`);
  tags.push(`<meta property="og:title" content="${escapeHtml(config.title)}">`);
  tags.push(`<meta property="og:description" content="${escapeHtml(config.description)}">`);
  if (config.image) {
    tags.push(`<meta property="og:image" content="${config.image}">`);
    tags.push(`<meta property="og:image:width" content="1200">`);
    tags.push(`<meta property="og:image:height" content="630">`);
    tags.push(`<meta property="og:image:type" content="image/png">`);
  }
  tags.push(`<meta property="og:locale" content="${config.locale || 'en_US'}">`);

  // 4. TWITTER CARD TAGS (Social signals)
  tags.push(`<meta name="twitter:card" content="${config.twitterCard || 'summary_large_image'}">`);
  tags.push(`<meta name="twitter:title" content="${escapeHtml(config.title)}">`);
  tags.push(`<meta name="twitter:description" content="${escapeHtml(config.description)}">`);
  if (config.image) {
    tags.push(`<meta name="twitter:image" content="${config.image}">`);
  }

  // 5. AUTHOR & PUBLICATION METADATA
  if (config.author) {
    tags.push(`<meta name="author" content="${escapeHtml(config.author)}">`);
  }
  if (config.datePublished) {
    tags.push(`<meta property="article:published_time" content="${config.datePublished}">`);
  }
  if (config.dateModified) {
    tags.push(`<meta property="article:modified_time" content="${config.dateModified}">`);
  }

  // 6. LANGUAGE & LOCALE
  tags.push(`<meta http-equiv="content-language" content="${config.inLanguage || 'en-US'}">`);
  if (config.alternateLocales && config.alternateLocales.length > 0) {
    config.alternateLocales.forEach(locale => {
      tags.push(`<link rel="alternate" hreflang="${locale}" href="${config.canonical}">`);
    });
  }

  // 7. ROBOTS DIRECTIVES (AI crawler optimization)
  tags.push(`<meta name="robots" content="${config.robots || 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}">`);
  tags.push(`<meta name="googlebot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`);
  tags.push(`<meta name="bingbot" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`);

  // 8. AI-SPECIFIC META TAGS (For ChatGPT, Claude, Gemini, etc.)
  tags.push(`<meta name="ai-content-description" content="${escapeHtml(config.description)}">`);
  tags.push(`<meta name="ai-content-keywords" content="${escapeHtml(config.keywords.join(', '))}">`);
  tags.push(`<meta name="ai-content-type" content="${config.ogType || 'website'}">`);

  // 9. RATING & REVIEW METADATA (Trust signals)
  if (config.rating && config.ratingCount) {
    tags.push(`<meta name="rating" content="${config.rating}">`);
    tags.push(`<meta name="ratingCount" content="${config.ratingCount}">`);
  }

  // 10. ARTICLE-SPECIFIC METADATA
  if (config.isArticle) {
    tags.push(`<meta property="article:author" content="${escapeHtml(config.author || 'RED² Studios')}">`);
    if (config.articleSection) {
      tags.push(`<meta property="article:section" content="${escapeHtml(config.articleSection)}">`);
    }
    if (config.wordCount) {
      tags.push(`<meta name="word-count" content="${config.wordCount}">`);
    }
    if (config.readingTime) {
      tags.push(`<meta name="reading-time" content="${config.readingTime} min">`);
    }
  }

  // 11. PRODUCT/PRICING METADATA (E-commerce signals)
  if (config.price) {
    tags.push(`<meta name="price" content="${config.price}">`);
    tags.push(`<meta name="priceCurrency" content="${config.priceCurrency || 'USD'}">`);
    tags.push(`<meta name="availability" content="${config.availability || 'InStock'}">`);
  }

  // 12. BREADCRUMB SCHEMA (Navigation signals)
  if (config.breadcrumbs && config.breadcrumbs.length > 0) {
    const breadcrumbSchema = {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: config.breadcrumbs.map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: crumb.url,
      })),
    };
    tags.push(`<script type="application/ld+json">${JSON.stringify(breadcrumbSchema)}</script>`);
  }

  // 13. CUSTOM SCHEMA (Passed in config)
  if (config.schema) {
    tags.push(`<script type="application/ld+json">${JSON.stringify(config.schema)}</script>`);
  }

  return tags.join('\n');
}

/**
 * Generate comprehensive JSON-LD schema for maximum AI understanding
 */
export function generateAdvancedSchema(type: 'Organization' | 'Person' | 'LocalBusiness' | 'ImageGallery' | 'Article' | 'Product', data: any) {
  const baseContext = {
    '@context': 'https://schema.org',
    '@type': type,
  };

  switch (type) {
    case 'Organization':
      return {
        ...baseContext,
        name: 'RED² Studios',
        url: 'https://red2studios.com',
        logo: 'https://red2studios.com/logo.png',
        description: 'Professional fashion and editorial photography studio with 25+ years of experience',
        sameAs: [
          'https://instagram.com/red2studios',
          'https://twitter.com/red2studios',
          'https://linkedin.com/company/red2studios',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Service',
          telephone: '+1-XXX-XXX-XXXX',
          email: 'contact@red2studios.com',
        },
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Los Angeles, CA',
          addressCountry: 'US',
        },
        areaServed: ['US', 'North America'],
        knowsAbout: ['Fashion Photography', 'Editorial Photography', 'Commercial Photography', 'Portrait Photography'],
      };

    case 'Person':
      return {
        ...baseContext,
        name: 'Jordan Michael Zuniga',
        url: 'https://red2studios.com',
        image: 'https://red2studios.com/jordan.jpg',
        description: 'Professional fashion and editorial photographer with 25+ years of experience',
        jobTitle: 'Photographer',
        worksFor: {
          '@type': 'Organization',
          name: 'RED² Studios',
        },
        sameAs: [
          'https://instagram.com/red2studios',
          'https://twitter.com/red2studios',
        ],
        knowsAbout: ['Fashion Photography', 'Editorial Photography', 'Commercial Photography'],
        award: 'Award-winning photographer',
      };

    case 'LocalBusiness':
      return {
        ...baseContext,
        name: 'RED² Studios',
        description: 'Professional photography studio',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Los Angeles, CA',
          addressCountry: 'US',
        },
        telephone: '+1-XXX-XXX-XXXX',
        email: 'contact@red2studios.com',
        url: 'https://red2studios.com',
        priceRange: '$$$',
        areaServed: ['Los Angeles', 'California', 'United States'],
        serviceType: ['Fashion Photography', 'Editorial Photography', 'Commercial Photography'],
      };

    case 'ImageGallery':
      return {
        ...baseContext,
        name: data.name || 'Portfolio Gallery',
        description: data.description || 'Professional photography portfolio',
        image: data.images || [],
        associatedMedia: (data.images || []).map((img: any) => ({
          '@type': 'ImageObject',
          url: img.url,
          name: img.name || 'Portfolio Image',
          description: img.description || 'Professional photography',
        })),
      };

    case 'Article':
      return {
        ...baseContext,
        headline: data.title,
        description: data.description,
        image: data.image,
        datePublished: data.datePublished || new Date().toISOString(),
        dateModified: data.dateModified || new Date().toISOString(),
        author: {
          '@type': 'Person',
          name: data.author || 'Jordan Michael Zuniga',
        },
        publisher: {
          '@type': 'Organization',
          name: 'RED² Studios',
          logo: 'https://red2studios.com/logo.png',
        },
        wordCount: data.wordCount || 1000,
        articleSection: data.section || 'Photography',
      };

    case 'Product':
      return {
        ...baseContext,
        name: data.name,
        description: data.description,
        image: data.image,
        price: data.price,
        priceCurrency: data.priceCurrency || 'USD',
        availability: data.availability || 'InStock',
        aggregateRating: {
          '@type': 'AggregateRating',
          ratingValue: data.rating || 5,
          ratingCount: data.ratingCount || 1,
        },
      };

    default:
      return baseContext;
  }
}

/**
 * Generate AI-optimized content snippets for better LLM understanding
 */
export function generateAIOptimizedSnippet(content: string, maxLength: number = 160): string {
  // Remove HTML tags
  const cleanContent = content.replace(/<[^>]*>/g, '');
  
  // Extract key sentences
  const sentences = cleanContent.split(/[.!?]+/).filter(s => s.trim().length > 0);
  
  let snippet = '';
  for (const sentence of sentences) {
    if ((snippet + sentence).length <= maxLength) {
      snippet += sentence.trim() + '. ';
    } else {
      break;
    }
  }
  
  return snippet.trim().substring(0, maxLength);
}

/**
 * Generate semantic HTML structure for better AI parsing
 */
export function generateSemanticStructure(content: {
  h1: string;
  h2?: string[];
  h3?: string[];
  paragraphs?: string[];
  keywords?: string[];
}): string {
  let html = `<h1>${escapeHtml(content.h1)}</h1>\n`;
  
  if (content.h2) {
    content.h2.forEach(heading => {
      html += `<h2>${escapeHtml(heading)}</h2>\n`;
    });
  }
  
  if (content.h3) {
    content.h3.forEach(heading => {
      html += `<h3>${escapeHtml(heading)}</h3>\n`;
    });
  }
  
  if (content.paragraphs) {
    content.paragraphs.forEach(para => {
      html += `<p>${escapeHtml(para)}</p>\n`;
    });
  }
  
  return html;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: { [key: string]: string } = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

/**
 * Generate robots.txt content for AI crawler optimization
 */
export function generateRobotsTxt(): string {
  return `# RED² Studios - Robots.txt for Search Engines and AI Crawlers
User-agent: *
Allow: /
Allow: /portfolio
Allow: /about
Allow: /contact
Allow: /booking
Allow: /blog
Allow: /stories
Allow: /watch

# Disallow admin and private pages
Disallow: /admin
Disallow: /private
Disallow: /api/
Disallow: /*.json$
Disallow: /*.xml$

# AI Crawler Optimization
User-agent: GPTBot
Allow: /

User-agent: CCBot
Allow: /

User-agent: anthropic-ai
Allow: /

User-agent: Claude-Web
Allow: /

User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Sitemap
Sitemap: https://red2studios.com/sitemap.xml
Sitemap: https://red2studios.com/sitemap-portfolio.xml
Sitemap: https://red2studios.com/sitemap-blog.xml

# Crawl delay for other bots
Crawl-delay: 1
Request-rate: 30/60
`;
}

/**
 * Generate sitemap XML for comprehensive indexing
 */
export function generateSitemapXml(pages: Array<{ url: string; lastmod?: string; priority?: number; changefreq?: string }>): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
  xml += '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
  xml += '        xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">\n';

  pages.forEach(page => {
    xml += '  <url>\n';
    xml += `    <loc>${escapeHtml(page.url)}</loc>\n`;
    if (page.lastmod) {
      xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
    }
    xml += `    <changefreq>${page.changefreq || 'weekly'}</changefreq>\n`;
    xml += `    <priority>${page.priority || 0.8}</priority>\n`;
    xml += '  </url>\n';
  });

  xml += '</urlset>';
  return xml;
}

/**
 * Generate comprehensive SEO audit report
 */
export function generateSEOAuditReport(pageData: any): {
  score: number;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check title
  if (!pageData.title || pageData.title.length < 30) {
    issues.push('Title is missing or too short (min 30 chars)');
    score -= 10;
  } else if (pageData.title.length > 60) {
    recommendations.push('Title is longer than 60 characters (may be truncated in SERPs)');
  }

  // Check description
  if (!pageData.description || pageData.description.length < 120) {
    issues.push('Meta description is missing or too short (min 120 chars)');
    score -= 10;
  } else if (pageData.description.length > 160) {
    recommendations.push('Meta description is longer than 160 characters (may be truncated)');
  }

  // Check keywords
  if (!pageData.keywords || pageData.keywords.length === 0) {
    issues.push('No keywords defined');
    score -= 5;
  }

  // Check canonical URL
  if (!pageData.canonical) {
    issues.push('Canonical URL not set');
    score -= 5;
  }

  // Check schema
  if (!pageData.schema) {
    issues.push('No structured data (JSON-LD) found');
    score -= 10;
  }

  // Check image alt text
  if (pageData.images && pageData.images.some((img: any) => !img.alt)) {
    issues.push('Some images missing alt text');
    score -= 5;
  }

  // Check H1 tags
  if (!pageData.h1) {
    issues.push('No H1 tag found');
    score -= 10;
  }

  // Check mobile optimization
  if (!pageData.mobileOptimized) {
    issues.push('Page not optimized for mobile');
    score -= 10;
  }

  // Check page speed
  if (pageData.pageSpeed && pageData.pageSpeed < 50) {
    issues.push('Page speed is below 50 (target: 90+)');
    score -= 10;
  }

  return {
    score: Math.max(0, score),
    issues,
    recommendations,
  };
}
