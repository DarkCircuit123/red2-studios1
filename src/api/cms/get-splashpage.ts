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

                          // Filter only active items and map to safe fields only
                              const items = result?.items
                                    ? result.items.filter((item) => item.isActive === true)
                                          : [];

                                                  const safeData = items.map((item) => ({
                                                        logoName: item.logoName,
                                                              logoImage: item.logoImage,
                                                                    altText: item.altText,
                                                                        }));

                                                                            console.log('[API] Splashpage fetch successful, active items:', safeData.length);

                                                                                    return new Response(
                                                                                          JSON.stringify({ items: safeData }),
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
 */
