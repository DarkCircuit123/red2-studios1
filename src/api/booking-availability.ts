/**
 * Backend API for Booking Availability Management
 * Handles admin operations with elevated permissions
 * Bypasses frontend permission restrictions
 */

import { BookingAvailability } from '@/entities/index';

/**
 * Create a new booking availability slot
 * Admin-only operation with elevated permissions
 */
export async function createBookingAvailability(
  availability: BookingAvailability
): Promise<{ success: boolean; data?: BookingAvailability; error?: string }> {
  try {
    const response = await fetch('/api/booking-availability/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(availability),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to create booking availability',
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error creating booking availability:', error);
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
    const response = await fetch('/api/booking-availability/update', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to update booking availability',
      };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (error) {
    console.error('Error updating booking availability:', error);
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
    const response = await fetch('/api/booking-availability/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });

    if (!response.ok) {
      const error = await response.json();
      return {
        success: false,
        error: error.message || 'Failed to delete booking availability',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Error deleting booking availability:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
