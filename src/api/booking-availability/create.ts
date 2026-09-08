/**
 * POST /api/booking-availability/create
 * Creates a new booking availability slot with server-side validation.
 */

import { BookingAvailability } from '@/entities/index';
import { BaseCrudService } from '@/integrations';
import { requireAdmin } from '@/lib/auth-security';

function validateDateFormat(date: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return false;
  const parsed = new Date(`${date}T00:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === date;
}

function validateTimeFormat(time: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(time)) return false;
  const [hour, minute] = time.split(':').map(Number);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function isTimeAfter(startTime: string, endTime: string): boolean {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  return endHour * 60 + endMin > startHour * 60 + startMin;
}

async function checkDuplicateSlot(
  bookingDate: string,
  startTime: string,
  endTime: string
): Promise<boolean> {
  const { items } = await BaseCrudService.getAll<BookingAvailability>(
    'bookingavailability',
    {},
    { limit: 1000 }
  );

  return items.some(
    item =>
      item.bookingDate === bookingDate &&
      item.startTime === startTime &&
      item.endTime === endTime
  );
}

export async function POST({ request, cookies }: { request: Request; cookies: any }) {
  const denied = await requireAdmin(cookies, request, 'create booking availability');
  if (denied) return denied;

  const requestId = crypto.randomUUID();

  try {
    const availability = await request.json() as BookingAvailability;

    if (!availability || typeof availability !== 'object') {
      return new Response(JSON.stringify({ success: false, message: 'Invalid request body' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (typeof availability.bookingDate !== 'string' || !availability.bookingDate.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required field: bookingDate' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (typeof availability.startTime !== 'string' || !availability.startTime.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required field: startTime' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (typeof availability.endTime !== 'string' || !availability.endTime.trim()) {
      return new Response(JSON.stringify({ success: false, message: 'Missing required field: endTime' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const bookingDate = availability.bookingDate.trim();
    const startTime = availability.startTime.trim();
    const endTime = availability.endTime.trim();
    const sessionType = typeof availability.sessionType === 'string' && availability.sessionType.trim()
      ? availability.sessionType.trim().slice(0, 120)
      : 'Session';

    if (!validateDateFormat(bookingDate)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid bookingDate format. Expected YYYY-MM-DD' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!validateTimeFormat(startTime)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid startTime format. Expected HH:mm' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!validateTimeFormat(endTime)) {
      return new Response(JSON.stringify({ success: false, message: 'Invalid endTime format. Expected HH:mm' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
    if (!isTimeAfter(startTime, endTime)) {
      return new Response(JSON.stringify({ success: false, message: 'endTime must be after startTime' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (await checkDuplicateSlot(bookingDate, startTime, endTime)) {
      return new Response(JSON.stringify({ success: false, message: 'This availability slot already exists' }), {
        status: 409,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const result = await BaseCrudService.create<BookingAvailability>('bookingavailability', {
      _id: crypto.randomUUID(),
      bookingDate,
      startTime,
      endTime,
      isAvailable: availability.isAvailable !== false,
      sessionType,
    });

    console.log(`[CREATE:${requestId}] Created booking availability ${result._id}`);

    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 201,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    console.error(`[CREATE:${requestId}] Failed:`, error);
    return new Response(JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create booking availability',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
}
