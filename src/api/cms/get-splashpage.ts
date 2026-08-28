/**
 * API Endpoint: Get Splashpage CMS Data
 * Security Hardened: Filters active items and strips internal fields.
 * Returns only: logoName, logoImage, altText
 */
import type { APIRoute } from 'astro';
import { BaseCrudService } from '@integrations';
import type { Splashpage } from '@entities';

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll<Splashpage>('splashpage', {}, { limit: 50 });

    // Filter for active items and map to only required fields
    const filteredItems = result.items
      .filter((item) => item.isActive === true)
      .map((item) => ({
        logoName: item.logoName || '',
        logoImage: item.logoImage || '',
        altText: item.altText || '',
      }));

    return new Response(JSON.stringify({ items: filteredItems }), {
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
