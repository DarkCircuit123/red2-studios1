/**
 * API Route: GET /api/stories/:slug
 * Fetch single story by slug
 */

import { getStoryBySlug } from '@/api/rss';

export async function GET({ params }: { params: { slug: string } }) {
  try {
    const story = await getStoryBySlug(params.slug);
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
    console.error('Error fetching story:', error);
    return new Response(JSON.stringify({ error: 'Failed to fetch story' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
