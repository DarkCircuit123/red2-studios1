import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Clock, Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { BookingAvailability } from '@/entities/index';

interface TimeSlot {
  startTime: string;
  endTime: string;
}

export default function BookingManager() {
  const [availabilities, setAvailabilities] = useState<BookingAvailability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [newSlot, setNewSlot] = useState<TimeSlot>({ startTime: '09:00', endTime: '10:00' });
  const [sessionType, setSessionType] = useState('Studio Session');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Load availabilities
  useEffect(() => {
    loadAvailabilities();
  }, []);

  // Update time slots when date changes
  useEffect(() => {
    const dateSlots = availabilities.filter(a => {
      const aDate = typeof a.bookingDate === 'string' 
        ? a.bookingDate 
        : a.bookingDate instanceof Date 
          ? a.bookingDate.toISOString().split('T')[0]
          : '';
      return aDate === selectedDate;
    });
    
    setTimeSlots(dateSlots.map(a => ({
      startTime: typeof a.startTime === 'string' ? a.startTime : '',
      endTime: typeof a.endTime === 'string' ? a.endTime : ''
    })));
  }, [selectedDate, availabilities]);

  const loadAvailabilities = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<BookingAvailability>('bookingavailability', {}, { limit: 500 });
      setAvailabilities(result.items || []);
    } catch (error) {
      console.error('Error loading availabilities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTimeSlot = async () => {
    if (!newSlot.startTime || !newSlot.endTime) {
      alert('Please fill in both start and end times');
      return;
    }

    try {
      const availability: BookingAvailability = {
        _id: crypto.randomUUID(),
        bookingDate: selectedDate,
        startTime: newSlot.startTime,
        endTime: newSlot.endTime,
        isAvailable: true,
        sessionType: sessionType
      };

      await BaseCrudService.create('bookingavailability', availability);
      
      setAvailabilities([...availabilities, availability]);
      setNewSlot({ startTime: '09:00', endTime: '10:00' });
      setSuccessMessage('Time slot added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error adding time slot:', error);
      alert('Failed to add time slot');
    }
  };

  const deleteSlot = async (id: string) => {
    if (!confirm('Are you sure you want to delete this time slot?')) return;

    try {
      await BaseCrudService.delete('bookingavailability', id);
      setAvailabilities(availabilities.filter(a => a._id !== id));
      setSuccessMessage('Time slot deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting time slot:', error);
      alert('Failed to delete time slot');
    }
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    try {
      await BaseCrudService.update('bookingavailability', {
        _id: id,
        isAvailable: !currentStatus
      });

      setAvailabilities(availabilities.map(a => 
        a._id === id ? { ...a, isAvailable: !currentStatus } : a
      ));
      setSuccessMessage(`Slot marked as ${!currentStatus ? 'available' : 'unavailable'}!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating availability:', error);
      alert('Failed to update availability');
    }
  };

  const getDateSlots = () => {
    return availabilities.filter(a => {
      const aDate = typeof a.bookingDate === 'string' 
        ? a.bookingDate 
        : a.bookingDate instanceof Date 
          ? a.bookingDate.toISOString().split('T')[0]
          : '';
      return aDate === selectedDate;
    }).sort((a, b) => {
      const timeA = typeof a.startTime === 'string' ? a.startTime : '';
      const timeB = typeof b.startTime === 'string' ? b.startTime : '';
      return timeA.localeCompare(timeB);
    });
  };

  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-4 bg-green-500/20 border border-green-500/50 text-green-400 rounded flex items-center gap-3"
        >
          <Check className="w-5 h-5" />
          <span>{successMessage}</span>
        </motion.div>
      )}

      {/* Date Selector */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Select Date
        </h3>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          min={minDate}
          className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-white/40"
        />
      </div>

      {/* Add Time Slot */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5" />
          Add Time Slot
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-heading font-bold mb-2">Session Type</label>
            <input
              type="text"
              value={sessionType}
              onChange={(e) => setSessionType(e.target.value)}
              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white placeholder-white/40 focus:outline-none focus:border-white/40"
              placeholder="e.g., Studio Session"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-heading font-bold mb-2">Start Time</label>
              <input
                type="time"
                value={newSlot.startTime}
                onChange={(e) => setNewSlot({ ...newSlot, startTime: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-white/40"
              />
            </div>
            <div>
              <label className="block text-sm font-heading font-bold mb-2">End Time</label>
              <input
                type="time"
                value={newSlot.endTime}
                onChange={(e) => setNewSlot({ ...newSlot, endTime: e.target.value })}
                className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded text-white focus:outline-none focus:border-white/40"
              />
            </div>
          </div>

          <button
            onClick={addTimeSlot}
            className="w-full px-4 py-2 bg-white text-black font-heading font-bold rounded hover:bg-white/90 transition-colors"
          >
            Add Time Slot
          </button>
        </div>
      </div>

      {/* Current Time Slots */}
      <div className="bg-white/5 border border-white/10 rounded-lg p-6">
        <h3 className="text-lg font-heading font-bold mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Time Slots for {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        ) : getDateSlots().length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No time slots for this date. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {getDateSlots().map((slot) => (
              <motion.div
                key={slot._id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-4 bg-white/10 border border-white/20 rounded hover:border-white/30 transition-colors"
              >
                <div className="flex-1">
                  <p className="font-mono text-sm">
                    {typeof slot.startTime === 'string' ? slot.startTime : ''} - {typeof slot.endTime === 'string' ? slot.endTime : ''}
                  </p>
                  <p className="text-xs text-white/60 uppercase tracking-wide mt-1">
                    {slot.sessionType || 'Session'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleAvailability(slot._id, slot.isAvailable === true)}
                    className={`px-3 py-1 rounded text-xs font-heading font-bold transition-colors ${
                      slot.isAvailable === true
                        ? 'bg-green-500/20 text-green-400 border border-green-500/50 hover:bg-green-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/50 hover:bg-red-500/30'
                    }`}
                  >
                    {slot.isAvailable === true ? 'Available' : 'Blocked'}
                  </button>

                  <button
                    onClick={() => deleteSlot(slot._id)}
                    className="p-2 text-white/60 hover:text-red-400 transition-colors hover:bg-red-500/10 rounded"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-2xl font-heading font-bold">{availabilities.length}</p>
          <p className="text-xs text-white/60 uppercase tracking-wide mt-1">Total Slots</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-2xl font-heading font-bold">{availabilities.filter(a => a.isAvailable === true).length}</p>
          <p className="text-xs text-white/60 uppercase tracking-wide mt-1">Available</p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-lg p-4 text-center">
          <p className="text-2xl font-heading font-bold">{availabilities.filter(a => a.isAvailable === false).length}</p>
          <p className="text-xs text-white/60 uppercase tracking-wide mt-1">Blocked</p>
        </div>
      </div>
    </div>
  );
}
