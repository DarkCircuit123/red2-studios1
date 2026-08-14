/**
 * API Endpoint: Get Splashpage CMS Data
 * 
 * Retrieves active splash logo from the splashpage collection.
 * This endpoint exists to allow client-side components to fetch CMS data safely.
 * BaseCrudService is server-side only and causes WDE0053 when called from client.
 */

import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { Splashpage } from '@/entities';

export const GET: APIRoute = async () => {
  try {
    console.log('[API] GET /api/cms/get-splashpage - Fetching splashpage collection');
    
    const result = await BaseCrudService.getAll<Splashpage>('splashpage', {}, { limit: 50 });
    
    console.log('[API] Splashpage fetch successful, items:', result?.items?.length || 0);
    
    return new Response(
      JSON.stringify(result),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[API] Error fetching splashpage:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Failed to fetch splashpage data',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
