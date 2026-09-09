import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Trash2, Eye, X, AlertCircle, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { ContactSubmissions } from '@/entities';

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

export default function ContactManager() {
  const [submissions, setSubmissions] = useState<ContactSubmissions[]>([]);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'unread' | 'read'>('all');

  useEffect(() => {
    loadSubmissions();
  }, []);

  const loadSubmissions = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<ContactSubmissions>('contactsubmissions', {}, { limit: 100 });
      setSubmissions(result.items || []);
      console.log('[ContactManager] Loaded', result.items?.length || 0, 'submissions');
    } catch (error) {
      console.error('[ContactManager] Error loading submissions:', error);
      addStatusMessage('error', 'Failed to load contact submissions');
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

  const handleMarkAsRead = async (id: string) => {
    try {
      setIsSaving(true);
      await BaseCrudService.update<ContactSubmissions>('contactsubmissions', {
        _id: id,
        status: 'read',
      });
      addStatusMessage('success', 'Marked as read');
      await loadSubmissions();
    } catch (error) {
      console.error('[ContactManager] Error marking as read:', error);
      addStatusMessage('error', 'Failed to update status');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) return;

    try {
      setIsSaving(true);
      await BaseCrudService.delete('contactsubmissions', id);
      addStatusMessage('success', 'Submission deleted successfully');
      await loadSubmissions();
      setViewingId(null);
    } catch (error) {
      console.error('[ContactManager] Error deleting submission:', error);
      addStatusMessage('error', 'Failed to delete submission');
    } finally {
      setIsSaving(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    if (filterStatus === 'unread') return sub.status !== 'read';
    if (filterStatus === 'read') return sub.status === 'read';
    return true;
  });

  const unreadCount = submissions.filter(sub => sub.status !== 'read').length;

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
            msg.type === 'success' ? 'bg-ok/20 border-ok text-ok' :
            msg.type === 'error' ? 'bg-danger/20 border-danger text-danger' :
            msg.type === 'warning' ? 'bg-warn/20 border-warn text-warn' :
            'bg-blue-500/20 border-blue-500 text-blue-400'
          }`}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{msg.message}</p>
        </motion.div>
      ))}

      {/* Header with Stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Mail className="w-6 h-6 text-admin-text" />
          <div>
            <h2 className="text-lg font-semibold text-admin-text">Contact Submissions</h2>
            <p className="text-sm text-admin-dim">
              {unreadCount} unread • {submissions.length} total
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-admin-line">
        {(['all', 'unread', 'read'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-4 py-2 text-sm font-semibold border-b-2 transition-colors ${
              filterStatus === status
                ? 'border-oxblood text-admin-text'
                : 'border-transparent text-admin-dim hover:text-admin-text'
            }`}
          >
            {status === 'all' ? 'All' : status === 'unread' ? 'Unread' : 'Read'}
          </button>
        ))}
      </div>

      {/* Submissions List */}
      <div className="space-y-3">
        {filteredSubmissions.length === 0 ? (
          <p className="text-center text-admin-dim py-8">
            {filterStatus === 'unread' ? 'No unread submissions' : 'No submissions yet'}
          </p>
        ) : (
          filteredSubmissions.map(submission => (
            <motion.div
              key={submission._id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-lg border transition-colors ${
                submission.status === 'read'
                  ? 'bg-admin-surface border-admin-line'
                  : 'bg-admin-raise border-oxblood/30'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-admin-text truncate">{submission.name}</h4>
                    {submission.status !== 'read' && (
                      <span className="text-xs px-2 py-1 bg-oxblood/30 text-oxblood rounded">New</span>
                    )}
                  </div>
                  <p className="text-sm text-admin-dim truncate">{submission.email}</p>
                  <p className="text-sm font-semibold text-admin-text mt-1 truncate">{submission.subject}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    onClick={() => setViewingId(submission._id)}
                    disabled={isSaving}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </Button>
                  <Button
                    onClick={() => handleDelete(submission._id)}
                    disabled={isSaving}
                    size="sm"
                    variant="outline"
                    className="flex items-center gap-1 text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>

              {/* View Details Modal */}
              {viewingId === submission._id && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-admin-surface border border-admin-line rounded space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-semibold text-admin-text uppercase tracking-wider">Name</p>
                      <p className="text-sm text-admin-dim mt-1">{submission.name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-admin-text uppercase tracking-wider">Email</p>
                      <p className="text-sm text-admin-dim mt-1">
                        <a href={`mailto:${submission.email}`} className="text-blue-400 hover:underline">
                          {submission.email}
                        </a>
                      </p>
                    </div>
                    <div className="md:col-span-2">
                      <p className="text-xs font-semibold text-admin-text uppercase tracking-wider">Subject</p>
                      <p className="text-sm text-admin-dim mt-1">{submission.subject}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-admin-text uppercase tracking-wider mb-2">Message</p>
                    <div className="p-3 bg-admin-raise border border-admin-line rounded">
                      <p className="text-sm text-admin-dim whitespace-pre-wrap">{submission.message}</p>
                    </div>
                  </div>

                  {submission.submittedAt && (
                    <p className="text-xs text-admin-faint">
                      📅 Submitted: {new Date(submission.submittedAt).toLocaleString()}
                    </p>
                  )}

                  <div className="flex justify-between gap-3 pt-4 border-t border-admin-line">
                    {submission.status !== 'read' && (
                      <Button
                        onClick={() => handleMarkAsRead(submission._id)}
                        disabled={isSaving}
                        size="sm"
                        className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        Mark as Read
                      </Button>
                    )}
                    <Button
                      onClick={() => setViewingId(null)}
                      size="sm"
                      variant="outline"
                      className="flex-1"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Close
                    </Button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
