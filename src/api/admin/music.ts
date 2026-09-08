import type { APIRoute } from 'astro';
import { cmsService } from '@/integrations/cms/service';
import type { MusicSettings } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';

const MAX_BODY_BYTES = 32 * 1024;
const MAX_TRACKS = 100;
const options = { suppressAuth: true };
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const validId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 200;

export const GET: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'admin-music-read'); if (denied) return denied;
  try { const result = await cmsService.getAll<MusicSettings>('musicsettings', {}, { limit: MAX_TRACKS, suppressAuth: true }); return json({ success: true, items: result.items || [] }); }
  catch (error) { console.error('[ADMIN_MUSIC] Read failed:', error instanceof Error ? error.message : String(error)); return json({ success: false, error: 'Could not load the music library.' }, 500); }
};

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'admin-music-write'); if (denied) return denied;
  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0); if (contentLength > MAX_BODY_BYTES) return json({ success: false, error: 'Request is too large.' }, 413);
    const body = await context.request.json().catch(() => null) as { action?: unknown; track?: Partial<MusicSettings>; trackId?: unknown } | null;
    if (!body || typeof body.action !== 'string') return json({ success: false, error: 'Invalid music request.' }, 400);
    if (body.action === 'create') {
      if (!body.track || typeof body.track !== 'object') return json({ success: false, error: 'Track data is required.' }, 400);
      const current = await cmsService.getAll<MusicSettings>('musicsettings', {}, { limit: MAX_TRACKS, suppressAuth: true }); if ((current.items || []).length >= MAX_TRACKS) return json({ success: false, error: `Music library is limited to ${MAX_TRACKS} tracks.` }, 400);
      const track: MusicSettings = { _id: crypto.randomUUID(), musicTitle: typeof body.track.musicTitle === 'string' ? body.track.musicTitle.slice(0, 200) : 'Untitled Track', musicUrl: typeof body.track.musicUrl === 'string' ? body.track.musicUrl.slice(0, 4096) : '', artist: typeof body.track.artist === 'string' ? body.track.artist.slice(0, 200) : '', album: typeof body.track.album === 'string' ? body.track.album.slice(0, 200) : '', genre: typeof body.track.genre === 'string' ? body.track.genre.slice(0, 100) : '', duration: typeof body.track.duration === 'string' ? body.track.duration.slice(0, 32) : '', isEnabled: Boolean(body.track.isEnabled), isDefaultHomepageTrack: Boolean(body.track.isDefaultHomepageTrack), loopMusic: body.track.loopMusic !== false, volume: Number.isFinite(Number(body.track.volume)) ? Math.max(0, Math.min(100, Number(body.track.volume))) : 50 };
      if (!track.musicUrl) return json({ success: false, error: 'Track URL is required.' }, 400); await cmsService.create('musicsettings', track, undefined, options); return json({ success: true, item: track });
    }
    if (body.action === 'delete') { if (!validId(body.trackId)) return json({ success: false, error: 'Track ID is required.' }, 400); await cmsService.delete('musicsettings', body.trackId, options); return json({ success: true, deleted: true, trackId: body.trackId }); }
    if (body.action === 'update') {
      if (!validId(body.trackId) || !body.track || typeof body.track !== 'object') return json({ success: false, error: 'Track ID and data are required.' }, 400);
      const current = await cmsService.getById<MusicSettings>('musicsettings', body.trackId, undefined, options); if (!current) return json({ success: false, error: 'Track not found.' }, 404);
      const allowed: Partial<MusicSettings> = {}; for (const key of ['musicTitle','artist','album','genre','duration','musicUrl'] as const) { const value = body.track[key]; if (typeof value === 'string') (allowed as Record<string, unknown>)[key] = value.slice(0, key === 'musicUrl' ? 4096 : 200); }
      if (body.track.loopMusic !== undefined) allowed.loopMusic = Boolean(body.track.loopMusic); if (body.track.volume !== undefined && Number.isFinite(Number(body.track.volume))) allowed.volume = Math.max(0, Math.min(100, Number(body.track.volume))); if (body.track.isEnabled !== undefined) allowed.isEnabled = Boolean(body.track.isEnabled); if (body.track.isDefaultHomepageTrack !== undefined) allowed.isDefaultHomepageTrack = Boolean(body.track.isDefaultHomepageTrack);
      await cmsService.update('musicsettings', { _id: body.trackId, ...allowed }, options); return json({ success: true, track: { ...current, ...allowed, _id: body.trackId } });
    }
    if (body.action === 'set-active') {
      if (!validId(body.trackId)) return json({ success: false, error: 'Track ID is required.' }, 400); const result = await cmsService.getAll<MusicSettings>('musicsettings', {}, { limit: MAX_TRACKS, suppressAuth: true }); if (!result.items?.some((track) => track._id === body.trackId)) return json({ success: false, error: 'Track not found.' }, 404);
      for (const track of result.items || []) { const active = track._id === body.trackId; if (track.isEnabled !== active || track.isDefaultHomepageTrack !== active) await cmsService.update('musicsettings', { _id: track._id, isEnabled: active, isDefaultHomepageTrack: active }, options); } return json({ success: true, activeTrackId: body.trackId });
    }
    return json({ success: false, error: 'Unsupported music action.' }, 400);
  } catch (error) { console.error('[ADMIN_MUSIC] Write failed:', error instanceof Error ? error.message : String(error)); return json({ success: false, error: 'Music library operation failed.' }, 500); }
};
