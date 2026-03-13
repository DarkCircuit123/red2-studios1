/**
 * RSS Feed Service
 * Handles fetching, parsing, and deduplication of RSS feed items
 */

const RSS_FEED_URL = 'https://1854.photography/feed';
const SOURCE_NAME = 'British Journal of Photography';
const DEFAULT_PLACEHOLDER_IMAGE = 'https://static.wixstatic.com/media/12d367_71ebdd7141d041e4be3d91d80d4578dd~mv2.png';

interface RSSItem {
  title: string;
  link: string;
  pubDate: string;
  description: string;
  enclosure?: {
    url: string;
  };
}

interface ParsedItem {
  title: string;
  sourceURL: string;
  publicationDate: string;
  excerpt: string;
  sourceName: string;
  featuredImage: string;
  fullSummary: string;
  slug: string;
}

/**
 * Strip HTML tags from text
 */
export function stripHtmlTags(html: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Truncate text to max length
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Generate URL-safe slug from title
 */
export function generateSlug(title: string): string {
  if (!title) return '';
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .substring(0, 60);
}

/**
 * Extract first image URL from HTML
 */
export function extractFirstImageFromHtml(html: string): string | null {
  if (!html) return null;
  const imgRegex = /<img[^>]+src=["']([^"']+)["']/i;
  const match = html.match(imgRegex);
  return match ? match[1] : null;
}

/**
 * Fetch Open Graph image from URL
 */
export async function fetchOgImage(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) return null;
    
    const html = await response.text();
    const ogImageRegex = /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i;
    const match = html.match(ogImageRegex);
    
    return match ? match[1] : null;
  } catch (error) {
    console.error('Error fetching OG image:', error);
    return null;
  }
}

/**
 * Extract featured image with fallback priority
 */
export async function extractFeaturedImage(item: RSSItem): Promise<string> {
  // Priority 1: RSS enclosure tag
  if (item.enclosure?.url) {
    return item.enclosure.url;
  }
  
  // Priority 2: First image in description
  const descImage = extractFirstImageFromHtml(item.description);
  if (descImage) {
    return descImage;
  }
  
  // Priority 3: Open Graph image from article URL
  if (item.link) {
    const ogImage = await fetchOgImage(item.link);
    if (ogImage) {
      return ogImage;
    }
  }
  
  // Priority 4: Default placeholder
  return DEFAULT_PLACEHOLDER_IMAGE;
}

/**
 * Parse RSS feed XML
 */
export function parseRSSXml(xmlText: string): RSSItem[] {
  const items: RSSItem[] = [];
  
  // Simple XML parsing for RSS items
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xmlText)) !== null) {
    const itemContent = match[1];
    
    const titleMatch = itemContent.match(/<title[^>]*>([\s\S]*?)<\/title>/);
    const linkMatch = itemContent.match(/<link[^>]*>([\s\S]*?)<\/link>/);
    const pubDateMatch = itemContent.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/);
    const descriptionMatch = itemContent.match(/<description[^>]*>([\s\S]*?)<\/description>/);
    const enclosureMatch = itemContent.match(/<enclosure[^>]*url=["']([^"']+)["']/);
    
    if (titleMatch && linkMatch) {
      items.push({
        title: stripHtmlTags(titleMatch[1]),
        link: stripHtmlTags(linkMatch[1]),
        pubDate: pubDateMatch ? stripHtmlTags(pubDateMatch[1]) : new Date().toISOString(),
        description: descriptionMatch ? stripHtmlTags(descriptionMatch[1]) : '',
        enclosure: enclosureMatch ? { url: enclosureMatch[1] } : undefined
      });
    }
  }
  
  return items;
}

/**
 * Parse RSS item into CMS format
 */
export async function parseRSSItem(item: RSSItem): Promise<ParsedItem> {
  const excerpt = truncateText(stripHtmlTags(item.description), 300);
  const featuredImage = await extractFeaturedImage(item);
  const slug = generateSlug(item.title);
  
  // Parse publication date
  let publicationDate = new Date(item.pubDate).toISOString().split('T')[0];
  if (!publicationDate || publicationDate === 'Invalid Date') {
    publicationDate = new Date().toISOString().split('T')[0];
  }
  
  return {
    title: item.title,
    sourceURL: item.link,
    publicationDate,
    excerpt,
    sourceName: SOURCE_NAME,
    featuredImage,
    fullSummary: item.description,
    slug
  };
}

/**
 * Fetch RSS feed
 */
export async function fetchRSSFeed(): Promise<RSSItem[]> {
  try {
    const response = await fetch(RSS_FEED_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }
    
    const xmlText = await response.text();
    return parseRSSXml(xmlText);
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    return [];
  }
}
