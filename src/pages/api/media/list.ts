import type { APIRoute } from 'astro';
import { files } from '@wix/media';
import { auth } from '@wix/essentials';
import { requireAdmin } from '@/lib/auth-security';

export const GET: APIRoute = async ({ request, url, cookies }) => {
  try {
    // Verify admin authentication
    const denied = await requireAdmin(cookies, request, 'media-list');
    if (denied) return denied;
    const cursor = url.searchParams.get('cursor') || undefined;
    const query = url.searchParams.get('query') || '';

    console.log('[MEDIA_LIST] Fetching media files:', { cursor, query });

    // Use auth.elevate to call searchFiles with elevated permissions
    const elevatedSearch = auth.elevate(files.searchFiles);

    const searchOptions: any = {
      mediaTypes: ['IMAGE'],
      sort: { fieldName: 'updatedDate', order: 'DESC' },
      cursorPaging: { limit: 50 },
    };

    // Add cursor if provided
    if (cursor) {
      searchOptions.cursorPaging.cursor = cursor;
    }

    // Add query filter if provided
    if (query) {
      searchOptions.filter = {
        $text: { $search: query },
      };
    }

    const result = await elevatedSearch(searchOptions);

    console.log('[MEDIA_LIST] Search successful:', {
      itemCount: result.files?.length || 0,
      hasMore: !!result.pagingMetadata?.cursors?.next,
    });

    // Transform response to only include what UI needs
    const items = (result.files || []).map((file: any) => ({
      _id: file._id,
      displayName: file.displayName,
      url: file.url,
      thumbnailUrl: file.thumbnailUrl || file.url,
      sizeInBytes: file.sizeInBytes,
    }));

    return new Response(
      JSON.stringify({
        items,
        nextCursor: result.pagingMetadata?.cursors?.next || null,
        hasMore: !!result.pagingMetadata?.cursors?.next,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('[MEDIA_LIST] Error fetching media:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });

    return new Response(
      JSON.stringify({
        error: 'Failed to fetch media files',
        details: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
