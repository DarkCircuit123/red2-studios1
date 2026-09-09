import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FontOption {
  name: string;
  value: string;
  cssFamily: string;
}

const FONT_OPTIONS: FontOption[] = [
  { name: 'Inter', value: 'Inter', cssFamily: 'Inter, sans-serif' },
  { name: 'Playfair Display', value: 'Playfair Display', cssFamily: '"Playfair Display", serif' },
  { name: 'Montserrat', value: 'Montserrat', cssFamily: 'Montserrat, sans-serif' },
  { name: 'Poppins', value: 'Poppins', cssFamily: 'Poppins, sans-serif' },
  { name: 'Roboto', value: 'Roboto', cssFamily: 'Roboto, sans-serif' },
  { name: 'Cinzel', value: 'Cinzel', cssFamily: 'Cinzel, serif' },
  { name: 'Crimson Text', value: 'Crimson Text', cssFamily: '"Crimson Text", serif' },
  { name: 'Barlow', value: 'Barlow', cssFamily: 'Barlow, sans-serif' },
  { name: 'IBM Plex Sans', value: 'IBM Plex Sans', cssFamily: '"IBM Plex Sans", sans-serif' },
  { name: 'Space Mono', value: 'Space Mono', cssFamily: '"Space Mono", monospace' },
];

interface FontFamilySelectorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function FontFamilySelector({
  value,
  onChange,
  placeholder = 'Select a font family',
}: FontFamilySelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const selectedFont = FONT_OPTIONS.find((f) => f.value === value);

  return (
    <div className="relative w-full">
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-2 text-left bg-white border border-slate-300 rounded-lg hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all flex items-center justify-between"
      >
        <span
          style={selectedFont ? { fontFamily: selectedFont.cssFamily } : {}}
          className={selectedFont ? 'text-slate-900' : 'text-slate-500'}
        >
          {selectedFont ? selectedFont.name : placeholder}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border border-slate-300 rounded-lg shadow-lg">
          <div className="max-h-96 overflow-y-auto">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.value}
                onClick={() => {
                  onChange(font.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-3 text-left hover:bg-blue-50 transition-colors border-b border-slate-100 last:border-b-0 ${
                  value === font.value ? 'bg-blue-100 border-l-4 border-l-blue-500' : ''
                }`}
              >
                <div
                  style={{ fontFamily: font.cssFamily }}
                  className="text-sm font-medium text-slate-900"
                >
                  {font.name}
                </div>
                <div
                  style={{ fontFamily: font.cssFamily }}
                  className="text-xs text-slate-500 mt-1"
                >
                  The quick brown fox jumps over the lazy dog
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Close dropdown when clicking outside */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
