/**
 * Sponsors Manager - Admin editor for sponsors collection
 * 
 * Features:
 * - Read/write clientspress collection (sponsors)
 * - Labeled inputs with placeholders
 * - Helper text for each field
 * - Add/edit/delete sponsors
 * - Dark theme applied
 */

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import {
  Plus, Trash2, Edit2, X, Check, AlertCircle
} from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { ClientsPress } from '@/entities';

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface EditingForm {
  clientName: string;
  clientLogo: string;
  externalLink: string;
  highlightDescription: string;
  dateOfFeature: string;
  category: string;
}

export default function SponsorsManager() {
  const [sponsors, setSponsors] = useState<ClientsPress[]>([]);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<EditingForm>({
    clientName: '',
    clientLogo: '',
    externalLink: '',
    highlightDescription: '',
    dateOfFeature: '',
    category: '',
  });

  useEffect(() => {
    loadSponsors();
  }, []);

  const loadSponsors = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<ClientsPress>('clientspress', {}, { limit: 100 });
      setSponsors(result.items || []);
      console.log('[SponsorsManager] Loaded', result.items?.length || 0, 'sponsors');
    } catch (error) {
      console.error('[SponsorsManager] Error loading sponsors:', error);
      addStatusMessage('error', 'Failed to load sponsors');
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
      clientLogo: '',
      externalLink: '',
      highlightDescription: '',
      dateOfFeature: new Date().toISOString().split('T')[0],
      category: '',
    });
  };

  const handleEdit = (sponsor: ClientsPress) => {
    setEditingId(sponsor._id);
    setEditingForm({
      clientName: sponsor.clientName || '',
      clientLogo: sponsor.clientLogo || '',
      externalLink: sponsor.externalLink || '',
      highlightDescription: sponsor.highlightDescription || '',
      dateOfFeature: sponsor.dateOfFeature 
        ? new Date(sponsor.dateOfFeature).toISOString().split('T')[0]
        : new Date().toISOString().split('T')[0],
      category: sponsor.category || '',
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingForm({
      clientName: '',
      clientLogo: '',
      externalLink: '',
      highlightDescription: '',
      dateOfFeature: '',
      category: '',
    });
  };

  const handleSave = async () => {
    if (!editingForm.clientName.trim()) {
      addStatusMessage('error', 'Client name is required');
      return;
    }

    try {
      setIsSaving(true);

      if (editingId === 'NEW') {
        // Create new sponsor
        const newSponsor: ClientsPress = {
          _id: crypto.randomUUID(),
          clientName: editingForm.clientName,
          clientLogo: editingForm.clientLogo || undefined,
          externalLink: editingForm.externalLink || undefined,
          highlightDescription: editingForm.highlightDescription || undefined,
          dateOfFeature: editingForm.dateOfFeature ? new Date(editingForm.dateOfFeature) : undefined,
          category: editingForm.category || undefined,
        };

        await BaseCrudService.create('clientspress', newSponsor);
        setSponsors(prev => [...prev, newSponsor]);
        addStatusMessage('success', `Sponsor "${editingForm.clientName}" added`);
      } else {
        // Update existing sponsor
        const updated: ClientsPress = {
          _id: editingId!,
          clientName: editingForm.clientName,
          clientLogo: editingForm.clientLogo || undefined,
          externalLink: editingForm.externalLink || undefined,
          highlightDescription: editingForm.highlightDescription || undefined,
          dateOfFeature: editingForm.dateOfFeature ? new Date(editingForm.dateOfFeature) : undefined,
          category: editingForm.category || undefined,
        };

        await BaseCrudService.update('clientspress', updated);
        setSponsors(prev => prev.map(s => s._id === editingId ? updated : s));
        addStatusMessage('success', `Sponsor "${editingForm.clientName}" updated`);
      }

      handleCancel();
    } catch (error) {
      console.error('[SponsorsManager] Save error:', error);
      addStatusMessage('error', `Failed to save sponsor: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (sponsorId: string, sponsorName: string) => {
    if (!confirm(`Delete sponsor "${sponsorName}"?`)) return;

    try {
      await BaseCrudService.delete('clientspress', sponsorId);
      setSponsors(prev => prev.filter(s => s._id !== sponsorId));
      addStatusMessage('success', `Sponsor "${sponsorName}" deleted`);
    } catch (error) {
      console.error('[SponsorsManager] Delete error:', error);
      addStatusMessage('error', 'Failed to delete sponsor');
    }
  };

  return (
    <div className="space-y-6">
      {/* Status Messages */}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-md">
        {statusMessages.map(msg => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className={`p-3 rounded-sm flex items-center gap-2 text-[13px] font-medium border transition-colors duration-160 ${
              msg.type === 'success' ? 'bg-admin-raise border-ok/30 text-ok' :
              msg.type === 'error' ? 'bg-admin-raise border-danger/30 text-danger' :
              msg.type === 'warning' ? 'bg-admin-raise border-warn/30 text-warn' :
              'bg-admin-raise border-admin-line text-admin-text'
            }`}
          >
            {msg.type === 'success' && <Check className="w-4 h-4" />}
            {msg.type === 'error' && <AlertCircle className="w-4 h-4" />}
            {msg.message}
          </motion.div>
        ))}
      </div>

      {/* Header */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
              Sponsors & Partners
            </h2>
            <p className="text-[13px] text-admin-dim mt-2">Manage client logos and featured partners</p>
          </div>
          <Button
            onClick={handleAddNew}
            disabled={editingId !== null}
            className="flex items-center gap-2 bg-oxblood hover:bg-oxblood/90 text-white rounded-none text-[11px] px-4 py-2 transition-colors duration-160 disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
            Add Sponsor
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      {editingId !== null && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-admin-raise rounded-none border border-admin-line p-6 space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text">
              {editingId === 'NEW' ? 'New Sponsor' : 'Edit Sponsor'}
            </h3>
            <button
              onClick={handleCancel}
              className="p-1 text-admin-dim hover:text-admin-text transition-colors duration-160"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Client Name */}
            <div>
              <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">
                Client Name *
              </label>
              <Input
                value={editingForm.clientName}
                onChange={(e) => setEditingForm(prev => ({ ...prev, clientName: e.target.value }))}
                placeholder="e.g., Acme Corporation"
                className="bg-admin-surface border-admin-line text-admin-text placeholder:text-admin-faint rounded-none"
              />
              <p className="text-[11px] text-admin-faint mt-1">The name of the sponsor or partner</p>
            </div>

            {/* Logo URL */}
            <div>
              <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">
                Logo URL
              </label>
              <Input
                value={editingForm.clientLogo}
                onChange={(e) => setEditingForm(prev => ({ ...prev, clientLogo: e.target.value }))}
                placeholder="https://example.com/logo.png"
                className="bg-admin-surface border-admin-line text-admin-text placeholder:text-admin-faint rounded-none"
              />
              <p className="text-[11px] text-admin-faint mt-1">URL to the sponsor's logo image</p>
            </div>

            {/* External Link */}
            <div>
              <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">
                Website URL
              </label>
              <Input
                value={editingForm.externalLink}
                onChange={(e) => setEditingForm(prev => ({ ...prev, externalLink: e.target.value }))}
                placeholder="https://example.com"
                className="bg-admin-surface border-admin-line text-admin-text placeholder:text-admin-faint rounded-none"
              />
              <p className="text-[11px] text-admin-faint mt-1">Link to the sponsor's website</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">
                Description
              </label>
              <Input
                value={editingForm.highlightDescription}
                onChange={(e) => setEditingForm(prev => ({ ...prev, highlightDescription: e.target.value }))}
                placeholder="Brief description of the partnership"
                className="bg-admin-surface border-admin-line text-admin-text placeholder:text-admin-faint rounded-none"
              />
              <p className="text-[11px] text-admin-faint mt-1">Short description of the sponsorship</p>
            </div>

            {/* Category */}
            <div>
              <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">
                Category
              </label>
              <Input
                value={editingForm.category}
                onChange={(e) => setEditingForm(prev => ({ ...prev, category: e.target.value }))}
                placeholder="e.g., Technology, Media, Finance"
                className="bg-admin-surface border-admin-line text-admin-text placeholder:text-admin-faint rounded-none"
              />
              <p className="text-[11px] text-admin-faint mt-1">Category or industry of the sponsor</p>
            </div>

            {/* Date */}
            <div>
              <label className="block text-[11px] font-heading uppercase tracking-[0.1em] text-admin-text mb-2">
                Date of Feature
              </label>
              <Input
                type="date"
                value={editingForm.dateOfFeature}
                onChange={(e) => setEditingForm(prev => ({ ...prev, dateOfFeature: e.target.value }))}
                className="bg-admin-surface border-admin-line text-admin-text rounded-none"
              />
              <p className="text-[11px] text-admin-faint mt-1">When this sponsor was featured</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-4 border-t border-admin-line">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 bg-oxblood hover:bg-oxblood/90 text-white rounded-none text-[11px] transition-colors duration-160 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <LoadingSpinner className="w-3 h-3 mr-2" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-3 h-3 mr-2" />
                  Save
                </>
              )}
            </Button>
            <Button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 bg-admin-line hover:bg-admin-line/60 text-admin-text rounded-none text-[11px] transition-colors duration-160"
            >
              Cancel
            </Button>
          </div>
        </motion.div>
      )}

      {/* Sponsors List */}
      <div className="bg-admin-surface rounded-none border border-admin-line p-6">
        <h3 className="font-heading text-[13px] uppercase tracking-[0.12em] text-admin-text mb-4">
          All Sponsors ({sponsors.length})
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner className="w-6 h-6" />
          </div>
        ) : sponsors.length === 0 ? (
          <p className="text-[13px] text-admin-dim text-center py-8">No sponsors yet. Add one to get started.</p>
        ) : (
          <div className="space-y-2">
            {sponsors.map((sponsor) => (
              <motion.div
                key={sponsor._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center justify-between p-3 rounded-none border border-admin-line bg-admin-raise hover:border-admin-line/60 transition-colors duration-160"
              >
                <div className="flex-1 min-w-0">
                  <p className="font-heading text-[13px] text-admin-text">
                    {sponsor.clientName}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    {sponsor.category && (
                      <span className="text-[11px] text-admin-dim bg-admin-surface px-2 py-1 rounded-none">
                        {sponsor.category}
                      </span>
                    )}
                    {sponsor.dateOfFeature && (
                      <span className="text-[11px] text-admin-faint">
                        {new Date(sponsor.dateOfFeature).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 ml-4">
                  <button
                    onClick={() => handleEdit(sponsor)}
                    disabled={editingId !== null}
                    className="p-2 bg-admin-line hover:bg-admin-line/60 text-admin-text rounded-none transition-colors duration-160 disabled:opacity-50"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(sponsor._id, sponsor.clientName || 'Sponsor')}
                    disabled={editingId !== null}
                    className="p-2 bg-admin-line hover:bg-danger/20 text-admin-text hover:text-danger rounded-none transition-colors duration-160 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
