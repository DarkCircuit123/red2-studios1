/**
 * POST /api/booking-availability/create
 * 
 * Creates a new booking availability slot with production hardening:
 * - Duplicate slot protection (checks bookingDate + startTime + endTime)
 * - Server-side data normalization and validation
 * - Comprehensive logging for audit trail
 * 
 * Request Payload:
 * {
 *   bookingDate: string (YYYY-MM-DD format, required)
 *   startTime: string (HH:mm format, required)
 *   endTime: string (HH:mm format, required)
 *   sessionType: string (optional, trimmed, defaults to 'Session')
 *   isAvailable: boolean (optional, defaults to true)
 * }
 * 
 * Success Response (201):
 * {
 *   success: true,
 *   data: { _id: string, bookingDate, startTime, endTime, sessionType, isAvailable, _createdDate, _updatedDate }
 * }
 * 
 * Error Responses:
 * 400: Missing/invalid required fields
 * 409: Duplicate slot already exists
 * 500: Server error
 */

import { BookingAvailability } from '@/entities/index';
import wixData from 'wix-data';

// Validation helpers
function validateDateFormat(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date);
}

function validateTimeFormat(time: string): boolean {
  return /^\d{2}:\d{2}$/.test(time);
}

function isTimeAfter(startTime: string, endTime: string): boolean {
  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startTotalMin = startHour * 60 + startMin;
  const endTotalMin = endHour * 60 + endMin;
  return endTotalMin > startTotalMin;
}

async function checkDuplicateSlot(bookingDate: string, startTime: string, endTime: string): Promise<boolean> {
  try {
    const results = await wixData.query('bookingavailability')
      .eq('bookingDate', bookingDate)
      .eq('startTime', startTime)
      .eq('endTime', endTime)
      .find({ suppressAuth: true });
    return (results.items?.length || 0) > 0;
  } catch (error) {
    console.error('[Backend] Error checking for duplicate slot:', error);
    throw error;
  }
}

export async function POST(request: Request) {
  const startTime = new Date();
  const requestId = Math.random().toString(36).substring(7);
  
  try {
    console.log(`[CREATE:${requestId}] POST /api/booking-availability/create - Starting`);
    
    const availability = await request.json() as BookingAvailability;
    console.log(`[CREATE:${requestId}] Received payload:`, JSON.stringify(availability, null, 2));

    // Validate required fields exist
    if (!availability.bookingDate) {
      console.warn(`[CREATE:${requestId}] Validation failed: Missing bookingDate`);
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: bookingDate' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.startTime) {
      console.warn(`[CREATE:${requestId}] Validation failed: Missing startTime`);
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: startTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.endTime) {
      console.warn(`[CREATE:${requestId}] Validation failed: Missing endTime`);
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: endTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Normalize and validate data
    const bookingDate = availability.bookingDate.trim();
    const startTimeNorm = availability.startTime.trim();
    const endTimeNorm = availability.endTime.trim();
    const sessionType = (availability.sessionType || 'Session').trim();

    // Validate date format
    if (!validateDateFormat(bookingDate)) {
      console.warn(`[CREATE:${requestId}] Validation failed: Invalid bookingDate format (expected YYYY-MM-DD): ${bookingDate}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid bookingDate format. Expected YYYY-MM-DD' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate time formats
    if (!validateTimeFormat(startTimeNorm)) {
      console.warn(`[CREATE:${requestId}] Validation failed: Invalid startTime format (expected HH:mm): ${startTimeNorm}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid startTime format. Expected HH:mm' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!validateTimeFormat(endTimeNorm)) {
      console.warn(`[CREATE:${requestId}] Validation failed: Invalid endTime format (expected HH:mm): ${endTimeNorm}`);
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid endTime format. Expected HH:mm' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate endTime is after startTime
    if (!isTimeAfter(startTimeNorm, endTimeNorm)) {
      console.warn(`[CREATE:${requestId}] Validation failed: endTime (${endTimeNorm}) is not after startTime (${startTimeNorm})`);
      return new Response(
        JSON.stringify({ success: false, message: 'endTime must be after startTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Check for duplicate slot
    console.log(`[CREATE:${requestId}] Checking for duplicate slot: ${bookingDate} ${startTimeNorm}-${endTimeNorm}`);
    const isDuplicate = await checkDuplicateSlot(bookingDate, startTimeNorm, endTimeNorm);
    
    if (isDuplicate) {
      console.warn(`[CREATE:${requestId}] Duplicate slot detected: ${bookingDate} ${startTimeNorm}-${endTimeNorm}`);
      return new Response(
        JSON.stringify({ success: false, message: 'This availability slot already exists' }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare normalized data for insertion
    const dataToInsert = {
      bookingDate,
      startTime: startTimeNorm,
      endTime: endTimeNorm,
      isAvailable: availability.isAvailable !== false,
      sessionType
    };

    console.log(`[CREATE:${requestId}] Inserting normalized data:`, JSON.stringify(dataToInsert, null, 2));

    const result = await wixData.insert('bookingavailability', dataToInsert, { suppressAuth: true });

    const duration = new Date().getTime() - startTime.getTime();
    console.log(`[CREATE:${requestId}] ✓ Successfully created slot ${result._id} in ${duration}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    const duration = new Date().getTime() - startTime.getTime();
    console.error(`[CREATE:${requestId}] ✗ Failed after ${duration}ms:`, error);
    console.error(`[CREATE:${requestId}] Error details:`, error instanceof Error ? error.message : 'Unknown error');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
