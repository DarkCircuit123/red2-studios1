import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle, Save } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { AboutSection } from '@/entities';

export default function AboutPageManager() {
  const [aboutData, setAboutData] = useState<AboutSection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Form state
  const [heading, setHeading] = useState('');
  const [subheading, setSubheading] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [fontFamily, setFontFamily] = useState('');

  useEffect(() => {
    loadAboutData();
  }, []);

  const loadAboutData = async () => {
    try {
      setIsLoading(true);
      const result = await BaseCrudService.getAll<AboutSection>('about');
      if (result.items && result.items.length > 0) {
        const data = result.items[0];
        setAboutData(data);
        setHeading(data.heading || '');
        setSubheading(data.subheading || '');
        setAboutText(data.aboutText || '');
        setFontFamily(data.fontFamily || '');
      }
    } catch (error) {
      console.error('Error loading about data:', error);
      setErrorMessage('Failed to load about page data');
      setSaveStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!aboutData?._id) {
      setErrorMessage('No about page data found');
      setSaveStatus('error');
      return;
    }

    try {
      setIsSaving(true);
      setSaveStatus('idle');
      setErrorMessage('');

      await BaseCrudService.update<AboutSection>('about', {
        _id: aboutData._id,
        heading,
        subheading,
        aboutText,
        fontFamily,
      });

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving about data:', error);
      setErrorMessage('Failed to save changes');
      setSaveStatus('error');
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
      {saveStatus === 'success' && (
        <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <p className="text-sm text-green-700">Changes saved successfully!</p>
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600" />
          <p className="text-sm text-red-700">{errorMessage}</p>
        </div>
      )}

      {/* Main Content Card */}
      <Card className="p-6 border border-slate-200">
        <div className="space-y-6">
          {/* Heading */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Section Heading
            </label>
            <Input
              value={heading}
              onChange={(e) => setHeading(e.target.value)}
              placeholder="Enter the main heading for the About section"
              className="w-full"
            />
          </div>

          {/* Subheading */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Section Subheading
            </label>
            <Input
              value={subheading}
              onChange={(e) => setSubheading(e.target.value)}
              placeholder="Enter the subheading for the About section"
              className="w-full"
            />
          </div>

          {/* About Text - Large Visible Box */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              About Text Content
            </label>
            <p className="text-xs text-slate-500 mb-3">
              This is the main content that appears on your About page. Make it compelling and informative.
            </p>
            <Textarea
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              placeholder="Enter the main about text content here. This will be displayed prominently on your About page."
              className="w-full min-h-96 p-4 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            />
            <p className="text-xs text-slate-400 mt-2">
              {aboutText.length} characters
            </p>
          </div>

          {/* Font Family */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Font Family
            </label>
            <Input
              value={fontFamily}
              onChange={(e) => setFontFamily(e.target.value)}
              placeholder="e.g., Inter, Helvetica, Arial"
              className="w-full"
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
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
                  <Save className="w-4 h-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </div>
      </Card>

      {/* Preview Card */}
      <Card className="p-6 border border-slate-200 bg-slate-50">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Preview</h3>
        <div className="space-y-3">
          {heading && (
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{heading}</h2>
            </div>
          )}
          {subheading && (
            <div>
              <p className="text-lg text-slate-600">{subheading}</p>
            </div>
          )}
          {aboutText && (
            <div>
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{aboutText}</p>
            </div>
          )}
          {!heading && !subheading && !aboutText && (
            <p className="text-slate-400 italic">Preview will appear here as you edit the content</p>
          )}
        </div>
      </Card>
    </div>
  );
}
