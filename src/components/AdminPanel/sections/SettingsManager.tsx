import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, Loader, Save, RefreshCw } from 'lucide-react';

interface SiteSettings {
  _id?: string;
  siteName?: string;
  seoTitle?: string;
  seoDescription?: string;
  instagramLink?: string;
  twitterLink?: string;
  facebookLink?: string;
  linkedInLink?: string;
  contactEmail?: string;
  contactPhone?: string;
  primaryColor?: string;
  _createdDate?: Date;
  _updatedDate?: Date;
}

interface ValidationError {
  field: string;
  message: string;
}

type SettingsFormData = Omit<SiteSettings, '_createdDate' | '_updatedDate'>;

export default function SettingsManager() {
  const [settings, setSettings] = useState<SettingsFormData>({
    _id: '',
    siteName: '',
    seoTitle: '',
    seoDescription: '',
    instagramLink: '',
    twitterLink: '',
    facebookLink: '',
    linkedInLink: '',
    contactEmail: '',
    contactPhone: '',
    primaryColor: '#000000',
  });

  const [originalSettings, setOriginalSettings] = useState<SettingsFormData>(settings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Load settings on mount
  useEffect(() => {
    loadSettings();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Track changes
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasChanges(changed);
  }, [settings, originalSettings]);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(''), 5000);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Clear errors after 5 seconds
  useEffect(() => {
    if (errors.length > 0) {
      const timer = setTimeout(() => setErrors([]), 5000);
      return () => clearTimeout(timer);
    }
  }, [errors]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      setErrors([]);

      const response = await fetch('/api/cms/get-sitesettings');
      if (!response.ok) {
        throw new Error(`Failed to load settings: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to load settings');
      }

      if (data && data.items && data.items.length > 0) {
        const loadedSettings = data.items[0];
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      } else {
        // Initialize with empty settings if none exist
        const emptySettings: SettingsFormData = {
          _id: '',
          siteName: '',
          seoTitle: '',
          seoDescription: '',
          instagramLink: '',
          twitterLink: '',
          facebookLink: '',
          linkedInLink: '',
          contactEmail: '',
          contactPhone: '',
          primaryColor: '#000000',
        };
        setSettings(emptySettings);
        setOriginalSettings(emptySettings);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load settings';
      console.error('[SettingsManager] Load error:', errorMessage);
      setErrors([{ field: 'general', message: errorMessage }]);
    } finally {
      setIsLoading(false);
    }
  };

  const validateSettings = (): ValidationError[] => {
    const newErrors: ValidationError[] = [];

    // Validate Site Name
    if (!settings.siteName || settings.siteName.trim().length === 0) {
      newErrors.push({ field: 'siteName', message: 'Site Name is required' });
    } else if (settings.siteName.length > 100) {
      newErrors.push({ field: 'siteName', message: 'Site Name must be 100 characters or less' });
    }

    // Validate SEO Title
    if (settings.seoTitle && settings.seoTitle.length > 60) {
      newErrors.push({ field: 'seoTitle', message: 'SEO Title should be 60 characters or less (recommended)' });
    }

    // Validate SEO Description
    if (settings.seoDescription && settings.seoDescription.length > 160) {
      newErrors.push({ field: 'seoDescription', message: 'SEO Description should be 160 characters or less (recommended)' });
    }

    // Validate URLs
    const urlFields = ['instagramLink', 'twitterLink', 'facebookLink', 'linkedInLink'];
    urlFields.forEach((field) => {
      const value = settings[field as keyof SettingsFormData];
      if (value && typeof value === 'string' && value.trim().length > 0) {
        try {
          new URL(value);
        } catch {
          newErrors.push({ field, message: `${field.replace('Link', '')} must be a valid URL` });
        }
      }
    });

    // Validate Contact Email
    if (settings.contactEmail && settings.contactEmail.trim().length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(settings.contactEmail)) {
        newErrors.push({ field: 'contactEmail', message: 'Contact Email must be a valid email address' });
      }
    }

    // Validate Contact Phone
    if (settings.contactPhone && settings.contactPhone.trim().length > 0) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(settings.contactPhone)) {
        newErrors.push({ field: 'contactPhone', message: 'Contact Phone must contain only numbers and common phone characters' });
      }
    }

    // Validate Primary Color
    if (settings.primaryColor) {
      const hexRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexRegex.test(settings.primaryColor)) {
        newErrors.push({ field: 'primaryColor', message: 'Primary Color must be a valid hex color code (e.g., #000000)' });
      }
    }

    return newErrors;
  };

  const handleInputChange = (field: keyof SettingsFormData, value: string) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
    // Clear error for this field when user starts typing
    setErrors((prev) => prev.filter((err) => err.field !== field));
  };

  const handleSave = async () => {
    try {
      // Validate before saving
      const validationErrors = validateSettings();
      if (validationErrors.length > 0) {
        setErrors(validationErrors);
        return;
      }

      setIsSaving(true);
      setErrors([]);

      const response = await fetch('/api/cms/mutate-sitesettings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Failed to save settings: ${response.statusText}`);
      }

      const data = await response.json();
      
      // Handle the response structure - API returns { success: true, data: result }
      if (!data.success) {
        throw new Error(data.error || 'Failed to save settings');
      }
      
      const savedSettings = data.data;
      if (!savedSettings) {
        throw new Error('No data returned from server');
      }
      
      setSettings(savedSettings);
      setOriginalSettings(savedSettings);
      setSuccessMessage('Settings saved successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save settings';
      console.error('[SettingsManager] Save error:', errorMessage);
      setErrors([{ field: 'general', message: errorMessage }]);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings(originalSettings);
    setErrors([]);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center gap-3">
          <Loader className="w-8 h-8 text-admin-dim animate-spin" />
          <p className="text-admin-dim text-[13px]">Loading settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-admin-line pb-4">
        <h2 className="font-heading text-[16px] uppercase tracking-[0.12em] text-admin-text">Site Settings</h2>
        <p className="text-admin-dim text-[12px] mt-1">Manage global site configuration, SEO, social media, and contact information.</p>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="flex items-center gap-3 p-4 bg-ok/10 border border-ok/30 rounded-sm">
          <CheckCircle className="w-5 h-5 text-ok flex-shrink-0" />
          <p className="text-ok text-[13px]">{successMessage}</p>
        </div>
      )}

      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="space-y-2">
          {errors.map((error, idx) => (
            <div key={idx} className="flex items-center gap-3 p-4 bg-danger/10 border border-danger/30 rounded-sm">
              <AlertCircle className="w-5 h-5 text-danger flex-shrink-0" />
              <p className="text-danger text-[13px]">{error.message}</p>
            </div>
          ))}
        </div>
      )}

      {/* Settings Form */}
      <div className="space-y-6">
        {/* General Section */}
        <div className="space-y-4">
          <h3 className="font-heading text-[13px] uppercase tracking-[0.1em] text-admin-text">General</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">Site Name *</label>
              <input
                type="text"
                value={settings.siteName || ''}
                onChange={(e) => handleInputChange('siteName', e.target.value)}
                placeholder="Enter site name"
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors"
              />
              <p className="text-admin-faint text-[11px] mt-1">The main name of your website</p>
            </div>

            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">Primary Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={settings.primaryColor || '#000000'}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-12 h-10 bg-admin-raise border border-admin-line rounded-sm cursor-pointer"
                />
                <input
                  type="text"
                  value={settings.primaryColor || '#000000'}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  placeholder="#000000"
                  className="flex-1 px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors"
                />
              </div>
              <p className="text-admin-faint text-[11px] mt-1">Hex color code for the primary theme color</p>
            </div>
          </div>
        </div>

        {/* SEO Section */}
        <div className="space-y-4 pt-4 border-t border-admin-line">
          <h3 className="font-heading text-[13px] uppercase tracking-[0.1em] text-admin-text">SEO</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">SEO Title</label>
              <input
                type="text"
                value={settings.seoTitle || ''}
                onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                placeholder="Enter SEO title"
                maxLength={60}
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors"
              />
              <p className="text-admin-faint text-[11px] mt-1">
                {settings.seoTitle?.length || 0}/60 characters (recommended for search results)
              </p>
            </div>

            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">SEO Description</label>
              <textarea
                value={settings.seoDescription || ''}
                onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                placeholder="Enter SEO description"
                maxLength={160}
                rows={3}
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors resize-none"
              />
              <p className="text-admin-faint text-[11px] mt-1">
                {settings.seoDescription?.length || 0}/160 characters (recommended for search results)
              </p>
            </div>
          </div>
        </div>

        {/* Social Media Section */}
        <div className="space-y-4 pt-4 border-t border-admin-line">
          <h3 className="font-heading text-[13px] uppercase tracking-[0.1em] text-admin-text">Social Media</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">Instagram Link</label>
              <input
                type="url"
                value={settings.instagramLink || ''}
                onChange={(e) => handleInputChange('instagramLink', e.target.value)}
                placeholder="https://instagram.com/yourprofile"
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">Twitter Link</label>
              <input
                type="url"
                value={settings.twitterLink || ''}
                onChange={(e) => handleInputChange('twitterLink', e.target.value)}
                placeholder="https://twitter.com/yourprofile"
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">Facebook Link</label>
              <input
                type="url"
                value={settings.facebookLink || ''}
                onChange={(e) => handleInputChange('facebookLink', e.target.value)}
                placeholder="https://facebook.com/yourpage"
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors"
              />
            </div>

            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">LinkedIn Link</label>
              <input
                type="url"
                value={settings.linkedInLink || ''}
                onChange={(e) => handleInputChange('linkedInLink', e.target.value)}
                placeholder="https://linkedin.com/company/yourcompany"
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-4 pt-4 border-t border-admin-line">
          <h3 className="font-heading text-[13px] uppercase tracking-[0.1em] text-admin-text">Contact</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">Contact Email</label>
              <input
                type="email"
                value={settings.contactEmail || ''}
                onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                placeholder="contact@example.com"
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors"
              />
              <p className="text-admin-faint text-[11px] mt-1">Primary email for contact inquiries</p>
            </div>

            <div>
              <label className="block text-admin-text text-[12px] font-medium mb-2">Contact Phone</label>
              <input
                type="tel"
                value={settings.contactPhone || ''}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="+1 (555) 123-4567"
                className="w-full px-3 py-2 bg-admin-raise border border-admin-line text-admin-text text-[13px] rounded-sm focus:outline-none focus:border-oxblood focus:ring-1 focus:ring-oxblood/50 transition-colors"
              />
              <p className="text-admin-faint text-[11px] mt-1">Primary phone number for contact inquiries</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 pt-6 border-t border-admin-line">
        <button
          onClick={handleSave}
          disabled={isSaving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 bg-oxblood text-admin-text text-[12px] font-medium uppercase tracking-[0.1em] rounded-sm hover:bg-oxblood-hi disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSaving ? (
            <>
              <Loader className="w-4 h-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Changes
            </>
          )}
        </button>

        <button
          onClick={handleReset}
          disabled={isSaving || !hasChanges}
          className="flex items-center gap-2 px-4 py-2 bg-admin-raise border border-admin-line text-admin-text text-[12px] font-medium uppercase tracking-[0.1em] rounded-sm hover:bg-admin-raise/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Reset
        </button>
      </div>

      {/* Info Box */}
      <div className="p-4 bg-admin-raise border border-admin-line rounded-sm">
        <p className="text-admin-faint text-[12px] leading-relaxed">
          <strong className="text-admin-text">Note:</strong> All changes are saved to the database immediately upon clicking "Save Changes". 
          Fields marked with * are required. Social media links and contact information are optional but recommended for better user engagement.
        </p>
      </div>
    </div>
  );
}
