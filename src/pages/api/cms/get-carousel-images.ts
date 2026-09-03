import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { HomepageImages } from '@/entities/index';
import { convertWixImageToHttps } from '@/lib/convert-wix-image';

interface CarouselImage {
  id: string;
  url: string;
  alt: string;
  focalPointX?: number;
  focalPointY?: number;
}

export const GET: APIRoute = async () => {
  try {
    const data = await BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 100 });
    const collected: CarouselImage[] = [];

    data.items?.forEach((item) => {
      if (item.heroImage) {
        // Convert wix:image:// URLs to HTTPS for browser rendering
        const httpsUrl = convertWixImageToHttps(item.heroImage);
        if (httpsUrl) {
          collected.push({
            id: item._id,
            url: httpsUrl,
            alt: item.imageName || 'Carousel photo',
            focalPointX: item.heroImageFocalPointX,
            focalPointY: item.heroImageFocalPointY,
          });
        }
      }
    });

    return new Response(
      JSON.stringify({
        success: true,
        items: collected,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[get-carousel-images] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false, items: [] }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
