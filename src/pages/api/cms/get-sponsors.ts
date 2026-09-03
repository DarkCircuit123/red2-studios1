import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { ClientsPress } from '@/entities/index';

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll<ClientsPress>('clientspress', {}, { limit: 50 });
    
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
    console.error('[get-sponsors] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage, success: false, items: [] }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
