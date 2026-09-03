import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { BlogPosts } from '@/entities/index';

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll<BlogPosts>('blogposts', {}, { limit: 6 });
    
    return new Response(
      JSON.stringify({
        success: true,
        items: result?.items || [],
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[get-blog-posts] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false, items: [] }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
