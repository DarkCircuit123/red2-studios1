import { BaseCrudService } from '@/integrations';

/**
 * Server-side gallery filtering endpoint
 * SECURITY: Filters galleries by client email on the server
 * This prevents exposing all galleries to the client
 */
export async function getClientGalleries(clientEmail: string, limit: number = 12, skip: number = 0) {
  try {
    // Validate email format
    if (!clientEmail || !clientEmail.includes('@')) {
      throw new Error('Invalid client email');
    }

    // Fetch all galleries (server-side filtering)
    const result = await BaseCrudService.getAll<any>(
      'clientgalleries',
      {},
      { limit: 100 } // Fetch more to filter server-side
    );

    const allGalleries = result.items || [];

    // Server-side filter: only return galleries matching the client email
    const clientGalleries = allGalleries.filter(
      (g) => g.clientEmail?.toLowerCase() === clientEmail.toLowerCase()
    );

    // Apply pagination
    const paginatedGalleries = clientGalleries.slice(skip, skip + limit);
    const hasNext = skip + limit < clientGalleries.length;

    return {
      items: paginatedGalleries,
      totalCount: clientGalleries.length,
      hasNext,
      currentPage: Math.floor(skip / limit),
      pageSize: limit,
      nextSkip: hasNext ? skip + limit : null,
    };
  } catch (error) {
    console.error('[ClientGalleries API] Error:', error);
    throw error;
  }
}
