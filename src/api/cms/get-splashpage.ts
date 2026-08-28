/**
 *  * API Endpoint: Get Splashpage CMS Data
  * Security Hardened: Filters active items and strips internal fields.
   * Returns only: logoName, logoImage, altText
    */
    import type { APIRoute } from 'astro';
    import { BaseCrudService } from '@integrations';
    import type { Splashpage } from '@entities';
    export const GET: APIRoute = async () => {
      try {
          console.log('[API] GET /api/cms/get-splashpage - Fetching splashpage collection');

                  const result = await BaseCrudService.getAll<Splashpage>('splashpage', {}, { limit: 50 });

                          // Filter
 */
