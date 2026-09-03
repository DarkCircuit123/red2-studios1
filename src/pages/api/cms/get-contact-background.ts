import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
    let contactBackgroundImage = null;
    
    if (result?.items && result.items.length > 0) {
      const images = result.items[0] as any;
      if (images?.contactBackgroundImage && typeof images.contactBackgroundImage === 'string') {
        // Convert wix:image:// to HTTPS URL for browser rendering
        const httpsUrl = convertWixImageToHttps(images.contactBackgroundImage);
        if (httpsUrl) {
          contactBackgroundImage = httpsUrl;
        }
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        contactBackgroundImage,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[get-contact-background] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false, contactBackgroundImage: null }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
