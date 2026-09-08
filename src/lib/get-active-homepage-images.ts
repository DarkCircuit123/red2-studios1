import type { HomepageImages } from '@/entities';

export async function getActiveHomepageImages(): Promise<HomepageImages | null> {
  try {
    const response = await fetch('/api/admin/homepage-images', { method: 'GET', credentials: 'include', headers: { Accept: 'application/json' } });
    const data = await response.json().catch(() => null);
    if (!response.ok || !data?.success) throw new Error(typeof data?.error === 'string' ? data.error : 'Failed to load homepage images');
    return data.item || null;
  } catch (error) {
    console.error('[GET_ACTIVE_HOMEPAGE_IMAGES] Error:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}
