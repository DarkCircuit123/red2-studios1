/**
 * GET /api/booking-availability
 * 
 * Fetches all booking availability slots with pagination support.
 * Uses elevated permissions to bypass frontend restrictions.
 * 
 * Query Parameters:
 * - limit: number (optional, default 500, max 500)
 * - skip: number (optional, default 0)
 * 
 * Success Response (200):
 * {
 *   success: true,
 *   data: BookingAvailability[],
 *   totalCount: number,
 *   hasNext: boolean
 * }
 * 
 * Error Response (500):
 * {
 *   success: false,
 *   error: string
 * }
 */

import wixData from 'wix-data';
import { BookingAvailability } from '@/entities/index';

export async function GET(request: Request) {
  const startTime = new Date();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[GET_ALL:${requestId}] GET /api/booking-availability - Starting`);

    // Parse query parameters
    const url = new URL(request.url);
    const limit = Math.min(parseInt(url.searchParams.get('limit') || '500'), 500);
    const skip = parseInt(url.searchParams.get('skip') || '0');

    console.log(`[GET_ALL:${requestId}] Query params: limit=${limit}, skip=${skip}`);

    // Query with elevated permissions
    const results = await wixData.query('bookingavailability')
      .limit(limit)
      .skip(skip)
      .find({ suppressAuth: true });

    const duration = new Date().getTime() - startTime.getTime();
    console.log(`[GET_ALL:${requestId}] ✓ Fetched ${results.items?.length || 0} slots (total: ${results.totalCount}) in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: results.items || [],
        totalCount: results.totalCount || 0,
        hasNext: results.hasNext || false
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = new Date().getTime() - startTime.getTime();
    console.error(`[GET_ALL:${requestId}] ✗ Failed after ${duration}ms:`, error);
    console.error(`[GET_ALL:${requestId}] Error details:`, error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
