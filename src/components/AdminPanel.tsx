import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, X, Edit2 } from 'lucide-react';
import TextEditableField from './TextEditableField';
import ImageUploadManager from './ImageUploadManager';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const [activeTab, setActiveTab] = useState('text');
  const [siteTitle, setSiteTitle] = useState('RED2');
  const [siteTagline, setSiteTagline] = useState('BY JORDAN MICHAEL ZUNIGA');

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
            className="fixed right-0 top-0 h-screen w-full max-w-md bg-slate-900 border-l border-white/10 z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-900 border-b border-white/10 p-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-white" />
                <h2 className="text-lg font-heading font-bold text-white">Admin Panel</h2>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-8">
              {/* Text Content Section */}
              <div>
                <h3 className="text-sm font-heading font-bold text-white mb-4 uppercase tracking-wide">
                  Site Text
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/60 uppercase tracking-wide block mb-2">
                      Site Title
                    </label>
                    <TextEditableField
                      value={siteTitle}
                      onSave={setSiteTitle}
                      className="text-lg font-heading font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 uppercase tracking-wide block mb-2">
                      Tagline
                    </label>
                    <TextEditableField
                      value={siteTagline}
                      onSave={setSiteTagline}
                      className="text-sm text-white/70"
                    />
                  </div>
                </div>
              </div>

              {/* Image Management Section */}
              <div>
                <h3 className="text-sm font-heading font-bold text-white mb-4 uppercase tracking-wide">
                  Images
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-white/60 uppercase tracking-wide block mb-2">
                      Logo
                    </label>
                    <ImageUploadManager
                      label="Upload Logo"
                      onImageUpload={(url) => console.log('Logo uploaded:', url)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-white/60 uppercase tracking-wide block mb-2">
                      Hero Background
                    </label>
                    <ImageUploadManager
                      label="Upload Hero Image"
                      onImageUpload={(url) => console.log('Hero image uploaded:', url)}
                    />
                  </div>
                </div>
              </div>

              {/* CMS Collections Info */}
              <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                <h3 className="text-sm font-heading font-bold text-white mb-3 uppercase tracking-wide">
                  Manage Content
                </h3>
                <p className="text-xs text-white/60 mb-4">
                  Edit all your site content directly from the CMS:
                </p>
                <ul className="space-y-2 text-xs text-white/50">
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
                  className="inline-block mt-4 px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded text-xs text-white transition-all duration-300"
                >
                  Open CMS Dashboard
                </a>
              </div>

              {/* Tips */}
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <h3 className="text-sm font-heading font-bold text-blue-300 mb-2">💡 Tips</h3>
                <ul className="text-xs text-blue-200/70 space-y-1">
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
