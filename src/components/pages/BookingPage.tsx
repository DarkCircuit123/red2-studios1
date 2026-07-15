import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Check, X, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import {
  processBookingSubmission,
  initializeEmailJS,
  setupPeriodicCleanup,
  reconcileBookings,
  isSlotLocked
} from '@/lib/booking-service';

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
  honeypot: string;
  agreedToPolicy: boolean;
}

interface SubmissionState {
  success: boolean;
  error: string | null;
  confirmationNumber: string | null;
}

export default function BookingPage() {
  const [bookings, setBookings] = useState<BookingSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<BookingSlot | null>(null);
  const [formData, setFormData] = useState<BookingRequest>({
    name: '',
    email: '',
    phone: '',
    message: '',
    honeypot: '',
    agreedToPolicy: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    success: false,
    error: null,
    confirmationNumber: null
  });
  const [pollingActive, setPollingActive] = useState(false);
  const sessionIdRef = useRef<string>(crypto.randomUUID());
  const focusTrapRef = useRef<HTMLDivElement>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize EmailJS and setup cleanup on mount
  useEffect(() => {
    initializeEmailJS();
    setupPeriodicCleanup();
    reconcileBookings();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  // Load bookings with 60-second polling
  useEffect(() => {
    const loadBookings = async () => {
      try {
        const result = await BaseCrudService.getAll<BookingSlot>('bookingavailability', {}, { limit: 100 });
        setBookings(result.items || []);
      } catch (error) {
        console.error('Error loading bookings:', error);
      }
    };

    loadBookings();

    // Setup 60-second polling
    if (!pollingIntervalRef.current) {
      pollingIntervalRef.current = setInterval(() => {
        if (pollingActive) {
          loadBookings();
        }
      }, 60000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [pollingActive]);

  // Focus trap for modal
  useEffect(() => {
    if (!selectedSlot || !focusTrapRef.current) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }

      // Tab trap
      if (e.key === 'Tab') {
        const focusableElements = focusTrapRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusableElements || focusableElements.length === 0) return;

        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedSlot]);

  const availableBookings = bookings.filter(b => b.isAvailable);
  const groupedByDate = availableBookings.reduce((acc, booking) => {
    const date = booking.bookingDate;
    if (!acc[date]) acc[date] = [];
    acc[date].push(booking);
    return acc;
  }, {} as Record<string, BookingSlot[]>);

  const closeModal = useCallback(() => {
    setSelectedSlot(null);
    setSubmissionState({ success: false, error: null, confirmationNumber: null });
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      honeypot: '',
      agreedToPolicy: false
    });
  }, []);

  const handleSlotClick = (slot: BookingSlot) => {
    if (isSlotLocked(slot._id)) {
      setSubmissionState({
        success: false,
        error: 'This slot was just booked. Please select another.',
        confirmationNumber: null
      });
      return;
    }

    setSelectedSlot(slot);
    setSubmissionState({ success: false, error: null, confirmationNumber: null });
    setFormData({
      name: '',
      email: '',
      phone: '',
      message: '',
      honeypot: '',
      agreedToPolicy: false
    });
    setPollingActive(true);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmitBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    // Validate honeypot (should be empty)
    if (formData.honeypot !== '') {
      console.warn('Honeypot field was filled - likely bot submission');
      return;
    }

    // Validate policy agreement
    if (!formData.agreedToPolicy) {
      setSubmissionState({
        success: false,
        error: 'You must agree to the booking policy to continue.',
        confirmationNumber: null
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await processBookingSubmission(
        {
          slotId: selectedSlot._id,
          clientName: formData.name,
          clientEmail: formData.email,
          clientPhone: formData.phone,
          sessionType: selectedSlot.sessionType,
          bookingDate: selectedSlot.bookingDate,
          startTime: selectedSlot.startTime,
          endTime: selectedSlot.endTime,
          notes: formData.message,
          honeypot: formData.honeypot,
          agreedToPolicy: formData.agreedToPolicy
        },
        sessionIdRef.current
      );

      if (result.success) {
        setSubmissionState({
          success: true,
          error: null,
          confirmationNumber: result.confirmationNumber || null
        });

        // Close modal after 3 seconds
        setTimeout(() => {
          closeModal();
          setPollingActive(false);
        }, 3000);
      } else {
        setSubmissionState({
          success: false,
          error: result.error || 'Failed to process booking',
          confirmationNumber: null
        });
      }
    } catch (error) {
      console.error('Error submitting booking:', error);
      setSubmissionState({
        success: false,
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
        confirmationNumber: null
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
              Select your preferred date and time for your photography session. All times are in Pacific Time (PT).
            </p>
          </motion.div>

          {/* Booking Modal with Focus Trap */}
          <AnimatePresence>
            {selectedSlot && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={closeModal}
              >
                <motion.div
                  ref={focusTrapRef}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-black border border-primary/30 rounded-lg p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="booking-modal-title"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 id="booking-modal-title" className="text-2xl font-heading font-bold">
                      Complete Your Booking
                    </h2>
                    <button
                      onClick={closeModal}
                      className="text-white/60 hover:text-white transition-colors"
                      aria-label="Close booking modal"
                    >
                      <X className="w-6 h-6" />
                    </button>
                  </div>

                  {/* Error Message */}
                  {submissionState.error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-red-500/20 border border-red-500/50 text-red-400 rounded flex items-start gap-3"
                    >
                      <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{submissionState.error}</span>
                    </motion.div>
                  )}

                  {/* Success Message */}
                  {submissionState.success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mb-6 p-4 bg-green-500/20 border border-green-500/50 text-green-400 rounded flex items-start gap-3"
                    >
                      <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold mb-1">Booking Confirmed!</p>
                        {submissionState.confirmationNumber && (
                          <p className="text-sm">Confirmation #: {submissionState.confirmationNumber}</p>
                        )}
                        <p className="text-sm mt-1">Check your email for details.</p>
                      </div>
                    </motion.div>
                  )}

                  {!submissionState.success && (
                    <>
                      {/* Selected Slot Info */}
                      <div className="mb-6 p-4 bg-white/5 border border-primary/20 rounded">
                        <p className="text-sm text-white/60 mb-2">Selected Time Slot</p>
                        <p className="font-heading font-bold text-lg">
                          {new Date(selectedSlot.bookingDate).toLocaleDateString('en-US', {
                            weekday: 'short',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                        <p className="text-white/80 font-mono">
                          {selectedSlot.startTime} - {selectedSlot.endTime} PT
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
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
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
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
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
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors"
                            placeholder="(555) 123-4567"
                          />
                        </div>

                        <div>
                          <label className="block text-sm font-heading font-bold mb-2">Additional Notes</label>
                          <textarea
                            name="message"
                            value={formData.message}
                            onChange={handleFormChange}
                            className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-primary/50 transition-colors resize-none"
                            placeholder="Any special requests or details..."
                            rows={3}
                          />
                        </div>

                        {/* Honeypot Field (hidden from users) */}
                        <input
                          type="text"
                          name="honeypot"
                          value={formData.honeypot}
                          onChange={handleFormChange}
                          style={{ display: 'none' }}
                          tabIndex={-1}
                          autoComplete="off"
                        />

                        {/* Policy Agreement */}
                        <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/10 rounded">
                          <input
                            type="checkbox"
                            id="policy"
                            name="agreedToPolicy"
                            checked={formData.agreedToPolicy}
                            onChange={handleFormChange}
                            className="mt-1 w-4 h-4 accent-primary cursor-pointer"
                          />
                          <label htmlFor="policy" className="text-xs text-white/70 cursor-pointer">
                            I agree to the booking policy and understand that cancellations must be made 48 hours in advance.
                          </label>
                        </div>

                        <div className="flex gap-3 pt-4">
                          <button
                            type="button"
                            onClick={closeModal}
                            disabled={isSubmitting}
                            className="flex-1 px-4 py-2 bg-white/10 text-white border border-white/20 rounded hover:bg-white/20 transition-colors font-heading font-bold disabled:opacity-50"
                          >
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={
                              isSubmitting ||
                              !formData.name ||
                              !formData.email ||
                              !formData.phone ||
                              !formData.agreedToPolicy
                            }
                            className="flex-1 px-4 py-2 bg-primary text-white border border-primary rounded hover:bg-primary/90 transition-colors font-heading font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isSubmitting ? 'Processing...' : 'Confirm Booking'}
                          </button>
                        </div>
                      </form>
                    </>
                  )}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
                  className="border border-white/10 rounded-lg p-6 hover:border-primary/30 transition-colors"
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
                    {slots.map((slot) => {
                      const isLocked = isSlotLocked(slot._id);
                      return (
                        <button
                          key={slot._id}
                          onClick={() => handleSlotClick(slot)}
                          disabled={isLocked}
                          className={`w-full p-3 bg-white/5 border border-white/10 rounded transition-all duration-300 text-left ${
                            isLocked
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-white/10 hover:border-primary/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4 text-white/40" />
                              <span className="text-sm font-mono">
                                {slot.startTime} - {slot.endTime} PT
                              </span>
                            </div>
                            <span className="text-xs text-white/50 uppercase tracking-wide">
                              {isLocked ? 'Locked' : slot.sessionType}
                            </span>
                          </div>
                        </button>
                      );
                    })}
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
            <a
              href="/#contact"
              className="inline-block px-8 py-3 bg-primary text-white font-heading font-bold text-sm tracking-widest uppercase hover:bg-primary/90 transition-all duration-300"
            >
              Get in Touch
            </a>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
