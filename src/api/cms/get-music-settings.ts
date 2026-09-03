import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { MusicSettings } from '@/entities/index';

/**
 * Get Music Settings API
 * Fetches enabled music tracks from the musicsettings collection
 * Public endpoint - no authentication required
 */

export const GET: APIRoute = async () => {
  try {
    console.log('[GET_MUSIC_SETTINGS] Request started');

    const result = await BaseCrudService.getAll<MusicSettings>('musicsettings', {}, { limit: 100 });

    // Filter for enabled tracks with musicUrl field
    const enabledTracks = result.items?.filter(track => {
      const isEnabled = track.isEnabled === true;
      const hasMusicUrl = !!track.musicUrl;
      return isEnabled && hasMusicUrl;
    }) || [];

    console.log('[GET_MUSIC_SETTINGS] Successfully fetched music settings', {
      totalTracks: result.items?.length || 0,
      enabledTracks: enabledTracks.length,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: true,
        items: enabledTracks,
        totalCount: enabledTracks.length,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[GET_MUSIC_SETTINGS] Failed to fetch music settings', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch music settings',
        items: [],
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
