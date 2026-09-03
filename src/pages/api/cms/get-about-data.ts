import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

export const GET: APIRoute = async () => {
  try {
    // Fetch homepage images
    const imagesResult = await BaseCrudService.getAll('homepageimages', {}, { limit: 1 });
    let aboutImage = null;
    
    if (imagesResult?.items && imagesResult.items.length > 0) {
      const images = imagesResult.items[0] as any;
      aboutImage = images?.aboutSectionImage || null;
    }

    // Fetch about section data
    let aboutText = null;
    let fontFamily = null;
    
    try {
      const aboutResult = await BaseCrudService.getAll('about', {}, { limit: 1 });
      if (aboutResult?.items && aboutResult.items.length > 0) {
        const about = aboutResult.items[0] as any;
        aboutText = about?.aboutText || null;
        fontFamily = about?.fontFamily || null;
      }
    } catch (error) {
      console.error('[get-about-data] Error loading about settings:', error);
    }

    return new Response(
      JSON.stringify({
        success: true,
        aboutImage,
        aboutText,
        fontFamily,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[get-about-data] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
