/**
 * Backend endpoint for creating booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 * 
 * This endpoint is called from the frontend BookingManagerPro component
 * and uses backend-only APIs with elevated permissions to insert into
 * the bookingavailability collection.
 */

import { BookingAvailability } from '@/entities/index';

// Import Wix backend APIs - these run with elevated permissions
import wixData from 'wix-data';

export async function POST(request: Request) {
  try {
    console.log('[Backend] POST /api/booking-availability/create - Creating availability slot');
    
    const availability = await request.json() as BookingAvailability;
    console.log('[Backend] Received availability data:', JSON.stringify(availability, null, 2));

    // Validate required fields
    if (!availability.bookingDate) {
      console.error('[Backend] Missing bookingDate');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: bookingDate' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.startTime) {
      console.error('[Backend] Missing startTime');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: startTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!availability.endTime) {
      console.error('[Backend] Missing endTime');
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required field: endTime' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prepare the data for insertion - let Wix generate the _id
    const dataToInsert = {
      bookingDate: availability.bookingDate,
      startTime: availability.startTime,
      endTime: availability.endTime,
      isAvailable: availability.isAvailable !== false,
      sessionType: availability.sessionType || 'Session'
    };

    console.log('[Backend] Inserting data:', JSON.stringify(dataToInsert, null, 2));

    // Use wixData.insert with elevated permissions (backend-only)
    // Backend APIs automatically have elevated permissions - no need for suppressAuth
    // suppressAuth is for bypassing authentication, not permissions
    const result = await wixData.insert('bookingavailability', dataToInsert);

    console.log('[Backend] Successfully inserted availability slot:', JSON.stringify(result, null, 2));

    return new Response(
      JSON.stringify({
        success: true,
        data: result
      }),
      { status: 201, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[Backend] Error creating booking availability:', error);
    console.error('[Backend] Error details:', error instanceof Error ? error.message : 'Unknown error');
    console.error('[Backend] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
