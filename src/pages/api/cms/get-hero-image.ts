import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
    
    if (result?.items && result.items.length > 0) {
      const images = result.items[0] as any;
      return new Response(
        JSON.stringify({
          success: true,
          heroImage: images?.heroImage || null,
          heroImageFocalPointX: images?.heroImageFocalPointX,
          heroImageFocalPointY: images?.heroImageFocalPointY,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        heroImage: null,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[get-hero-image] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
