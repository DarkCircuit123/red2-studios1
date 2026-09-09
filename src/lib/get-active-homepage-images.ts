import { BaseCrudService } from '@/integrations';
import { HomepageImages } from '@/entities';

/**
 * Shared helper to fetch the active homepage images row
 * - Limit to 300 items
 * - Filter on isActive: true
 * - Sort by _createdDate descending (newest first)
 * Returns the first (and typically only) active row
 */
export async function getActiveHomepageImages(): Promise<HomepageImages | null> {
  try {
    // Fetch all homepage images and filter client-side
    // (BaseCrudService.getAll doesn't support server-side filtering yet)
    const result = await BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 300 });
    
    if (!result.items || result.items.length === 0) {
      return null;
    }

    // Filter for active items and sort by _createdDate descending (newest first)
    const activeItems = result.items
      .filter(item => item.isActive === true)
      .sort((a, b) => {
        const dateA = new Date(a._createdDate || 0).getTime();
        const dateB = new Date(b._createdDate || 0).getTime();
        return dateB - dateA; // Newest first
      });

    return activeItems.length > 0 ? activeItems[0] : null;
  } catch (error) {
    console.error('[GET_ACTIVE_HOMEPAGE_IMAGES] Error:', error);
    throw error;
  }
}
