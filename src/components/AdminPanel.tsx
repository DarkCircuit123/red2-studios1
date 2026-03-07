import React from 'react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Edit2 } from 'lucide-react';
import TextEditableField from './TextEditableField';
import ImageUploadManager from './ImageUploadManager';
import { BaseCrudService } from '@/integrations';
import { Services } from '@/entities/index';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [siteTitle, setSiteTitle] = useState('RED2');
  const [siteTagline, setSiteTagline] = useState('BY JORDAN MICHAEL ZUNIGA');
  const [heroImage, setHeroImage] = useState<string | undefined>();
  const [serviceId, setServiceId] = useState<string | undefined>();

  useEffect(() => {
    const loadHeroImage = async () => {
      try {
        const services = await BaseCrudService.getAll<Services>('services', {}, { limit: 1 });
        if (services.items && services.items.length > 0) {
          const service = services.items[0];
          setServiceId(service._id);
          if (service.infographic) {
            setHeroImage(service.infographic);
          }
        }
      } catch (error) {
        console.error('Error loading hero image:', error);
      }
    };
    
    if (isOpen) {
      loadHeroImage();
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />

          {/* Panel */}
          <motion.div
            initial={{ x: 400 }}
            animate={{ x: 0 }}
            exit={{ x: 400 }}
            transition={{ type: 'spring', damping: 20 }}
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-white border-l border-black/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-black/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-black" />
                <h2 className="text-lg font-heading font-bold text-black">Admin Panel</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded transition-colors"
              >
                <X className="w-5 h-5 text-black/60" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Text Content Section */}
              <div>
                <h3 className="text-sm font-heading font-bold text-black mb-4 uppercase tracking-wide">
                  Site Text
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                      Site Title
                    </label>
                    <TextEditableField
                      value={siteTitle}
                      onSave={setSiteTitle}
                      className="text-lg font-heading font-bold text-black"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                      Tagline
                    </label>
                    <TextEditableField
                      value={siteTagline}
                      onSave={setSiteTagline}
                      className="text-sm text-black/70"
                    />
                  </div>
                </div>
              </div>

              {/* Image Management Section */}
              <div>
                <h3 className="text-sm font-heading font-bold text-black mb-4 uppercase tracking-wide">
                  Images
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-black/60 uppercase tracking-wide block mb-2">
                      Hero Background
                    </label>
                    <ImageUploadManager
                      label="Upload Hero Image"
                      currentImage={heroImage}
                      collectionId="services"
                      itemId={serviceId}
                      fieldName="infographic"
                      onImageUpload={(url) => {
                        setHeroImage(url);
                        console.log('Hero image uploaded:', url);
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* CMS Collections Info */}
              <div className="bg-black/5 border border-black/10 rounded-lg p-4">
                <h3 className="text-sm font-heading font-bold text-black mb-3 uppercase tracking-wide">
                  Manage Content
                </h3>
                <p className="text-xs text-black/60 mb-4">
                  Edit all your site content directly from the CMS:
                </p>
                <ul className="space-y-2 text-xs text-black/50">
                  <li>• Portfolio Projects</li>
                  <li>• Blog Posts & Stories</li>
                  <li>• Client Galleries</li>
                  <li>• Booking Availability</li>
                  <li>• Watermark Settings</li>
                  <li>• Team Members</li>
                  <li>• Services</li>
                </ul>
                <a
                  href="https://manage.wix.com/dashboard"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-4 py-2 bg-black/10 hover:bg-black/20 border border-black/20 rounded text-xs text-black transition-all duration-300"
                >
                  Open CMS Dashboard
                </a>
              </div>

              {/* Tips */}
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <h3 className="text-sm font-heading font-bold text-red-600 mb-2">💡 Tips</h3>
                <ul className="text-xs text-red-600/70 space-y-1">
                  <li>• Click any text to edit it inline</li>
                  <li>• Drag & drop images for auto-crop</li>
                  <li>• All changes save automatically</li>
                  <li>• Use CMS for bulk content updates</li>
                </ul>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default React.memo(AdminPanel);
