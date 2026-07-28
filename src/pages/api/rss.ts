import type { APIRoute } from 'astro';

// Fallback stories to show when RSS feeds fail
const FALLBACK_STORIES = [
  {
    title: 'Fashion Week Highlights: Spring/Summer 2025 Collections',
    link: 'https://www.vogue.com',
    source: 'Vogue',
    pubDate: new Date().toISOString(),
  },
  {
    title: 'Photography Trends: Mastering Natural Light',
    link: 'https://www.sonyalpharumors.com',
    source: 'Sony Alpha',
    pubDate: new Date().toISOString(),
  },
  {
    title: 'Sustainable Fashion: The Future of the Industry',
    link: 'https://www.fashionnetwork.com',
    source: 'Fashion Network',
    pubDate: new Date().toISOString(),
  },
  {
    title: 'Celebrity Style: Red Carpet Moments',
    link: 'https://www.thefashionspot.com',
    source: 'The Fashion Spot',
    pubDate: new Date().toISOString(),
  },
  {
    title: 'New Camera Gear: Latest Releases',
    link: 'https://www.sonyalpharumors.com',
    source: 'Sony Alpha',
    pubDate: new Date().toISOString(),
  },
];

// Simple RSS parser
function parseRSSFeed(xmlText: string): any[] {
  const items: any[] = [];
  
  try {
    // Parse XML using regex (simple approach)
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;
    
    while ((match = itemRegex.exec(xmlText)) !== null) {
      const itemXml = match[1];
      
      // Extract title
      const titleMatch = /<title[^>]*>([\s\S]*?)<\/title>/.exec(itemXml);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Untitled';
      
      // Extract link
      const linkMatch = /<link[^>]*>([\s\S]*?)<\/link>/.exec(itemXml);
      const link = linkMatch ? linkMatch[1].trim() : '#';
      
      // Extract pubDate
      const pubDateMatch = /<pubDate[^>]*>([\s\S]*?)<\/pubDate>/.exec(itemXml);
      const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();
      
      items.push({
        title,
        link,
        pubDate,
      });
    }
  } catch (error) {
    console.error('Error parsing RSS:', error);
  }
  
  return items;
}

export const GET: APIRoute = async ({ url }) => {
  const feedUrl = url.searchParams.get('url');
  
  if (!feedUrl) {
    return new Response(
      JSON.stringify({
        items: FALLBACK_STORIES,
        error: 'No URL provided, returning fallback stories',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }

  try {
    // Try to fetch the RSS feed with a timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000); // 8 second timeout
    
    const response = await fetch(feedUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      console.warn(`Failed to fetch RSS feed: ${response.status}`);
      return new Response(
        JSON.stringify({
          items: FALLBACK_STORIES,
          error: `HTTP ${response.status}`,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
    
    const text = await response.text();
    const items = parseRSSFeed(text);
    
    // Return parsed items or fallback if empty
    return new Response(
      JSON.stringify({
        items: items.length > 0 ? items : FALLBACK_STORIES,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching RSS feed:', error);
    
    // Return fallback stories on any error
    return new Response(
      JSON.stringify({
        items: FALLBACK_STORIES,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
