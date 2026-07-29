import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Clock, Plus, Trash2, X, AlertCircle, CheckCircle, AlertTriangle } from 'lucide-react';
import { BookingAvailability, Bookings } from '@/entities/index';
import { 
  getAvailability, 
  getBookings, 
  createBookingAvailability, 
  updateBookingAvailability, 
  deleteBookingAvailability 
} from '@/api/booking-availability';
import { getTodayString, formatDateToString, formatDateForDisplay, normalizeDateString } from '@/lib/date-formatter';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning';
  message: string;
}

export default function BookingManagerPro() {
  const [availabilities, setAvailabilities] = useState<BookingAvailability[]>([]);
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(getTodayString());
  const [showAddModal, setShowAddModal] = useState(false);
  const [newSlot, setNewSlot] = useState<TimeSlot>({ startTime: '09:00', endTime: '10:00' });
  const [sessionType, setSessionType] = useState('Studio Session');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Fetch availability and bookings using backend API with elevated permissions
      const [availResult, bookingResult] = await Promise.all([
        getAvailability(),
        getBookings()
      ]);

      // Check for errors
      if (!availResult.success) {
        console.error('Error fetching availability:', availResult.error);
        addNotification('error', `Failed to load availability: ${availResult.error}`);
        setAvailabilities([]);
      } else {
        setAvailabilities(availResult.data || []);
      }

      if (!bookingResult.success) {
        console.error('Error fetching bookings:', bookingResult.error);
        addNotification('error', `Failed to load bookings: ${bookingResult.error}`);
        setBookings([]);
      } else {
        setBookings(bookingResult.data || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      addNotification('error', `Failed to load booking data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addNotification = (type: 'success' | 'error' | 'warning', message: string) => {
    const id = crypto.randomUUID();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const validateTimeSlot = (): boolean => {
    if (!newSlot.startTime || !newSlot.endTime) {
      addNotification('warning', 'Please fill in both start and end times');
      return false;
    }

    if (newSlot.startTime >= newSlot.endTime) {
      addNotification('warning', 'End time must be after start time');
      return false;
    }

    // Check for overlapping slots
    const dateSlots = availabilities.filter(a => {
      const aDate = normalizeDateString(a.bookingDate);
      return aDate === selectedDate;
    });

    const hasOverlap = dateSlots.some(slot => {
      const slotStart = typeof slot.startTime === 'string' ? slot.startTime : '';
      const slotEnd = typeof slot.endTime === 'string' ? slot.endTime : '';
      
      return (newSlot.startTime < slotEnd && newSlot.endTime > slotStart);
    });

    if (hasOverlap) {
      addNotification('warning', 'This time slot overlaps with an existing slot');
      return false;
    }

    return true;
  };

  const addTimeSlot = async () => {
    if (!validateTimeSlot()) return;

    setIsSubmitting(true);
    try {
      console.log('[BookingManagerPro] Creating time slot with data:', {
        selectedDate,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        sessionType
      });

      const availability: BookingAvailability = {
        _id: crypto.randomUUID(),
        bookingDate: selectedDate,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        isAvailable: true,
        sessionType: sessionType
      };

      console.log('[BookingManagerPro] Availability object:', JSON.stringify(availability, null, 2));

      // Use backend API with elevated permissions
      const result = await createBookingAvailability(availability);
      
      console.log('[BookingManagerPro] Create result:', JSON.stringify(result, null, 2));
      
      if (!result.success) {
        console.error('[BookingManagerPro] Failed to create availability:', result.error);
        addNotification('error', `Failed to add time slot: ${result.error}`);
        return;
      }
      
      console.log('[BookingManagerPro] Successfully created time slot');
      setAvailabilities([...availabilities, availability]);
      setNewSlot({ startTime: '09:00', endTime: '10:00' });
      setSessionType('Studio Session');
      setShowAddModal(false);
      addNotification('success', `Time slot added: ${newSlot.startTime} - ${newSlot.endTime}`);
    } catch (error) {
      console.error('[BookingManagerPro] Error adding time slot:', error);
      console.error('[BookingManagerPro] Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      addNotification('error', `Failed to add time slot: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return;

    try {
      // Use backend API with elevated permissions
      const result = await deleteBookingAvailability(id);
      
      if (!result.success) {
        addNotification('error', `Failed to delete time slot: ${result.error}`);
        return;
      }
      
      setAvailabilities(availabilities.filter(a => a._id !== id));
      addNotification('success', 'Time slot deleted successfully');
    } catch (error) {
      console.error('Error deleting time slot:', error);
      addNotification('error', 'Failed to delete time slot');
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      // Use backend API with elevated permissions
      const result = await updateBookingAvailability(id, {
        isAvailable: !currentStatus
      });

      if (!result.success) {
        addNotification('error', `Failed to update slot status: ${result.error}`);
        return;
      }

      setAvailabilities(availabilities.map(a => 
        a._id === id ? { ...a, isAvailable: !currentStatus } : a
      ));
      addNotification('success', `Slot marked as ${!currentStatus ? 'available' : 'blocked'}`);
    } catch (error) {
      console.error('Error updating availability:', error);
      addNotification('error', 'Failed to update slot status');
    }
  };

  const getDateSlots = () => {
    return availabilities.filter(a => {
      const aDate = normalizeDateString(a.bookingDate);
      return aDate === selectedDate;
    }).sort((a, b) => {
      const timeA = typeof a.startTime === 'string' ? a.startTime : '';
      const timeB = typeof b.startTime === 'string' ? b.startTime : '';
      return timeA.localeCompare(timeB);
    });
  };

  const getUpcomingBookings = () => {
    const today = getTodayString();
    return bookings
      .filter(b => {
        const bDate = normalizeDateString(b.bookingDate);
        return bDate >= today;
      })
      .sort((a, b) => {
        const dateA = normalizeDateString(a.bookingDate);
        const dateB = normalizeDateString(b.bookingDate);
        return dateA.localeCompare(dateB);
      })
      .slice(0, 5);
  };

  const getStatusBadge = (isAvailable?: boolean) => {
    if (isAvailable === true) {
      return { bg: 'bg-green-500/20', border: 'border-green-500/50', text: 'text-green-300', label: 'AVAILABLE' };
    }
    return { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-300', label: 'BLOCKED' };
  };

  const minDate = getTodayString();
  const dateSlots = getDateSlots();
  const upcomingBookings = getUpcomingBookings();

  return (
    <div className="space-y-6">
      {/* Notifications */}
      <AnimatePresence>
        {notifications.map(notif => (
          <motion.div
            key={notif.id}
            initial={{ opacity: 0, y: -20, x: 20 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 20 }}
            className={`p-4 rounded-lg border flex items-start gap-3 ${
              notif.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-300'
                : notif.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-300'
                : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300'
            }`}
          >
            {notif.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {notif.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {notif.type === 'warning' && <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            <span className="text-sm">{notif.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-white/60 uppercase tracking-wide mb-2">Total Slots</p>
          <p className="text-3xl font-heading font-bold text-white">{availabilities.length}</p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-white/60 uppercase tracking-wide mb-2">Available</p>
          <p className="text-3xl font-heading font-bold text-green-400">{availabilities.filter(a => a.isAvailable === true).length}</p>
        </div>
        <div className="bg-black/40 border border-white/10 rounded-lg p-4">
          <p className="text-xs text-white/60 uppercase tracking-wide mb-2">Bookings</p>
          <p className="text-3xl font-heading font-bold text-red-400">{bookings.length}</p>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="bg-black/40 border border-white/10 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-heading font-bold text-white flex items-center gap-2">
            <Calendar className="w-5 h-5 text-red-500" />
            Availability Manager
          </h3>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded text-sm font-heading font-bold uppercase tracking-wide transition-colors flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Slot
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-xs text-white/60 uppercase tracking-wide mb-3">Select Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            min={minDate}
            className="w-full px-4 py-3 bg-white/5 border border-white/20 rounded text-white focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-colors"
          />
        </div>

        {/* Time Slots for Selected Date */}
        <div>
          <h4 className="text-sm font-heading font-bold text-white mb-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-white/60" />
            {formatDateForDisplay(selectedDate)}
          </h4>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          ) : dateSlots.length === 0 ? (
            <div className="text-center py-8 text-white/60">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No time slots for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dateSlots.map((slot) => {
                const status = getStatusBadge(slot.isAvailable);
                return (
                  <motion.div
                    key={slot._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded hover:border-white/20 transition-colors"
                  >
                    <div className="flex-1">
                      <p className="font-mono text-sm text-white">
                        {typeof slot.startTime === 'string' ? slot.startTime : ''} - {typeof slot.endTime === 'string' ? slot.endTime : ''}
                      </p>
                      <p className="text-xs text-white/60 uppercase tracking-wide mt-1">
                        {slot.sessionType || 'Session'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => toggleAvailability(slot._id, slot.isAvailable === true)}
                        className={`px-3 py-1 rounded text-xs font-heading font-bold border transition-colors ${status.bg} ${status.border} ${status.text} hover:opacity-80`}
                      >
                        {status.label}
                      </button>

                      <button
                        onClick={() => deleteSlot(slot._id)}
                        className="p-2 text-white/60 hover:text-red-400 hover:bg-red-500/10 rounded transition-colors"
                        title="Delete slot"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <div className="bg-black/40 border border-white/10 rounded-lg p-6">
          <h3 className="text-lg font-heading font-bold text-white mb-4">Upcoming Bookings</h3>
          <div className="space-y-3">
            {upcomingBookings.map((booking) => (
              <motion.div
                key={booking._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white/5 border border-white/10 rounded hover:border-white/20 transition-colors"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Client</p>
                    <p className="text-sm font-heading font-bold text-white">{booking.clientName || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Session</p>
                    <p className="text-sm text-white/80">{booking.sessionType || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Date & Time</p>
                    <p className="text-sm font-mono text-white/80">
                      {booking.bookingDate 
                        ? new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : 'N/A'
                      } at {booking.bookingTime || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Status</p>
                    <span className={`inline-block px-2 py-1 rounded text-xs font-heading font-bold border ${
                      booking.bookingStatus === 'Confirmed'
                        ? 'bg-green-500/20 border-green-500/50 text-green-300'
                        : 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
                    }`}>
                      {booking.bookingStatus || 'Pending'}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Add Time Slot Modal */}
      <AnimatePresence>
        {showAddModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAddModal(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-black border border-white/20 rounded-lg p-6 z-50"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-heading font-bold text-white">Add Time Slot</h3>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="p-1 hover:bg-white/10 rounded transition-colors"
                >
                  <X className="w-5 h-5 text-white/60" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm text-white/60 uppercase tracking-wide mb-2">Date</p>
                  <p className="text-lg font-heading font-bold text-white">
                    {formatDateForDisplay(selectedDate)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-heading font-bold text-white mb-2">Session Type</label>
                  <input
                    type="text"
                    value={sessionType}
                    onChange={(e) => setSessionType(e.target.value)}
                    className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-colors"
                    placeholder="e.g., Studio Session"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading font-bold text-white mb-2">Start Time</label>
                    <input
                      type="time"
                      value={newSlot.startTime}
                      onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-heading font-bold text-white mb-2">End Time</label>
                    <input
                      type="time"
                      value={newSlot.endTime}
                      onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                      className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white focus:outline-none focus:border-red-500/50 focus:bg-white/10 transition-colors"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="flex-1 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded text-sm font-heading font-bold uppercase tracking-wide transition-colors border border-white/20"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addTimeSlot}
                    disabled={isSubmitting}
                    className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded text-sm font-heading font-bold uppercase tracking-wide transition-colors"
                  >
                    {isSubmitting ? 'Adding...' : 'Add Slot'}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
