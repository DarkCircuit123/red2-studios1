import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Mail, Phone, User, Trash2, Check } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';

interface Booking {
  _id: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  sessionType?: string;
  bookingDate?: string | Date;
  bookingTime?: any;
  clientMessage?: string;
  bookingStatus?: string;
  _createdDate?: Date;
}

export default function UpcomingBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed'>('all');

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll('bookings', {}, { limit: 100, suppressAuth: true });
      const allBookings = (result.items || []) as Booking[];
      
      // Sort by date (upcoming first)
      const sorted = allBookings.sort((a, b) => {
        const dateA = new Date(a.bookingDate || 0).getTime();
        const dateB = new Date(b.bookingDate || 0).getTime();
        return dateB - dateA;
      });
      
      setBookings(sorted);
    } catch (error) {
      console.error('Error loading bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteBooking = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      await adminCms.delete('bookings', id);
      setBookings(bookings.filter(b => b._id !== id));
    } catch (error) {
      console.error('Error deleting booking:', error);
      alert('Failed to delete booking');
    }
  };

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      await adminCms.update('bookings', {
        _id: id,
        bookingStatus: newStatus
      });

      setBookings(bookings.map(b => 
        b._id === id ? { ...b, bookingStatus: newStatus } : b
      ));
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  const filteredBookings = bookings.filter(b => {
    if (filter === 'pending') return b.bookingStatus === 'Pending' || !b.bookingStatus;
    if (filter === 'confirmed') return b.bookingStatus === 'Confirmed';
    return true;
  });

  const getStatusColor = (status?: string) => {
    if (status === 'Confirmed') return 'bg-green-500/20 text-green-400 border-green-500/50';
    if (status === 'Cancelled') return 'bg-red-500/20 text-red-400 border-red-500/50';
    return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
  };

  return (
    <div className="space-y-6">
      {/* Filter Tabs */}
      <div className="flex gap-2">
        {(['all', 'pending', 'confirmed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded font-heading font-bold text-sm uppercase tracking-wide transition-colors ${
              filter === f
                ? 'bg-white text-black'
                : 'bg-white/10 text-white border border-white/20 hover:bg-white/20'
            }`}
          >
            {f === 'all' ? 'All Bookings' : f === 'pending' ? 'Pending' : 'Confirmed'}
          </button>
        ))}
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      ) : filteredBookings.length === 0 ? (
        <div className="text-center py-12 text-white/60">
          <Calendar className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p>No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredBookings.map((booking, idx) => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-white/20 transition-colors"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Client Name</p>
                    <p className="text-lg font-heading font-bold flex items-center gap-2">
                      <User className="w-4 h-4 text-white/60" />
                      {booking.clientName || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Email</p>
                    <p className="text-sm font-mono flex items-center gap-2">
                      <Mail className="w-4 h-4 text-white/60" />
                      {booking.clientEmail || 'N/A'}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Phone</p>
                    <p className="text-sm font-mono flex items-center gap-2">
                      <Phone className="w-4 h-4 text-white/60" />
                      {booking.clientPhone || 'N/A'}
                    </p>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Session Type</p>
                    <p className="text-sm">{booking.sessionType || 'N/A'}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Date</p>
                      <p className="text-sm font-mono flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white/60" />
                        {booking.bookingDate 
                          ? new Date(booking.bookingDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                          : 'N/A'
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Time</p>
                      <p className="text-sm font-mono flex items-center gap-2">
                        <Clock className="w-4 h-4 text-white/60" />
                        {booking.bookingTime || 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-white/60 uppercase tracking-wide mb-1">Status</p>
                    <span className={`inline-block px-3 py-1 rounded text-xs font-heading font-bold border ${getStatusColor(booking.bookingStatus)}`}>
                      {booking.bookingStatus || 'Pending'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message */}
              {booking.clientMessage && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs text-white/60 uppercase tracking-wide mb-2">Message</p>
                  <p className="text-sm text-white/80">{booking.clientMessage}</p>
                </div>
              )}

              {/* Actions */}
              <div className="mt-4 pt-4 border-t border-white/10 flex gap-2">
                {booking.bookingStatus !== 'Confirmed' && (
                  <button
                    onClick={() => updateStatus(booking._id, 'Confirmed')}
                    className="flex-1 px-3 py-2 bg-green-500/20 text-green-400 border border-green-500/50 rounded hover:bg-green-500/30 transition-colors font-heading font-bold text-sm flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" />
                    Confirm
                  </button>
                )}
                <button
                  onClick={() => deleteBooking(booking._id)}
                  className="flex-1 px-3 py-2 bg-red-500/20 text-red-400 border border-red-500/50 rounded hover:bg-red-500/30 transition-colors font-heading font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
