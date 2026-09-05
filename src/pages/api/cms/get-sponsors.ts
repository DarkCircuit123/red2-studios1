import type { APIRoute } from 'astro';
import { BaseCrudService } from '@/integrations';
import { ClientsPress } from '@/entities/index';

export const GET: APIRoute = async () => {
  try {
    const result = await BaseCrudService.getAll<ClientsPress>('clientspress', {}, { limit: 50 });
    
    // Filter out empty/placeholder sponsors - only show those with BOTH clientName AND clientLogo
    // and exclude items with placeholder text like "Become a sponsor"
    const filledSponsors = (result?.items || []).filter(
      sponsor => {
        const hasName = sponsor.clientName && sponsor.clientName.trim().length > 0;
        const hasLogo = sponsor.clientLogo && sponsor.clientLogo.trim().length > 0;
        const isNotPlaceholder = !sponsor.clientName?.toLowerCase().includes('sponsor');
        return hasName && hasLogo && isNotPlaceholder;
      }
    );
    
    return new Response(
      JSON.stringify({
        success: true,
        items: filledSponsors,
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
