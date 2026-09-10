import type { APIRoute } from 'astro';
import { mutate } from '@/api/cms/mutate';
import type { MusicSettings } from '@/entities';
import { requireAdmin } from '@/lib/auth-security';
import { auth } from '@wix/essentials';
import { items } from '@wix/data';

const MAX_BODY_BYTES = 32 * 1024;
const MAX_TRACKS = 100;
const json = (body: Record<string, unknown>, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });
const validId = (value: unknown): value is string => typeof value === 'string' && value.length > 0 && value.length <= 200;

export const GET: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'admin-music-read');
  if (denied) return denied;
  try {
    console.log('[ADMIN_MUSIC] GET: Loading music library...');
    const elevatedGet = auth.elevate(items.query);
    const result = await elevatedGet('musicsettings').find();
    const musicItems = result.items || [];
    console.log('[ADMIN_MUSIC] GET: Successfully loaded', musicItems.length, 'tracks');
    return json({ success: true, items: musicItems });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[ADMIN_MUSIC] GET failed:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined,
    });
    return json({ success: false, error: 'Could not load the music library.' }, 500);
  }
};

export const POST: APIRoute = async (context) => {
  const denied = await requireAdmin(context.cookies, context.request, 'admin-music-write');
  if (denied) return denied;
  try {
    const contentLength = Number(context.request.headers.get('content-length') || 0);
    if (contentLength > MAX_BODY_BYTES) return json({ success: false, error: 'Request is too large.' }, 413);
    
    const body = await context.request.json().catch(() => null) as { action?: unknown; track?: Partial<MusicSettings>; trackId?: unknown } | null;
    if (!body || typeof body.action !== 'string') return json({ success: false, error: 'Invalid music request.' }, 400);

    if (body.action === 'create') {
      if (!body.track || typeof body.track !== 'object') return json({ success: false, error: 'Track data is required.' }, 400);
      
      // Check track count
      const elevatedQuery = auth.elevate(items.query);
      const currentResult = await elevatedQuery('musicsettings').find();
      if ((currentResult.items || []).length >= MAX_TRACKS) {
        return json({ success: false, error: `Music library is limited to ${MAX_TRACKS} tracks.` }, 400);
      }
      
      const track: MusicSettings = {
        _id: crypto.randomUUID(),
        musicTitle: typeof body.track.musicTitle === 'string' ? body.track.musicTitle.slice(0, 200) : 'Untitled Track',
        musicUrl: typeof body.track.musicUrl === 'string' ? body.track.musicUrl.slice(0, 4096) : '',
        artist: typeof body.track.artist === 'string' ? body.track.artist.slice(0, 200) : '',
        album: typeof body.track.album === 'string' ? body.track.album.slice(0, 200) : '',
        genre: typeof body.track.genre === 'string' ? body.track.genre.slice(0, 100) : '',
        duration: typeof body.track.duration === 'string' ? body.track.duration.slice(0, 32) : '',
        isEnabled: Boolean(body.track.isEnabled),
        isDefaultHomepageTrack: Boolean(body.track.isDefaultHomepageTrack),
        loopMusic: body.track.loopMusic !== false,
        volume: Number.isFinite(Number(body.track.volume)) ? Math.max(0, Math.min(100, Number(body.track.volume))) : 50,
      };
      
      if (!track.musicUrl) return json({ success: false, error: 'Track URL is required.' }, 400);
      
      console.log('[ADMIN_MUSIC] POST create: Creating track', {
        _id: track._id,
        musicTitle: track.musicTitle,
        musicUrl: track.musicUrl?.substring(0, 50),
      });
      
      try {
        const elevatedInsert = auth.elevate(items.insert);
        const created = await elevatedInsert('musicsettings', track);
        console.log('[ADMIN_MUSIC] POST create: Successfully created track', { _id: created._id });
        return json({ success: true, item: created });
      } catch (createError) {
        const errorMessage = createError instanceof Error ? createError.message : String(createError);
        console.error('[ADMIN_MUSIC] POST create: Error:', {
          message: errorMessage,
          stack: createError instanceof Error ? createError.stack : undefined,
          track: track,
        });
        throw createError;
      }
    }

    if (body.action === 'delete') {
      if (!validId(body.trackId)) return json({ success: false, error: 'Track ID is required.' }, 400);
      
      console.log('[ADMIN_MUSIC] POST delete: Deleting track', { trackId: body.trackId });
      
      try {
        const elevatedRemove = auth.elevate(items.remove);
        await elevatedRemove('musicsettings', body.trackId);
        console.log('[ADMIN_MUSIC] POST delete: Successfully deleted track', { trackId: body.trackId });
        return json({ success: true, deleted: true, trackId: body.trackId });
      } catch (deleteError) {
        const errorMessage = deleteError instanceof Error ? deleteError.message : String(deleteError);
        console.error('[ADMIN_MUSIC] POST delete: Error:', {
          message: errorMessage,
          trackId: body.trackId,
        });
        throw deleteError;
      }
    }

    if (body.action === 'update') {
      if (!validId(body.trackId) || !body.track || typeof body.track !== 'object') {
        return json({ success: false, error: 'Track ID and data are required.' }, 400);
      }
      
      console.log('[ADMIN_MUSIC] POST update: Updating track', { trackId: body.trackId });
      
      try {
        const elevatedGet = auth.elevate(items.get);
        const current = await elevatedGet('musicsettings', body.trackId);
        if (!current) return json({ success: false, error: 'Track not found.' }, 404);
        
        const allowed: Partial<MusicSettings> = {};
        for (const key of ['musicTitle', 'artist', 'album', 'genre', 'duration', 'musicUrl'] as const) {
          const value = body.track[key];
          if (typeof value === 'string') (allowed as Record<string, unknown>)[key] = value.slice(0, key === 'musicUrl' ? 4096 : 200);
        }
        if (body.track.loopMusic !== undefined) allowed.loopMusic = Boolean(body.track.loopMusic);
        if (body.track.volume !== undefined && Number.isFinite(Number(body.track.volume))) {
          allowed.volume = Math.max(0, Math.min(100, Number(body.track.volume)));
        }
        if (body.track.isEnabled !== undefined) allowed.isEnabled = Boolean(body.track.isEnabled);
        if (body.track.isDefaultHomepageTrack !== undefined) allowed.isDefaultHomepageTrack = Boolean(body.track.isDefaultHomepageTrack);
        
        const merged = { ...current, ...allowed, _id: body.trackId };
        const elevatedUpdate = auth.elevate(items.update);
        const updated = await elevatedUpdate('musicsettings', merged);
        console.log('[ADMIN_MUSIC] POST update: Successfully updated track', { _id: updated._id });
        return json({ success: true, track: updated });
      } catch (updateError) {
        const errorMessage = updateError instanceof Error ? updateError.message : String(updateError);
        console.error('[ADMIN_MUSIC] POST update: Error:', {
          message: errorMessage,
          trackId: body.trackId,
        });
        throw updateError;
      }
    }

    if (body.action === 'set-active') {
      if (!validId(body.trackId)) return json({ success: false, error: 'Track ID is required.' }, 400);
      
      console.log('[ADMIN_MUSIC] POST set-active: Setting active track', { trackId: body.trackId });
      
      try {
        const elevatedQuery = auth.elevate(items.query);
        const result = await elevatedQuery('musicsettings').find();
        if (!result.items?.some((track) => track._id === body.trackId)) {
          return json({ success: false, error: 'Track not found.' }, 404);
        }
        
        const elevatedUpdate = auth.elevate(items.update);
        for (const track of result.items || []) {
          const active = track._id === body.trackId;
          if (track.isEnabled !== active || track.isDefaultHomepageTrack !== active) {
            const merged = { ...track, isEnabled: active, isDefaultHomepageTrack: active, _id: track._id };
            await elevatedUpdate('musicsettings', merged);
            console.log('[ADMIN_MUSIC] POST set-active: Updated track', { _id: track._id, active });
          }
        }
        console.log('[ADMIN_MUSIC] POST set-active: Successfully set active track', { trackId: body.trackId });
        return json({ success: true, activeTrackId: body.trackId });
      } catch (setActiveError) {
        const errorMessage = setActiveError instanceof Error ? setActiveError.message : String(setActiveError);
        console.error('[ADMIN_MUSIC] POST set-active: Error:', {
          message: errorMessage,
          trackId: body.trackId,
        });
        throw setActiveError;
      }
    }

    return json({ success: false, error: 'Unsupported music action.' }, 400);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error('[ADMIN_MUSIC] POST failed:', {
      message: errorMessage,
      stack: errorStack,
      type: error instanceof Error ? error.constructor.name : typeof error,
    });
    return json({ success: false, error: 'Music library operation failed.' }, 500);
  }
};
