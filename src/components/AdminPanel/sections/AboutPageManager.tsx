import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle, Save, Palette } from 'lucide-react';
import { AboutSection } from '@/entities';
import { isValidHexColor, meetsWCAGAA } from '@/lib/admin-helpers';
import FontFamilySelector from '@/components/FontFamilySelector';

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
  const [colorHex, setColorHex] = useState('#000000');
  const [contrastWarning, setContrastWarning] = useState(false);

  useEffect(() => {
    loadAboutData();
  }, []);

  const loadAboutData = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/cms/get-about');
      if (!response.ok) {
        throw new Error(`Failed to fetch about data: ${response.statusText}`);
      }
      const result = await response.json();
      if (result.items && result.items.length > 0) {
        const data = result.items[0];
        setAboutData(data);
        setHeading(data.heading || '');
        setSubheading(data.subheading || '');
        setAboutText(data.aboutText || '');
        setFontFamily(data.fontFamily || '');
        // Note: fontFamily field is repurposed for color storage
        // Extract color if stored in fontFamily (legacy) or use default
        if (data.fontFamily && isValidHexColor(data.fontFamily)) {
          setColorHex(data.fontFamily);
        }
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

      // Validate color
      if (!isValidHexColor(colorHex)) {
        setErrorMessage('Invalid hex color format');
        setSaveStatus('error');
        return;
      }

      // Check contrast
      const hasGoodContrast = meetsWCAGAA(colorHex, '#FFFFFF');
      if (!hasGoodContrast) {
        setContrastWarning(true);
      }

      const response = await fetch('/api/cms/mutate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'update',
          collectionId: 'about',
          itemId: aboutData._id,
          itemData: {
            _id: aboutData._id,
            heading,
            subheading,
            aboutText,
            fontFamily: colorHex, // Store color in fontFamily field
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to save: ${response.statusText}`);
      }

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      console.error('Error saving about data:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Failed to save changes');
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
            <p className="text-xs text-slate-500 mt-2">
              {aboutText.length} characters
            </p>
          </div>

          {/* Font Family Selector */}
          <div>
            <label className="block text-sm font-semibold text-slate-900 mb-2">
              Font Family
            </label>
            <FontFamilySelector
              value={fontFamily}
              onChange={setFontFamily}
              placeholder="Select a font family"
            />
          </div>

          {/* Color Picker Section */}
          <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center gap-2">
              <Palette className="w-5 h-5 text-slate-600" />
              <label className="block text-sm font-semibold text-slate-900">
                Accent Color
              </label>
            </div>

            <div className="flex items-center gap-4">
              {/* Color Swatch */}
              <div className="flex-shrink-0">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => {
                    setColorHex(e.target.value.toUpperCase());
                    setContrastWarning(false);
                  }}
                  className="w-12 h-12 rounded-lg cursor-pointer border-2 border-slate-300 hover:border-slate-400"
                  title="Click to open color picker"
                />
              </div>

              {/* Hex Input */}
              <div className="flex-1">
                <Input
                  value={colorHex}
                  onChange={(e) => {
                    const val = e.target.value.toUpperCase();
                    if (val.length <= 7 && (val === '' || val.startsWith('#'))) {
                      setColorHex(val);
                      setContrastWarning(false);
                    }
                  }}
                  placeholder="#000000"
                  maxLength={7}
                  className="w-full font-mono text-sm"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Enter hex color (e.g., #FF0000)
                </p>
              </div>
            </div>

            {/* Contrast Warning */}
            {contrastWarning && isValidHexColor(colorHex) && (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs text-yellow-800">
                  ⚠️ This color may have low contrast with white text. Consider a darker shade for better readability.
                </p>
              </div>
            )}
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
            <p className="text-slate-500 italic">Preview will appear here as you edit the content</p>
          )}
        </div>
      </Card>
    </div>
  );
}
