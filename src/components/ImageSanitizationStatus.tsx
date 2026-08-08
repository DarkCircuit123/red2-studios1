/**
 * Image Sanitization Status Component
 * Displays information about cleaned up images
 */

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface SanitizationReport {
  originalCount: number;
  sanitizedCount: number;
  removed: number;
  percentageRemoved: number;
}

export function ImageSanitizationStatus() {
  const [report, setReport] = useState<SanitizationReport | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if there's sanitization data in session storage
    const storedReport = sessionStorage.getItem('imageSanitizationReport');
    if (storedReport) {
      try {
        const parsed = JSON.parse(storedReport);
        setReport(parsed);
        setIsVisible(parsed.removed > 0);
      } catch (e) {
        console.error('Failed to parse sanitization report:', e);
      }
    }
  }, []);

  if (!isVisible || !report) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-40 max-w-sm">
      <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-4 border border-white/20">
        <div className="flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-heading font-semibold text-sm text-black mb-1">
              Image Cleanup Complete
            </h3>
            <p className="text-xs text-black/70 mb-2">
              Removed {report.removed} broken image{report.removed !== 1 ? 's' : ''} ({report.percentageRemoved.toFixed(1)}%)
            </p>
            <p className="text-xs text-black/60">
              {report.sanitizedCount} valid images now displaying
            </p>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            className="text-black/40 hover:text-black/60 transition-colors flex-shrink-0"
            aria-label="Close notification"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}
