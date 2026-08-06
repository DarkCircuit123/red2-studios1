import type { APIRoute } from 'astro';
import { mutate } from '@/api/cms/mutate';
import { readAdminToken, verifyAdminToken } from '@/lib/auth-security';

interface MutationRequest {
  action: 'create' | 'update' | 'delete';
  collectionId: string;
  itemData?: Record<string, any>;
  itemId?: string;
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // ADMIN GATE: Verify admin session before allowing mutations.
    // Try cookie, header, or Authorization bearer in that order
    const sessionToken = readAdminToken(cookies, request);
    const validation = sessionToken ? await verifyAdminToken(sessionToken) : null;

    if (!validation?.valid) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized: admin session required' }),
        {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const body: MutationRequest = await request.json();

    // Validate required fields
    if (!body.action || !body.collectionId) {
      return new Response(
        JSON.stringify({ error: 'Missing action or collectionId' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Call the server-side mutate function
    const result = await mutate(body);

    if (!result.success) {
      return new Response(JSON.stringify({ error: result.error }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
