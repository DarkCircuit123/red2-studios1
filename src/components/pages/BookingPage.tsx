import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { BookingAvailability } from '@/entities/index';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { formatDateShort, normalizeDateString, formatDateForDisplay, getTodayString } from '@/lib/date-formatter';
import { getPublicAvailability, submitPublicBooking } from '@/api/booking-availability';

interface BookingRequest {
  name: string;
  email: string;
  phone: string;
  message: string;
}

interface Booking {
  _id: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  sessionType?: string;
  bookingDate?: string | Date;
  bookingTime?: string;
  clientMessage?: string;
  bookingStatus?: string;
}

export default function BookingPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState<BookingAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<BookingAvailability | null>(null);
  const [formData, setFormData] = useState<BookingRequest>({
    name: '',
    email: '',
    phone: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleGetInTouch = () => {
    navigate('/contact');
  };

  useEffect(() => {
    const loadBookings = async () => {
      try {
        // Use backend API to fetch public available slots
        const result = await getPublicAvailability();
        
        if (!result.success) {
          console.error('Error loading bookings:', result.error);
          setLoadError(result.error || 'Availability is temporarily unavailable');
          setBookings([]);
        } else {
          const allBookings = result.data || [];
          const today = getTodayString();
          
          // Filter for available bookings with valid dates/times and future dates only
          const validBookings = allBookings.filter(b => {
            // Check basic requirements
            if (b.isAvailable !== true || !b.bookingDate || !b.startTime || !b.endTime) {
              return false;
            }
            
            // Normalize the booking date to YYYY-MM-DD format
            const bookingDateStr = normalizeDateString(b.bookingDate);
            
            // Ensure the booking date is today or in the future
            if (!bookingDateStr || bookingDateStr < today) {
              console.warn('Filtering out past date:', bookingDateStr, 'today:', today);
              return false;
            }
            
            return true;
          });
          
          setBookings(validBookings);
          setLoadError(null);
        }
      } catch (error) {
        console.error('Error loading bookings:', error);
        setLoadError('Availability is temporarily unavailable');
        setBookings([]);
      } finally {
        setIsLoading(false);
      }
    };

    loadBookings();
  }, []);

  // Group bookings by date and sort by date
  const groupedByDate = bookings.reduce((acc, booking) => {
    const dateStr = normalizeDateString(booking.bookingDate);
    
    if (dateStr && !acc[dateStr]) acc[dateStr] = [];
    if (dateStr) acc[dateStr].push(booking);
    return acc;
  }, {} as Record<string, BookingAvailability[]>);

  // Sort dates chronologically
  const sortedDates = Object.keys(groupedByDate).sort();
  const sortedGroupedByDate = sortedDates.reduce((acc, date) => {
    acc[date] = groupedByDate[date].sort((a, b) => {
      const timeA = typeof a.startTime === 'string' ? a.startTime : '';
      const timeB = typeof b.startTime === 'string' ? b.startTime : '';
      return timeA.localeCompare(timeB);
    });
    return acc;
  }, {} as Record<string, BookingAvailability[]>);

  const handleSlotClick = (slot: BookingAvailability) => {
    try {
      setSelectedSlot(slot);
      setSubmitSuccess(false);
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch (error) {
      console.error('Error handling slot click:', error);
    }
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    try {
      const { name, value } = e.target;
      setFormData(prev => ({ ...prev, [name]: value }));
    } catch (error) {
      console.error('Error handling form change:', error);
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) {
      console.warn('No slot selected for booking');
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate form data
      if (!formData.name || !formData.email || !formData.phone) {
        alert('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Use backend API to submit booking with elevated permissions
      const result = await submitPublicBooking(
        formData.name,
        formData.email,
        formData.phone,
        selectedSlot.sessionType || '',
        selectedSlot.bookingDate,
        typeof selectedSlot.startTime === 'string' ? selectedSlot.startTime : '',
        formData.message,
        selectedSlot._id
      );

      if (!result.success) {
        console.error('Error submitting booking:', result.error);
        alert(`Failed to submit booking: ${result.error}`);
        setIsSubmitting(false);
        return;
      }

      // Update local state - remove booked slot
      setBookings(prevBookings => prevBookings.filter(b => b._id !== selectedSlot._id));

      setSubmitSuccess(true);
      setSelectedSlot(null);
      setFormData({ name: '', email: '', phone: '', message: '' });
      setTimeout(() => setSubmitSuccess(false), 5000);
    } catch (error) {
      console.error('Error submitting booking:', error);
      alert('Failed to submit booking. Please try again.');
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
                    {formatDateShort(selectedSlot.bookingDate || '')}
                  </p>
                  <p className="text-white/80 font-mono">
                    {typeof selectedSlot.startTime === 'string' ? selectedSlot.startTime : ''} - {typeof selectedSlot.endTime === 'string' ? selectedSlot.endTime : ''}
                  </p>
                  <p className="text-xs text-white/60 uppercase tracking-wide mt-2">
                    {selectedSlot.sessionType || 'Session'}
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
          ) : loadError ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <p className="text-white/60">{loadError}</p>
              <p className="text-white/40 text-sm mt-2">Please try again later or contact us directly.</p>
            </motion.div>
          ) : bookings.length === 0 ? (
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
              {Object.entries(sortedGroupedByDate).map(([date, slots], idx) => (
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
                      {formatDateShort(date)}
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
                              {typeof slot.startTime === 'string' ? slot.startTime : ''} - {typeof slot.endTime === 'string' ? slot.endTime : ''}
                            </span>
                          </div>
                          <span className="text-xs text-white/50 uppercase tracking-wide">
                            {slot.sessionType || 'Session'}
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
            <button onClick={handleGetInTouch} className="inline-block px-8 py-3 bg-white text-slate-950 font-heading font-bold text-sm tracking-widest uppercase hover:bg-white/90 transition-all duration-300">
              Get in Touch
            </button>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
