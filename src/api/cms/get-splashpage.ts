/**
 * API Endpoint: Get Splashpage CMS Data
 * Security hardened: only public display fields are returned.
 */
import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { Splashpage } from '@/entities';

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll<Splashpage>('splashpage', {}, { limit: 50 });
    const items = result.items || [];
    const activeItems = items
      .filter((item) => item.isActive === true && Boolean(item.logoImage))
      .map((item) => ({
        logoName: item.logoName || '',
        logoImage: item.logoImage || '',
        altText: item.altText || '',
        isActive: true,
      }));

    if (activeItems.length > 0) {
      return new Response(JSON.stringify({ items: activeItems }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fallbackItems = items
      .filter((item) => Boolean(item.logoImage))
      .map((item) => ({
        logoName: item.logoName || '',
        logoImage: item.logoImage || '',
        altText: item.altText || '',
        isActive: false,
      }));

    return new Response(JSON.stringify({ items: fallbackItems }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[API] Error fetching splashpage:', error);
    return new Response(JSON.stringify({ items: [], error: 'Failed to fetch splashpage data' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
