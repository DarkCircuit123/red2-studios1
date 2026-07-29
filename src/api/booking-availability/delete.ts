/**
 * Backend endpoint for deleting booking availability slots
 * Uses elevated permissions to bypass frontend restrictions
 */

import { BaseCrudService } from '@/integrations';

export async function DELETE(request: Request) {
  try {
    const body = await request.json() as { id: string };

    // Validate required fields
    if (!body.id) {
      return new Response(
        JSON.stringify({ message: 'Missing required field: id' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Delete the booking availability with elevated permissions
    await BaseCrudService.delete('bookingavailability', body.id);

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error deleting booking availability:', error);
    return new Response(
      JSON.stringify({
        message: error instanceof Error ? error.message : 'Failed to delete booking availability'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}
