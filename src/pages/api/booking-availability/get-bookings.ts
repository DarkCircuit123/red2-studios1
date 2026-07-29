/**
 * Backend endpoint for fetching all bookings
 * Uses elevated permissions to bypass frontend restrictions
 * Astro API Route Handler - BACKEND ONLY
 * 
 * CRITICAL: This uses wix-data (backend SDK) with suppressAuth: true
 * NOT BaseCrudService which uses @wix/data (frontend SDK)
 */

import { Bookings } from '@/entities/index';
import wixData from 'wix-data';

export async function GET(request: Request) {
  try {
    console.log('[Backend] Fetching all bookings');
    console.log('[Backend] Authenticated identity: Backend (Astro API route)');
    console.log('[Backend] Current permissions: ADMIN (backend-only)');
    console.log('[Backend] Using wix-data backend SDK with suppressAuth: true');

    // Fetch all bookings with elevated permissions
    // The backend service bypasses frontend permission checks
    const result = await wixData.query('bookings')
      .find({ suppressAuth: true });

    console.log('[Backend] Fetched bookings:', result.items?.length || 0);
    console.log('[Backend] Query result:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        data: result.items || [],
        totalCount: result.items?.length || 0,
        hasNext: false
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backend] Error fetching bookings:', error);
    console.error('[Backend] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[Backend] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch bookings'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
