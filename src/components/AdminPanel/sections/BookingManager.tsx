import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, Trash2, Edit2, X, Check, AlertCircle, Eye } from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Bookings } from '@/entities';

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface EditingForm {
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  sessionType: string;
  bookingDate: string;
  bookingTime: string;
  clientMessage: string;
  bookingStatus: string;
}

export default function BookingManager() {
  const [bookings, setBookings] = useState<Bookings[]>([]);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<EditingForm>({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    sessionType: '',
    bookingDate: '',
    bookingTime: '',
    clientMessage: '',
    bookingStatus: 'pending',
  });

  useEffect(() => {
    loadBookings();
  }, []);

  const loadBookings = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<Bookings>('bookings', {}, { limit: 100 });
      setBookings(result.items || []);
      console.log('[BookingManager] Loaded', result.items?.length || 0, 'bookings');
    } catch (error) {
      console.error('[BookingManager] Error loading bookings:', error);
      addStatusMessage('error', 'Failed to load bookings');
    } finally {
      setIsLoading(false);
    }
  };

  const addStatusMessage = (type: StatusMessage['type'], message: string) => {
    const id = crypto.randomUUID();
    setStatusMessages(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setStatusMessages(prev => prev.filter(m => m.id !== id));
    }, 5000);
  };

  const handleAddNew = () => {
    setEditingId('NEW');
    setEditingForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      sessionType: '',
      bookingDate: new Date().toISOString().split('T')[0],
      bookingTime: '10:00',
      clientMessage: '',
      bookingStatus: 'pending',
    });
  };

  const handleEdit = (booking: Bookings) => {
    setEditingId(booking._id);
    setEditingForm({
      clientName: booking.clientName || '',
      clientEmail: booking.clientEmail || '',
      clientPhone: booking.clientPhone || '',
      sessionType: booking.sessionType || '',
      bookingDate: booking.bookingDate 
        ? new Date(booking.bookingDate).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      bookingTime: booking.bookingTime || '10:00',
      clientMessage: booking.clientMessage || '',
      bookingStatus: booking.bookingStatus || 'pending',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setViewingId(null);
    setEditingForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      sessionType: '',
      bookingDate: '',
      bookingTime: '',
      clientMessage: '',
      bookingStatus: 'pending',
    });
  };

  const handleSave = async () => {
    if (!editingForm.clientName.trim() || !editingForm.clientEmail.trim()) {
      addStatusMessage('error', 'Client name and email are required');
      return;
    }

    try {
      setIsSaving(true);

      if (editingId === 'NEW') {
        await BaseCrudService.create('bookings', {
          _id: crypto.randomUUID(),
          clientName: editingForm.clientName,
          clientEmail: editingForm.clientEmail,
          clientPhone: editingForm.clientPhone,
          sessionType: editingForm.sessionType,
          bookingDate: editingForm.bookingDate,
          bookingTime: editingForm.bookingTime,
          clientMessage: editingForm.clientMessage,
          bookingStatus: editingForm.bookingStatus,
        });
        addStatusMessage('success', 'Booking created successfully');
      } else if (editingId) {
        await BaseCrudService.update<Bookings>('bookings', {
          _id: editingId,
          clientName: editingForm.clientName,
          clientEmail: editingForm.clientEmail,
          clientPhone: editingForm.clientPhone,
          sessionType: editingForm.sessionType,
          bookingDate: editingForm.bookingDate,
          bookingTime: editingForm.bookingTime,
          clientMessage: editingForm.clientMessage,
          bookingStatus: editingForm.bookingStatus,
        });
        addStatusMessage('success', 'Booking updated successfully');
      }

      await loadBookings();
      handleCancel();
    } catch (error) {
      console.error('[BookingManager] Error saving booking:', error);
      addStatusMessage('error', 'Failed to save booking');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this booking?')) return;

    try {
      setIsSaving(true);
      await BaseCrudService.delete('bookings', id);
      addStatusMessage('success', 'Booking deleted successfully');
      await loadBookings();
    } catch (error) {
      console.error('[BookingManager] Error deleting booking:', error);
      addStatusMessage('error', 'Failed to delete booking');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-900/30 text-green-400';
      case 'pending':
        return 'bg-yellow-900/30 text-yellow-400';
      case 'cancelled':
        return 'bg-red-900/30 text-red-400';
      default:
        return 'bg-gray-900/30 text-gray-400';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      {statusMessages.map(msg => (
        <motion.div
          key={msg.id}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className={`flex items-center gap-3 p-4 rounded-lg border ${
            msg.type === 'success' ? 'bg-green-50 border-green-200' :
            msg.type === 'error' ? 'bg-red-50 border-red-200' :
            msg.type === 'warning' ? 'bg-yellow-50 border-yellow-200' :
            'bg-blue-50 border-blue-200'
          }`}
        >
          <AlertCircle className={`w-5 h-5 ${
            msg.type === 'success' ? 'text-green-600' :
            msg.type === 'error' ? 'text-red-600' :
            msg.type === 'warning' ? 'text-yellow-600' :
            'text-blue-600'
          }`} />
          <p className={`text-sm ${
            msg.type === 'success' ? 'text-green-700' :
            msg.type === 'error' ? 'text-red-700' :
            msg.type === 'warning' ? 'text-yellow-700' :
            'text-blue-700'
          }`}>{msg.message}</p>
        </motion.div>
      ))}

      {/* Add New Button */}
      {editingId === null && (
        <Button
          onClick={handleAddNew}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
          Add New Booking
        </Button>
      )}

      {/* Edit Form */}
      {editingId !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-admin-surface border border-admin-line rounded-lg space-y-4"
        >
          <h3 className="text-lg font-semibold text-admin-text">
            {editingId === 'NEW' ? 'Add New Booking' : 'Edit Booking'}
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Client Name *
              </label>
              <Input
                value={editingForm.clientName}
                onChange={(e) => setEditingForm({ ...editingForm, clientName: e.target.value })}
                placeholder="Full name"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Email *
              </label>
              <Input
                type="email"
                value={editingForm.clientEmail}
                onChange={(e) => setEditingForm({ ...editingForm, clientEmail: e.target.value })}
                placeholder="email@example.com"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Phone
              </label>
              <Input
                value={editingForm.clientPhone}
                onChange={(e) => setEditingForm({ ...editingForm, clientPhone: e.target.value })}
                placeholder="+1 (555) 000-0000"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Session Type
              </label>
              <Input
                value={editingForm.sessionType}
                onChange={(e) => setEditingForm({ ...editingForm, sessionType: e.target.value })}
                placeholder="e.g., Portrait Session"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Booking Date
              </label>
              <Input
                type="date"
                value={editingForm.bookingDate}
                onChange={(e) => setEditingForm({ ...editingForm, bookingDate: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Booking Time
              </label>
              <Input
                type="time"
                value={editingForm.bookingTime}
                onChange={(e) => setEditingForm({ ...editingForm, bookingTime: e.target.value })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Status
              </label>
              <select
                value={editingForm.bookingStatus}
                onChange={(e) => setEditingForm({ ...editingForm, bookingStatus: e.target.value })}
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line rounded text-admin-text"
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-admin-text mb-2">
              Client Message
            </label>
            <Textarea
              value={editingForm.clientMessage}
              onChange={(e) => setEditingForm({ ...editingForm, clientMessage: e.target.value })}
              placeholder="Any special requests or notes..."
              className="w-full min-h-24"
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-admin-line">
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              variant="outline"
              className="flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Save Booking
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Bookings List */}
      <div className="space-y-3">
        {bookings.length === 0 ? (
          <p className="text-center text-admin-dim py-8">No bookings yet.</p>
        ) : (
          bookings.map(booking => (
            <motion.div
              key={booking._id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-admin-surface border border-admin-line rounded-lg"
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-admin-text truncate">{booking.clientName}</h4>
                  <p className="text-sm text-admin-dim truncate">{booking.clientEmail}</p>
                  <div className="flex items-center gap-2 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(booking.bookingStatus || 'pending')}`}>
                      {booking.bookingStatus || 'pending'}
                    </span>
                    {booking.sessionType && (
                      <span className="text-xs px-2 py-1 bg-blue-900/30 text-blue-400 rounded">
                        {booking.sessionType}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => setViewingId(booking._id)}
                    disabled={isSaving || editingId !== null}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleEdit(booking)}
                    disabled={isSaving || editingId !== null}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Edit2 className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    onClick={() => handleDelete(booking._id)}
                    disabled={isSaving || editingId !== null}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>

              {booking.bookingDate && (
                <p className="text-xs text-admin-faint">
                  📅 {new Date(booking.bookingDate).toLocaleDateString()} at {booking.bookingTime}
                </p>
              )}

              {/* View Details Modal */}
              {viewingId === booking._id && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-admin-raise border border-admin-line rounded space-y-2"
                >
                  {booking.clientMessage && (
                    <div>
                      <p className="text-xs font-semibold text-admin-text">Message:</p>
                      <p className="text-sm text-admin-dim whitespace-pre-wrap">{booking.clientMessage}</p>
                    </div>
                  )}
                  <Button
                    onClick={() => setViewingId(null)}
                    size="sm"
                    variant="outline"
                    className="w-full mt-2"
                  >
                    Close
                  </Button>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
