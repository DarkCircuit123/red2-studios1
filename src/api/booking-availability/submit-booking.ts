/**
 * Backend endpoint for submitting a public booking.
 * Validates the requested availability slot server-side before writing the booking.
 */

import { Bookings, BookingAvailability } from '@/entities/index';
import { BaseCrudService } from '@/integrations';
import { getTodayString, normalizeDateString } from '@/lib/date-formatter';

interface BookingSubmission {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  sessionType?: string;
  bookingDate?: string | Date;
  bookingTime?: string;
  clientMessage?: string;
  slotId: string;
}

const JSON_HEADERS = {
  'Content-Type': 'application/json',
  'Cache-Control': 'no-store',
};

function cleanString(value: unknown, maxLength: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maxLength) : '';
}

function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

function validTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [hour, minute] = value.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

export async function POST({ request }: { request: Request }) {
  const requestId = crypto.randomUUID();

  try {
    const contentLength = Number(request.headers.get('content-length') || 0);
    if (contentLength > 32_000) {
      return new Response(JSON.stringify({ success: false, error: 'Request is too large' }), {
        status: 413,
        headers: JSON_HEADERS,
      });
    }

    const body = await request.json() as Partial<BookingSubmission>;

    const clientName = cleanString(body.clientName, 120);
    const clientEmail = cleanString(body.clientEmail, 254).toLowerCase();
    const clientPhone = cleanString(body.clientPhone, 40);
    const sessionType = cleanString(body.sessionType, 120);
    const clientMessage = cleanString(body.clientMessage, 4000);
    const slotId = cleanString(body.slotId, 100);
    const bookingTime = cleanString(body.bookingTime, 5);

    if (!clientName || !clientEmail || !slotId) {
      return new Response(JSON.stringify({ success: false, error: 'Name, email, and booking slot are required' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    if (!validEmail(clientEmail)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid email address' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    if (bookingTime && !validTime(bookingTime)) {
      return new Response(JSON.stringify({ success: false, error: 'Invalid booking time' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    const requestedDate = body.bookingDate ? normalizeDateString(body.bookingDate) : '';
    if (requestedDate && requestedDate < getTodayString()) {
      return new Response(JSON.stringify({ success: false, error: 'Cannot book for past dates' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    // Read the slot first. Never trust the client-supplied date/time or status.
    const slot = await BaseCrudService.getById<BookingAvailability>('bookingavailability', slotId);
    if (!slot) {
      return new Response(JSON.stringify({ success: false, error: 'Booking slot not found' }), {
        status: 404,
        headers: JSON_HEADERS,
      });
    }

    if (slot.isAvailable !== true) {
      return new Response(JSON.stringify({ success: false, error: 'That booking slot is no longer available' }), {
        status: 409,
        headers: JSON_HEADERS,
      });
    }

    const slotDate = typeof slot.bookingDate === 'string' ? slot.bookingDate : normalizeDateString(slot.bookingDate);
    const slotTime = typeof slot.startTime === 'string' ? slot.startTime : '';

    if (requestedDate && requestedDate !== slotDate) {
      return new Response(JSON.stringify({ success: false, error: 'Booking date does not match the selected slot' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    if (bookingTime && slotTime && bookingTime !== slotTime) {
      return new Response(JSON.stringify({ success: false, error: 'Booking time does not match the selected slot' }), {
        status: 400,
        headers: JSON_HEADERS,
      });
    }

    if (slotDate < getTodayString()) {
      return new Response(JSON.stringify({ success: false, error: 'That booking slot has expired' }), {
        status: 409,
        headers: JSON_HEADERS,
      });
    }

    const booking: Bookings = {
      _id: crypto.randomUUID(),
      clientName,
      clientEmail,
      clientPhone,
      sessionType: sessionType || slot.sessionType || 'Session',
      bookingDate: body.bookingDate || slot.bookingDate,
      bookingTime: bookingTime || slot.startTime,
      clientMessage,
      bookingStatus: 'Pending',
    };

    // BaseCrudService is already server-side; its signatures do not accept
    // suppressAuth arguments. Authorization is handled by the endpoint boundary.
    const bookingResult = await BaseCrudService.create<Bookings>('bookings', booking);

    try {
      await BaseCrudService.update<BookingAvailability>('bookingavailability', {
        ...slot,
        _id: slotId,
        isAvailable: false,
      });
    } catch (slotUpdateError) {
      // Compensate for a partial write so a booking is not left without a
      // corresponding unavailable slot.
      try {
        await BaseCrudService.delete<Bookings>('bookings', bookingResult._id);
      } catch (rollbackError) {
        console.error(`[BOOKING:${requestId}] Rollback failed:`, rollbackError);
      }
      throw slotUpdateError;
    }

    console.log(`[BOOKING:${requestId}] Booking ${bookingResult._id} created for slot ${slotId}`);

    return new Response(JSON.stringify({ success: true, data: bookingResult }), {
      status: 201,
      headers: JSON_HEADERS,
    });
  } catch (error) {
    console.error(`[BOOKING:${requestId}] Failed:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to submit booking',
    }), {
      status: 500,
      headers: JSON_HEADERS,
    });
  }
}
