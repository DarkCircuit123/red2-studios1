/**
 * API Endpoint: Get Splashpage CMS Data
 * Security Hardened: Filters active items and strips internal fields.
 * Returns only: logoName, logoImage, altText
 */
import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { Splashpage } from '@/entities';

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll<Splashpage>('splashpage', {}, { limit: 50 });

    // First try to find active items
    const activeItems = result.items
      .filter((item) => item.isActive === true)
      .map((item) => ({
        logoName: item.logoName || '',
        logoImage: item.logoImage || '',
        altText: item.altText || '',
      }));

    // If active items exist, return them
    if (activeItems.length > 0) {
      return new Response(JSON.stringify({ items: activeItems }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }

    // Fallback: return all items if no active ones found
    const allItems = result.items
      .map((item) => ({
        logoName: item.logoName || '',
        logoImage: item.logoImage || '',
        altText: item.altText || '',
      }));

    return new Response(JSON.stringify({ items: allItems }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  } catch (error) {
    console.error('[API] Error fetching splashpage:', error);
    return new Response(JSON.stringify({ items: [], error: 'Failed to fetch splashpage data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
};
