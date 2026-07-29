/**
 * Backend endpoint for fetching all booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * Astro API Route Handler - BACKEND ONLY
 * 
 * CRITICAL: This uses wix-data (backend SDK) with suppressAuth: true
 * NOT BaseCrudService which uses @wix/data (frontend SDK)
 */

import { BookingAvailability } from '@/entities/index';
import wixData from 'wix-data';

export async function GET(request: Request) {
  try {
    console.log('[Backend] Fetching all booking availability slots');
    console.log('[Backend] Authenticated identity: Backend (Astro API route)');
    console.log('[Backend] Current permissions: ADMIN (backend-only)');
    console.log('[Backend] Using wix-data backend SDK with suppressAuth: true');

    // Fetch all booking availability with elevated permissions
    // The backend service bypasses frontend permission checks
    const result = await wixData.query('bookingavailability')
      .find({ suppressAuth: true });

    console.log('[Backend] Fetched availability slots:', result.items?.length || 0);
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
    console.error('[Backend] Error fetching booking availability:', error);
    console.error('[Backend] Error type:', error instanceof Error ? error.constructor.name : typeof error);
    console.error('[Backend] Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
