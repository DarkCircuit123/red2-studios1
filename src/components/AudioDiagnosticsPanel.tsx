import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, Info, Download, X, RefreshCw } from 'lucide-react';
import { AudioDiagnostic, AudioDiagnosticReport, AudioIssue } from '@/lib/audio-diagnostic';
import { GlobalAudioManager } from '@/lib/audio-manager';

export default function AudioDiagnosticsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [report, setReport] = useState<AudioDiagnosticReport | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [autoRepair, setAutoRepair] = useState(false);

  const runDiagnostic = useCallback(async () => {
    setIsRunning(true);
    try {
      const diagnosticReport = await AudioDiagnostic.runDiagnostic();
      setReport(diagnosticReport);
      
      if (autoRepair) {
        AudioDiagnostic.applyAllFixes();
      }
    } catch (e) {
      console.error('Diagnostic failed:', e);
    } finally {
      setIsRunning(false);
    }
  }, [autoRepair]);

  const exportReport = useCallback(() => {
    if (!report) return;
    
    const json = AudioDiagnostic.exportReport();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audio-diagnostic-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'info':
        return 'text-blue-600 bg-blue-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'info':
        return <Info className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  return (
    <>
      {/* Diagnostics button */}
      <motion.button
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.7 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-8 z-40 p-3 bg-secondary text-white rounded-full hover:bg-secondary/90 transition-all duration-300 shadow-lg hover:shadow-xl"
        aria-label="Audio Diagnostics"
        title="Run audio diagnostics"
      >
        <RefreshCw className="w-5 h-5" />
      </motion.button>

      {/* Diagnostics panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-8 right-24 z-50 w-96 max-h-96 bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary to-secondary text-white p-4 flex justify-between items-center">
              <h3 className="font-heading font-bold">Audio Diagnostics</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {!report ? (
                <div className="text-center py-8">
                  <p className="font-paragraph text-gray-600 mb-4">
                    Click "Run Diagnostic" to analyze audio systems
                  </p>
                  <button
                    onClick={runDiagnostic}
                    disabled={isRunning}
                    className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 disabled:opacity-50 transition-colors"
                  >
                    {isRunning ? 'Running...' : 'Run Diagnostic'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Summary */}
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="font-paragraph text-sm font-semibold mb-2">Summary</p>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <p className="text-gray-600">Total Issues</p>
                        <p className="font-bold text-lg">{report.totalIssues}</p>
                      </div>
                      <div>
                        <p className="text-red-600">Critical</p>
                        <p className="font-bold text-lg text-red-600">{report.criticalIssues}</p>
                      </div>
                      <div>
                        <p className="text-yellow-600">Warnings</p>
                        <p className="font-bold text-lg text-yellow-600">{report.warningIssues}</p>
                      </div>
                    </div>
                  </div>

                  {/* Audio Context State */}
                  <div className="bg-blue-50 p-3 rounded text-xs">
                    <p className="font-paragraph font-semibold mb-1">Audio Context</p>
                    <p className="text-blue-700">State: {report.audioContextState}</p>
                  </div>

                  {/* Issues List */}
                  {report.issues.length > 0 && (
                    <div className="space-y-2">
                      <p className="font-paragraph text-sm font-semibold">Issues</p>
                      {report.issues.slice(0, 5).map((issue: AudioIssue) => (
                        <div
                          key={issue.id}
                          className={`p-2 rounded text-xs ${getSeverityColor(issue.severity)}`}
                        >
                          <div className="flex items-start gap-2">
                            {getSeverityIcon(issue.severity)}
                            <div className="flex-1">
                              <p className="font-semibold">{issue.description}</p>
                              <p className="opacity-75">{issue.fix}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                      {report.issues.length > 5 && (
                        <p className="text-xs text-gray-600 text-center">
                          +{report.issues.length - 5} more issues
                        </p>
                      )}
                    </div>
                  )}

                  {/* Auto-repair option */}
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoRepair}
                      onChange={(e) => setAutoRepair(e.target.checked)}
                      className="rounded"
                    />
                    <span className="font-paragraph">Auto-repair issues</span>
                  </label>
                </>
              )}
            </div>

            {/* Footer */}
            {report && (
              <div className="border-t border-gray-200 p-4 flex gap-2">
                <button
                  onClick={runDiagnostic}
                  disabled={isRunning}
                  className="flex-1 px-3 py-2 bg-primary text-white rounded text-sm hover:bg-primary/90 disabled:opacity-50 transition-colors"
                >
                  {isRunning ? 'Running...' : 'Re-run'}
                </button>
                <button
                  onClick={exportReport}
                  className="flex-1 px-3 py-2 bg-secondary text-white rounded text-sm hover:bg-secondary/90 transition-colors flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
