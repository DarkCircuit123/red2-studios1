/**
 * API Route: GET /api/stories/by-url
 * Fetch story by source URL (for ticker matching)
 */

import { getStoryBySourceURL } from '@/api/rss';

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const sourceUrl = url.searchParams.get('url');

  if (!sourceUrl) {
    return new Response(JSON.stringify({ error: 'URL parameter required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  try {
    const story = await getStoryBySourceURL(decodeURIComponent(sourceUrl));
    if (!story) {
      return new Response(JSON.stringify({ error: 'Story not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    return new Response(JSON.stringify(story), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching story by URL:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch story' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
