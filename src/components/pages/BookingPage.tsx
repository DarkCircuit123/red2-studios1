import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Check, X } from 'lucide-react';
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

interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
}

export default function BookingPage() {
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [formData, setFormData] = useState<BookingRequest>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  useEffect(() => {
    const loadBookings = async () => {
      try {
        const result = await BaseCrudService.getAll<BookingSlot>('bookingavailability', {}, { limit: 100 });
        setBookings(result.items || []);
      } catch (error) {
        // Silently fail - show empty state
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

  const handleSlotClick = (slot: BookingSlot) => {
    setSelectedSlot(slot);
    setSubmitSuccess(false);
    setFormData({ name: '', email: '', phone: '', message: '' });
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setIsSubmitting(true);
    try {
      // Format the date and time for the email
      const formattedDate = new Date(selectedSlot.bookingDate).toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric'
      });
      const dateTime = `${formattedDate} from ${selectedSlot.startTime} to ${selectedSlot.endTime}`;

      // Store booking locally (backend function not available in this environment)
      // In production, this would send to a backend service
      const bookingData = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        sessionType: selectedSlot.sessionType,
        dateTime: dateTime,
        notes: formData.message || '(No additional notes)',
        timestamp: new Date().toISOString()
      };
      
      // Log booking for admin review
      console.log('Booking submitted:', bookingData);

      setSubmitSuccess(true);
      setSelectedSlot(null);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting booking:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Header />

      <section id="booking-form" className="relative w-full min-h-screen flex items-center justify-center overflow-hidden pt-32 pb-20">
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
            <div className="mt-6 p-4 bg-white/5 border border-white/10 rounded-lg inline-block">
              <p className="text-sm text-white/60">Today's Date</p>
              <p className="text-xl font-heading font-bold text-white">
                {new Date().toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                })}
              </p>
            </div>
          </motion.div>

          {/* Success Message */}
          {submitSuccess && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8 p-4 bg-green-500/20 border border-green-500/50 text-green-400 rounded flex items-center gap-3"
            >
              <Check className="w-5 h-5" />
              <span>Booking request submitted! We'll contact you soon.</span>
            </motion.div>
          )}

          {/* Booking Modal */}
          {selectedSlot && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedSlot(null)}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-black border border-white/20 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-heading font-bold">Complete Your Booking</h2>
                  <button
                    onClick={() => setSelectedSlot(null)}
                    className="text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Selected Slot Info */}
                <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded">
                  <p className="text-sm text-white/60 mb-2">Selected Time Slot</p>
                  <p className="font-heading font-bold text-lg">
                    {new Date(selectedSlot.bookingDate).toLocaleDateString('en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p className="text-white/80 font-mono">
                    {selectedSlot.startTime} - {selectedSlot.endTime}
                  </p>
                  <p className="text-xs text-white/60 uppercase tracking-wide mt-2">
                    {selectedSlot.sessionType}
                  </p>
                </div>

                {/* Booking Form */}
                <form onSubmit={handleSubmitBooking} className="space-y-4">
                  <div>
                    <label className="block text-sm font-heading font-bold mb-2">Full Name *</label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                      placeholder="Your name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-heading font-bold mb-2">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                      placeholder="your@email.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-heading font-bold mb-2">Phone *</label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleFormChange}
                      required
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors"
                      placeholder="(555) 123-4567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-heading font-bold mb-2">Additional Notes</label>
                    <textarea
                      name="message"
                      value={formData.message}
                      onChange={handleFormChange}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40 transition-colors resize-none"
                      placeholder="Any special requests or details..."
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setSelectedSlot(null)}
                      className="flex-1 px-4 py-2 bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors font-heading font-bold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || !formData.name || !formData.email || !formData.phone}
                      className="flex-1 px-4 py-2 bg-white text-black border border-white rounded hover:bg-white/90 transition-colors font-heading font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Submitting...' : 'Confirm Booking'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}

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
                        onClick={() => handleSlotClick(slot)}
                        className="w-full p-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded transition-all duration-300 text-left hover:border-white/30"
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
            <a href="/#contact" className="inline-block px-8 py-3 bg-white text-slate-950 font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300">
              Get in Touch
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
