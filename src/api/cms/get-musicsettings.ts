import type { APIRoute } from 'astro';
import { cmsService } from '@/integrations/cms/service';
import type { MusicSettings } from '@/entities';

/** Public, minimal music feed used by the background player. */
export const GET: APIRoute = async () => {
  try {
    const result = await cmsService.getAll<MusicSettings>('musicsettings', {}, { limit: 50, suppressAuth: true });
    const items = (result.items || [])
      .filter((track) => track.isEnabled === true && typeof track.musicUrl === 'string' && track.musicUrl.length > 0)
      .map((track) => ({
        _id: track._id,
        musicTitle: track.musicTitle || '',
        musicUrl: track.musicUrl,
        artist: track.artist || '',
        album: track.album || '',
        genre: track.genre || '',
        duration: track.duration || '',
        isEnabled: true,
        isDefaultHomepageTrack: track.isDefaultHomepageTrack === true,
        loopMusic: track.loopMusic !== false,
        volume: Number.isFinite(Number(track.volume)) ? Math.max(0, Math.min(100, Number(track.volume))) : 50,
      }));

    return new Response(JSON.stringify({ success: true, items, totalCount: items.length }), {
      status: 200,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'public, max-age=30, s-maxage=30' },
    });
  } catch (error) {
    console.error('[GET_MUSICSETTINGS] Failed:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, error: 'Music is temporarily unavailable.', items: [] }), {
      status: 503,
      headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
    });
  }
};
