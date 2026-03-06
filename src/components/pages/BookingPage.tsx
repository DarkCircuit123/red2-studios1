import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Check } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

interface BookingSlot {
  _id: string;
  bookingDate: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  sessionType: string;
}

export default function BookingPage() {
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const result = await BaseCrudService.getAll<BookingSlot>('bookingavailability', {}, { limit: 100 });
        setBookings(result.items || []);
      } catch (error) {
        console.error('Error loading bookings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  const availableBookings = bookings.filter(b => b.isAvailable);
  const groupedByDate = availableBookings.reduce((acc, booking) => {
    const date = booking.bookingDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, BookingSlot[]>);

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
        <div className="max-w-[100rem] mx-auto px-8 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-16"
          >
            <h1 className="text-6xl md:text-7xl font-heading font-black text-white mb-4 uppercase">
              Book a Session
            </h1>
            <p className="text-lg text-white/60 max-w-2xl">
              Select your preferred date and time for your photography session.
            </p>
          </motion.div>

          {/* Booking Calendar */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : availableBookings.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-white/60">No available booking slots at the moment.</p>
              <p className="text-white/40 text-sm mt-2">Please check back soon or contact us directly.</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(groupedByDate).map(([date, slots], idx) => (
                <motion.div
                  key={date}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className="border border-white/10 rounded-lg p-6 hover:border-white/30 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-5 h-5 text-white/60" />
                    <h3 className="text-lg font-heading font-bold">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </h3>
                  </div>

                  <div className="space-y-3">
                    {slots.map((slot) => (
                      <button
                        key={slot._id}
                        className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all duration-300 text-left"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-white/40" />
                            <span className="text-sm font-mono">
                              {slot.startTime} - {slot.endTime}
                            </span>
                          </div>
                          <span className="text-xs text-white/50 uppercase tracking-wide">
                            {slot.sessionType}
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Contact CTA */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-20 text-center"
          >
            <p className="text-white/60 mb-6">
              Need a custom date or time? Contact us directly.
            </p>
            <a href="#contact" className="inline-block px-8 py-3 bg-white text-slate-950 font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300">
              Get in Touch
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
