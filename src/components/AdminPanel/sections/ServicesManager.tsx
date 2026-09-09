import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Plus, Trash2, Edit2, X, Check, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { BaseCrudService } from '@/integrations';
import { Services } from '@/entities';

interface StatusMessage {
  id: string;
  type: 'info' | 'success' | 'error' | 'warning';
  message: string;
}

interface EditingForm {
  serviceName: string;
  shortDescription: string;
  fullDescription: string;
  pricingDetails: string;
  slug: string;
  isAvailable: boolean;
}

export default function ServicesManager() {
  const [services, setServices] = useState<Services[]>([]);
  const [statusMessages, setStatusMessages] = useState<StatusMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingForm, setEditingForm] = useState<EditingForm>({
    serviceName: '',
    shortDescription: '',
    fullDescription: '',
    pricingDetails: '',
    slug: '',
    isAvailable: true,
  });

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<Services>('services', {}, { limit: 100 });
      setServices(result.items || []);
      console.log('[ServicesManager] Loaded', result.items?.length || 0, 'services');
    } catch (error) {
      console.error('[ServicesManager] Error loading services:', error);
      addStatusMessage('error', 'Failed to load services');
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
      serviceName: '',
      shortDescription: '',
      fullDescription: '',
      pricingDetails: '',
      slug: '',
      isAvailable: true,
    });
  };

  const handleEdit = (service: Services) => {
    setEditingId(service._id);
    setEditingForm({
      serviceName: service.serviceName || '',
      shortDescription: service.shortDescription || '',
      fullDescription: service.fullDescription || '',
      pricingDetails: service.pricingDetails || '',
      slug: service.slug || '',
      isAvailable: service.isAvailable ?? true,
    });
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingForm({
      serviceName: '',
      shortDescription: '',
      fullDescription: '',
      pricingDetails: '',
      slug: '',
      isAvailable: true,
    });
  };

  const handleSave = async () => {
    if (!editingForm.serviceName.trim()) {
      addStatusMessage('error', 'Service name is required');
      return;
    }

    try {
      setIsSaving(true);

      if (editingId === 'NEW') {
        await BaseCrudService.create('services', {
          _id: crypto.randomUUID(),
          serviceName: editingForm.serviceName,
          shortDescription: editingForm.shortDescription,
          fullDescription: editingForm.fullDescription,
          pricingDetails: editingForm.pricingDetails,
          slug: editingForm.slug,
          isAvailable: editingForm.isAvailable,
        });
        addStatusMessage('success', 'Service created successfully');
      } else if (editingId) {
        await BaseCrudService.update<Services>('services', {
          _id: editingId,
          serviceName: editingForm.serviceName,
          shortDescription: editingForm.shortDescription,
          fullDescription: editingForm.fullDescription,
          pricingDetails: editingForm.pricingDetails,
          slug: editingForm.slug,
          isAvailable: editingForm.isAvailable,
        });
        addStatusMessage('success', 'Service updated successfully');
      }

      await loadServices();
      handleCancel();
    } catch (error) {
      console.error('[ServicesManager] Error saving service:', error);
      addStatusMessage('error', 'Failed to save service');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this service?')) return;

    try {
      setIsSaving(true);
      await BaseCrudService.delete('services', id);
      addStatusMessage('success', 'Service deleted successfully');
      await loadServices();
    } catch (error) {
      console.error('[ServicesManager] Error deleting service:', error);
      addStatusMessage('error', 'Failed to delete service');
    } finally {
      setIsSaving(false);
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
          Add New Service
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
            {editingId === 'NEW' ? 'Add New Service' : 'Edit Service'}
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Service Name *
              </label>
              <Input
                value={editingForm.serviceName}
                onChange={(e) => setEditingForm({ ...editingForm, serviceName: e.target.value })}
                placeholder="e.g., Photography Session"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Short Description
              </label>
              <Input
                value={editingForm.shortDescription}
                onChange={(e) => setEditingForm({ ...editingForm, shortDescription: e.target.value })}
                placeholder="Brief description of the service"
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Full Description
              </label>
              <Textarea
                value={editingForm.fullDescription}
                onChange={(e) => setEditingForm({ ...editingForm, fullDescription: e.target.value })}
                placeholder="Detailed description of the service"
                className="w-full min-h-32"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Pricing Details
              </label>
              <Textarea
                value={editingForm.pricingDetails}
                onChange={(e) => setEditingForm({ ...editingForm, pricingDetails: e.target.value })}
                placeholder="Pricing information and packages"
                className="w-full min-h-24"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-admin-text mb-2">
                Slug (URL-friendly name)
              </label>
              <Input
                value={editingForm.slug}
                onChange={(e) => setEditingForm({ ...editingForm, slug: e.target.value })}
                placeholder="e.g., photography-session"
                className="w-full"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isAvailable"
                checked={editingForm.isAvailable}
                onChange={(e) => setEditingForm({ ...editingForm, isAvailable: e.target.checked })}
                className="w-4 h-4"
              />
              <label htmlFor="isAvailable" className="text-sm font-semibold text-admin-text">
                Service is available
              </label>
            </div>
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
                  Save Service
                </>
              )}
            </Button>
          </div>
        </motion.div>
      )}

      {/* Services List */}
      <div className="space-y-3">
        {services.length === 0 ? (
          <p className="text-center text-admin-dim py-8">No services yet. Create one to get started!</p>
        ) : (
          services.map(service => (
            <motion.div
              key={service._id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-admin-surface border border-admin-line rounded-lg flex items-start justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-admin-text truncate">{service.serviceName}</h4>
                {service.shortDescription && (
                  <p className="text-sm text-admin-dim truncate">{service.shortDescription}</p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  {service.isAvailable ? (
                    <span className="text-xs px-2 py-1 bg-green-900/30 text-green-400 rounded">Available</span>
                  ) : (
                    <span className="text-xs px-2 py-1 bg-red-900/30 text-red-400 rounded">Unavailable</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button
                  onClick={() => handleEdit(service)}
                  disabled={isSaving || editingId !== null}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </Button>
                <Button
                  onClick={() => handleDelete(service._id)}
                  disabled={isSaving || editingId !== null}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-1 text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </Button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
