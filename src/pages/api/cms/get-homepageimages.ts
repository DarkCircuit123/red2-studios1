import type { APIRoute } from 'astro';
import { auth } from '@wix/essentials';
import { items } from '@wix/data';
import { readAdminToken, verifyAdminToken } from '@/lib/auth-security';

export const GET: APIRoute = async ({ request, cookies }) => {
  try {
    // ADMIN GATE: Verify admin session before allowing read
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

    // Use elevated context to read homepageimages
    const elevatedQuery = auth.elevate(items.query);
    const result = await elevatedQuery('homepageimages').find();

    return new Response(
      JSON.stringify({
        success: true,
        items: result.items || [],
        totalCount: result.totalCount || 0,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[get-homepageimages] Error:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
