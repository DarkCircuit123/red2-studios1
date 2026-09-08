/** Public read-only booking availability endpoint. */
import { cmsService } from '@/integrations/cms/service';
import type { BookingAvailability } from '@/entities';

export async function GET() {
  try {
    const todayString = new Date().toISOString().slice(0, 10);
    const result = await cmsService.getAll<BookingAvailability>('bookingavailability', {}, { limit: 500, suppressAuth: true });
    const availableSlots = (result.items || [])
      .filter((slot) => slot.isAvailable === true && typeof slot.bookingDate === 'string' && slot.bookingDate >= todayString)
      .sort((a, b) => `${a.bookingDate || ''}T${a.startTime || ''}`.localeCompare(`${b.bookingDate || ''}T${b.startTime || ''}`))
      .map((slot) => ({ _id: slot._id, bookingDate: slot.bookingDate, startTime: slot.startTime, endTime: slot.endTime, duration: slot.duration, isAvailable: true }));

    return new Response(JSON.stringify({ success: true, data: availableSlots, totalCount: availableSlots.length, hasNext: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30, s-maxage=30' },
    });
  } catch (error) {
    console.error('[PUBLIC AVAILABILITY] Failed to fetch slots:', error instanceof Error ? error.message : String(error));
    return new Response(JSON.stringify({ success: false, data: [], error: 'Availability is temporarily unavailable', errorCode: 'AVAILABILITY_FETCH_ERROR' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
