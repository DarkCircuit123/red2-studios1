import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';

interface BehindTheScenesItem {
  _id: string;
  photo?: string;
  title?: string;
  description?: string;
  order?: number;
  dateTaken?: string;
}

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll<BehindTheScenesItem>('behindthescenes', {}, { limit: 100 });
    
    const items = result?.items || [];
    const sorted = items.sort((a, b) => (a.order || 0) - (b.order || 0));

    return new Response(
      JSON.stringify({
        success: true,
        items: sorted.slice(0, 3),
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[get-behind-scenes] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false, items: [] }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
