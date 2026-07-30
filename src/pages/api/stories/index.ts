/**
 * API Route: GET /api/stories
 * Fetch all stories with pagination or by source URL
 */

import { processFeed, getAllStories, getStoryBySourceURL } from '@/api/rss';

export async function GET({ request }: { request: Request }) {
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '12');
  const skip = parseInt(url.searchParams.get('skip') || '0');
  const sourceUrl = url.searchParams.get('url');

  try {
    // If sourceUrl is provided, fetch by source URL
    if (sourceUrl) {
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
    }

    // Otherwise fetch all stories with pagination
    const result = await getAllStories(limit, skip);
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error fetching stories:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch stories' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

export async function POST({ request }: { request: Request }) {
  try {
    const newItems = await processFeed();
    return new Response(JSON.stringify({ 
      success: true, 
      itemsAdded: newItems.length,
      items: newItems 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    console.error('Error syncing feed:', error);
    return new Response(JSON.stringify({ error: 'Failed to sync feed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
