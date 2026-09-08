import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import type { HomepageImages } from '@/entities';

/**
 * Get Homepage Images API
 * Fetches hero, about section, and contact background images from the homepageimages collection
 * Public endpoint - no authentication required
 * Filters for active items and returns the most recent one
 */

export const GET: APIRoute = async (context) => {
  try {
    console.log('[GET_HOMEPAGE_IMAGES] Request started');

    // Query the homepageimages collection directly (public read access)
    const result = await BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 100 });

    // Filter for active items and get the most recent one
    const activeItems = (result.items || [])
      .filter((item) => item.isActive === true)
      .sort((a, b) => new Date(b._createdDate || 0).getTime() - new Date(a._createdDate || 0).getTime());

    const activeItem = activeItems[0] || null;

    // Build safe response with fallbacks for optional image fields
    const responseItem = activeItem ? {
      _id: activeItem._id,
      _createdDate: activeItem._createdDate,
      _updatedDate: activeItem._updatedDate,
      imageName: activeItem.imageName || '',
      heroImage: activeItem.heroImage || null,
      aboutSectionImage: activeItem.aboutSectionImage || null,
      contactBackgroundImage: activeItem.contactBackgroundImage || null,
      lastUpdated: activeItem.lastUpdated || null,
      isActive: activeItem.isActive || false,
    } : null;

    console.log('[GET_HOMEPAGE_IMAGES] Successfully fetched homepage images', {
      itemCount: responseItem ? 1 : 0,
      hasHeroImage: !!responseItem?.heroImage,
      hasAboutImage: !!responseItem?.aboutSectionImage,
      hasContactImage: !!responseItem?.contactBackgroundImage,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        items: responseItem ? [responseItem] : [],
        totalCount: responseItem ? 1 : 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[GET_HOMEPAGE_IMAGES] Failed to fetch homepage images', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    // Return safe fallback response instead of 500
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch homepage images',
        items: [],
        totalCount: 0,
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
