/**
 * Backend endpoint for fetching available booking slots (public).
 * Returns only future, available slots and never exposes admin operations.
 */

import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

export async function GET() {
  try {
    const todayString = new Date().toISOString().slice(0, 10);

    // BaseCrudService already runs server-side. Do not pass unsupported
    // suppressAuth options into its pagination API.
    const result = await BaseCrudService.getAll<BookingAvailability>(
      'bookingavailability',
      {},
      { limit: 500 }
    );

    const availableSlots = (result.items || [])
      .filter(
        slot =>
          slot.isAvailable === true &&
          typeof slot.bookingDate === 'string' &&
          slot.bookingDate >= todayString
      )
      .sort((a, b) => {
        const dateCompare = (a.bookingDate || '').localeCompare(b.bookingDate || '');
        return dateCompare !== 0
          ? dateCompare
          : (a.startTime || '').localeCompare(b.startTime || '');
      });

    return new Response(
      JSON.stringify({
        success: true,
        data: availableSlots,
        totalCount: availableSlots.length,
        hasNext: false,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=30, s-maxage=30',
        },
      }
    );
  } catch (error) {
    console.error('[PUBLIC AVAILABILITY] Failed to fetch slots:', error);

    return new Response(
      JSON.stringify({
        success: false,
        data: [],
        error: 'Availability is temporarily unavailable',
        errorCode: 'AVAILABILITY_FETCH_ERROR',
      }),
      {
        status: 503,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store',
        },
      }
    );
  }
}
