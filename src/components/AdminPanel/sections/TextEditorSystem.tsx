import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Type, Save, X } from 'lucide-react';
import { adminCms } from '@/lib/admin-cms';
import { HomepageImages } from '@/entities';
import { useToast } from '@/hooks/use-toast';
import { getActiveHomepageImages } from '@/lib/get-active-homepage-images';

interface TextFieldConfig {
  key: keyof HomepageImages;
  label: string;
  placeholder: string;
  maxLength: number;
  multiline?: boolean;
  rows?: number;
}

const textFields: TextFieldConfig[] = [
  {
    key: 'imageName',
    label: 'Image Name',
    placeholder: 'Enter image name',
    maxLength: 100,
  },
];

export default function TextEditorSystem() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<HomepageImages | null>(null);
  const [editedSettings, setEditedSettings] = useState<Partial<HomepageImages>>({});
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const item = await getActiveHomepageImages();
      if (item) {
        setSettings(item);
        setEditedSettings({});
      } else {
        setSettings(null);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      toast({
        title: 'Error',
        description: 'Failed to load settings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (key: keyof HomepageImages, value: string) => {
    setEditedSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
    setHasChanges(true);
  };

  const handleSave = async () => {
    if (!settings || !hasChanges) return;

    try {
      setIsSaving(true);
      const updated = { ...settings, ...editedSettings };
      await adminCms.update('homepageimages', updated);
      // Re-read through the same helper so the editor reflects the row the site actually renders
      const reloaded = await getActiveHomepageImages();
      if (reloaded) {
        setSettings(reloaded);
      }
      setEditedSettings({});
      setHasChanges(false);

      toast({
        title: 'Success',
        description: 'Content saved successfully',
      });
    } catch (error) {
      console.error('Error saving:', error);
      toast({
        title: 'Error',
        description: 'Failed to save changes',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedSettings({});
    setHasChanges(false);
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
      {/* Text Fields */}
      {textFields.map((field) => {
        const currentValue = editedSettings[field.key] ?? settings?.[field.key] ?? '';
        const charCount = String(currentValue).length;

        return (
          <div key={field.key} className="p-6 bg-admin-surface border border-admin-line rounded-sm">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-heading text-xs uppercase tracking-[0.14em] text-admin-text flex items-center gap-2">
                  <Type className="w-4 h-4 text-oxblood" />
                  {field.label}
                </label>
                <span className={`text-xs tabular-nums ${charCount > field.maxLength * 0.9 ? 'text-danger' : 'text-admin-faint'}`}>
                  {charCount} / {field.maxLength}
                </span>
              </div>

              {field.multiline ? (
                <Textarea
                  value={currentValue}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  rows={field.rows || 4}
                  className="w-full resize-none bg-admin-raise border border-admin-line rounded-sm p-3 text-xs text-admin-text placeholder-admin-faint focus:outline-1 focus:outline-oxblood focus:outline-offset-2 transition-colors duration-160"
                />
              ) : (
                <Input
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  className="w-full bg-admin-raise border border-admin-line rounded-sm px-3 py-2 text-xs text-admin-text placeholder-admin-faint focus:outline-1 focus:outline-oxblood focus:outline-offset-2 transition-colors duration-160"
                />
              )}

              <p className="text-xs text-admin-faint">{field.placeholder}</p>
            </div>
          </div>
        );
      })}

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex gap-3 sticky bottom-0 bg-admin-surface p-4 rounded-sm border border-admin-line">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-oxblood hover:bg-oxblood-hi text-white flex items-center justify-center gap-2 rounded-sm transition-colors duration-160 focus:outline-1 focus:outline-oxblood focus:outline-offset-2"
          >
            {isSaving ? (
              <>
                <LoadingSpinner />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </Button>
          <Button
            onClick={handleCancel}
            disabled={isSaving}
            className="bg-admin-raise hover:bg-admin-line text-admin-text border border-admin-line rounded-sm transition-colors duration-160 focus:outline-1 focus:outline-oxblood focus:outline-offset-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      )}

      {/* Info Box */}
      <div className="p-4 bg-admin-raise border border-admin-line rounded-sm">
        <p className="text-xs text-admin-dim">
          <strong>Tip:</strong> Changes are saved to the database immediately. You can preview changes in the Preview tab.
        </p>
      </div>
    </div>
  );
}
