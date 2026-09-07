/**
 * Utility to generate random booking dates for demonstration
 * Creates 10 random dates per month for the current and next 3 months
 */

import { BookingAvailability } from '@/entities/index';

export function generateRandomBookingDates(): BookingAvailability[] {
  const bookings: BookingAvailability[] = [];
  const today = new Date();
  
  // Format today as YYYY-MM-DD for comparison
  const todayStr = today.toISOString().split('T')[0];
  console.log(`[GenerateBookings] Today's date: ${todayStr}`);
  
  const sessionTypes = ['Portrait Session', 'Product Photography', 'Event Coverage', 'Headshots', 'Family Photos'];
  const timeSlots = [
    { start: '09:00', end: '10:00' },
    { start: '10:30', end: '11:30' },
    { start: '12:00', end: '13:00' },
    { start: '14:00', end: '15:00' },
    { start: '15:30', end: '16:30' },
    { start: '17:00', end: '18:00' },
  ];

  // Generate bookings for current month + next 3 months
  for (let monthOffset = 0; monthOffset < 4; monthOffset++) {
    const month = new Date(today.getFullYear(), today.getMonth() + monthOffset, 1);
    const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    
    console.log(`[GenerateBookings] Month offset ${monthOffset}: ${month.toISOString().split('T')[0]}, days in month: ${daysInMonth}`);
    
    // Generate 10 random dates for this month
    const randomDates = new Set<number>();
    while (randomDates.size < 10) {
      // For current month, start from today's date; for future months, start from day 1
      let minDay = 1;
      if (monthOffset === 0) {
        minDay = today.getDate();
      }
      
      const randomDay = Math.floor(Math.random() * (daysInMonth - minDay + 1)) + minDay;
      randomDates.add(randomDay);
    }

    randomDates.forEach((day) => {
      // Create date in local timezone (not UTC)
      const bookingDate = new Date(month.getFullYear(), month.getMonth(), day);
      
      // Format as YYYY-MM-DD using local timezone
      const year = bookingDate.getFullYear();
      const monthStr = String(bookingDate.getMonth() + 1).padStart(2, '0');
      const dayStr = String(bookingDate.getDate()).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      
      // Pick random time slot
      const timeSlot = timeSlots[Math.floor(Math.random() * timeSlots.length)];
      const sessionType = sessionTypes[Math.floor(Math.random() * sessionTypes.length)];

      const booking = {
        _id: `booking-${dateStr}-${Math.random().toString(36).substr(2, 9)}`,
        bookingDate: dateStr,
        startTime: timeSlot.start,
        endTime: timeSlot.end,
        isAvailable: true,
        sessionType: sessionType,
      };
      
      console.log(`[GenerateBookings] Generated booking: ${dateStr} ${timeSlot.start}-${timeSlot.end} (${sessionType})`);
      bookings.push(booking);
    });
  }

  console.log(`[GenerateBookings] Total bookings generated: ${bookings.length}`);
  return bookings;
}

export async function seedRandomBookings() {
  try {
    const { BaseCrudService } = await import('@/integrations');
    const bookings = generateRandomBookingDates();
    
    console.log(`[Seed] Creating ${bookings.length} random booking slots...`);
    
    for (const booking of bookings) {
      await BaseCrudService.create('bookingavailability', booking);
    }
    
    console.log(`[Seed] Successfully created ${bookings.length} booking slots`);
    return { success: true, count: bookings.length };
  } catch (error) {
    console.error('[Seed] Error creating booking slots:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
