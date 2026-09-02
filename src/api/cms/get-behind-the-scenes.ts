/**
 * API Endpoint: Get Behind The Scenes CMS Data
 * Returns all behind-the-scenes photos sorted by order
 */
import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { BehindTheScenes } from '@/entities';

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll<BehindTheScenes>('behindthescenes', {}, { limit: 100 });

    // Sort by order field and return all items
    const items = result.items
      .sort((a, b) => (a.order || 0) - (b.order || 0))
      .map((item) => ({
        _id: item._id,
        photo: item.photo || '',
        title: item.title || '',
        description: item.description || '',
        order: item.order || 0,
        dateTaken: item.dateTaken || '',
      }));

    return new Response(JSON.stringify({ items }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching behind-the-scenes data:', error);
    return new Response(JSON.stringify({ items: [], error: 'Failed to fetch behind-the-scenes data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
