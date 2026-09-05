import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Type, Save, X } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { adminCms } from '@/lib/admin-cms';
import { HomepageImages } from '@/entities';
import { useToast } from '@/hooks/use-toast';

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
      const result = await BaseCrudService.getAll<HomepageImages>('homepageimages', {}, { limit: 1 });
      if (result.items.length > 0) {
        setSettings(result.items[0]);
        setEditedSettings({});
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
      setSettings(updated);
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
          <Card key={field.key} className="p-6 border border-slate-200">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                  <Type className="w-4 h-4 text-blue-600" />
                  {field.label}
                </label>
                <span className={`text-xs ${charCount > field.maxLength * 0.9 ? 'text-red-600' : 'text-slate-500'}`}>
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
                  className="w-full resize-none border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              ) : (
                <Input
                  type="text"
                  value={currentValue}
                  onChange={(e) => handleFieldChange(field.key, e.target.value)}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              )}

              <p className="text-xs text-slate-500">{field.placeholder}</p>
            </div>
          </Card>
        );
      })}

      {/* Action Buttons */}
      {hasChanges && (
        <div className="flex gap-3 sticky bottom-0 bg-white p-4 rounded-lg border border-slate-200 shadow-lg">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center gap-2"
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
            variant="outline"
            className="flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" />
            Cancel
          </Button>
        </div>
      )}

      {/* Info Box */}
      <Card className="p-4 bg-blue-50 border border-blue-200">
        <p className="text-sm text-blue-900">
          <strong>Tip:</strong> Changes are saved to the database immediately. You can preview changes in the Preview tab.
        </p>
      </Card>
    </div>
  );
}
