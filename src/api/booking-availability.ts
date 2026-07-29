/**
 * Backend API for Booking Availability Management
 * Handles admin operations with elevated permissions
 * Bypasses frontend permission restrictions
 */

import { BookingAvailability, Bookings } from '@/entities/index';

/**
 * Fetch all booking availability slots
 * Admin-only operation with elevated permissions
 */
export async function getAvailability(): Promise<{
  success: boolean;
  data?: BookingAvailability[];
  error?: string;
}> {
  try {
    console.log('[Frontend] Fetching booking availability');

    const response = await fetch('/api/booking-availability/get-all', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[Frontend] Get availability response status:', response.status);

    let data;
    try {
      data = await response.json();
      console.log('[Frontend] Get availability response data:', data);
    } catch (parseError) {
      console.error('[Frontend] Failed to parse availability response as JSON:', parseError);
      const text = await response.text();
      console.error('[Frontend] Response text:', text);
      return {
        success: false,
        error: 'Server returned invalid JSON response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to fetch booking availability',
      };
    }

    return { success: data.success, data: data.data };
  } catch (error) {
    console.error('[Frontend] Error fetching booking availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch all bookings
 * Admin-only operation with elevated permissions
 */
export async function getBookings(): Promise<{
  success: boolean;
  data?: Bookings[];
  error?: string;
}> {
  try {
    console.log('[Frontend] Fetching bookings');

    const response = await fetch('/api/booking-availability/get-bookings', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[Frontend] Get bookings response status:', response.status);

    let data;
    try {
      data = await response.json();
      console.log('[Frontend] Get bookings response data:', data);
    } catch (parseError) {
      console.error('[Frontend] Failed to parse bookings response as JSON:', parseError);
      const text = await response.text();
      console.error('[Frontend] Response text:', text);
      return {
        success: false,
        error: 'Server returned invalid JSON response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to fetch bookings',
      };
    }

    return { success: data.success, data: data.data };
  } catch (error) {
    console.error('[Frontend] Error fetching bookings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Create a new booking availability slot
 * Admin-only operation with elevated permissions
 */
export async function createBookingAvailability(
  availability: BookingAvailability
): Promise<{ success: boolean; data?: BookingAvailability; error?: string }> {
  try {
    console.log('[Frontend] Creating booking availability:', availability);
    
    const response = await fetch('/api/booking-availability/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(availability),
    });

    console.log('[Frontend] Response status:', response.status);
    console.log('[Frontend] Response headers:', response.headers);

    // Try to parse as JSON
    let data;
    try {
      data = await response.json();
      console.log('[Frontend] Response data:', data);
    } catch (parseError) {
      console.error('[Frontend] Failed to parse response as JSON:', parseError);
      const text = await response.text();
      console.error('[Frontend] Response text:', text);
      return {
        success: false,
        error: 'Server returned invalid JSON response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to create booking availability',
      };
    }

    return { success: data.success, data: data.data };
  } catch (error) {
    console.error('[Frontend] Error creating booking availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Update a booking availability slot
 * Admin-only operation with elevated permissions
 */
export async function updateBookingAvailability(
  id: string,
  updates: Partial<BookingAvailability>
): Promise<{ success: boolean; data?: BookingAvailability; error?: string }> {
  try {
    console.log('[Frontend] Updating booking availability:', { id, ...updates });
    
    const response = await fetch('/api/booking-availability/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });

    console.log('[Frontend] Response status:', response.status);

    // Try to parse as JSON
    let data;
    try {
      data = await response.json();
      console.log('[Frontend] Response data:', data);
    } catch (parseError) {
      console.error('[Frontend] Failed to parse response as JSON:', parseError);
      const text = await response.text();
      console.error('[Frontend] Response text:', text);
      return {
        success: false,
        error: 'Server returned invalid JSON response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to update booking availability',
      };
    }

    return { success: data.success, data: data.data };
  } catch (error) {
    console.error('[Frontend] Error updating booking availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Delete a booking availability slot
 * Admin-only operation with elevated permissions
 */
export async function deleteBookingAvailability(
  id: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[Frontend] Deleting booking availability:', id);
    
    const response = await fetch('/api/booking-availability/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    console.log('[Frontend] Response status:', response.status);

    // Try to parse as JSON
    let data;
    try {
      data = await response.json();
      console.log('[Frontend] Response data:', data);
    } catch (parseError) {
      console.error('[Frontend] Failed to parse response as JSON:', parseError);
      const text = await response.text();
      console.error('[Frontend] Response text:', text);
      return {
        success: false,
        error: 'Server returned invalid JSON response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.message || data.error || 'Failed to delete booking availability',
      };
    }

    return { success: data.success };
  } catch (error) {
    console.error('[Frontend] Error deleting booking availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch public available booking slots
 * Public operation - no authentication required
 * Used by the public booking page
 */
export async function getPublicAvailability(): Promise<{
  success: boolean;
  data?: BookingAvailability[];
  error?: string;
}> {
  try {
    console.log('[Frontend] Fetching public available booking slots');

    const response = await fetch('/api/booking-availability/get-public', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('[Frontend] Get public availability response status:', response.status);

    let data;
    try {
      data = await response.json();
      console.log('[Frontend] Get public availability response data:', data);
    } catch (parseError) {
      console.error('[Frontend] Failed to parse public availability response as JSON:', parseError);
      const text = await response.text();
      console.error('[Frontend] Response text:', text);
      return {
        success: false,
        error: 'Server returned invalid JSON response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to fetch available slots',
      };
    }

    return { success: data.success, data: data.data };
  } catch (error) {
    console.error('[Frontend] Error fetching public available slots:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Submit a public booking
 * Creates a booking record and marks the availability slot as booked
 */
export async function submitPublicBooking(
  clientName: string,
  clientEmail: string,
  clientPhone: string,
  sessionType: string | undefined,
  bookingDate: string | Date | undefined,
  bookingTime: string | undefined,
  clientMessage: string,
  slotId: string
): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    console.log('[Frontend] Submitting public booking');

    const response = await fetch('/api/booking-availability/submit-booking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        clientName,
        clientEmail,
        clientPhone,
        sessionType,
        bookingDate,
        bookingTime,
        clientMessage,
        slotId
      }),
    });

    console.log('[Frontend] Submit booking response status:', response.status);

    let data;
    try {
      data = await response.json();
      console.log('[Frontend] Submit booking response data:', data);
    } catch (parseError) {
      console.error('[Frontend] Failed to parse submit booking response as JSON:', parseError);
      const text = await response.text();
      console.error('[Frontend] Response text:', text);
      return {
        success: false,
        error: 'Server returned invalid JSON response',
      };
    }

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Failed to submit booking',
      };
    }

    return { success: data.success, data: data.data };
  } catch (error) {
    console.error('[Frontend] Error submitting booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
