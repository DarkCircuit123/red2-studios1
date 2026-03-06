/**
 * Booking notification service
 * Sends booking confirmation emails to admin via Wix triggered emails
 */

interface BookingData {
  name: string;
  email: string;
  phone: string;
  sessionType: string;
  dateTime: string;
  notes?: string;
}

/**
 * Sends a booking notification to the administrator
 * Uses Wix's triggered email system (wix-crm-backend)
 * 
 * @param data - Booking information to send
 * @returns Promise with email send result
 */
export async function notifyAdminOfBooking(data: BookingData) {
  try {
    // Call the backend function that uses wix-crm-backend triggered emails
    const response = await fetch('/_functions/notifyAdmin', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: data.name,
        email: data.email,
        phone: data.phone,
        sessionType: data.sessionType,
        dateTime: data.dateTime,
        notes: data.notes || '(No additional notes)'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send booking notification: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error notifying admin of booking:', error);
    throw error;
  }
}
