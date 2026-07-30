import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, AlertTriangle, Download, Play, RotateCcw } from 'lucide-react';
import { runImageHealthScan, exportScanResultsToJSON, exportScanResultsToCSV, type ImageHealthScanReport } from '@/lib/image-health-scanner-enhanced';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function MediaHealthTab() {
  const [report, setReport] = useState<ImageHealthScanReport | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanProgress('Initializing scan...');
    try {
      const result = await runImageHealthScan((message) => {
        setScanProgress(message);
      });
      setReport(result);
      setScanProgress('');
    } catch (error) {
      console.error('Scan error:', error);
      setScanProgress('Error during scan');
    } finally {
      setIsScanning(false);
    }
  };

  const handleExportJSON = () => {
    if (!report) return;
    const json = exportScanResultsToJSON(report);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-health-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    if (!report) return;
    const csv = exportScanResultsToCSV(report);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-health-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PASS':
        return 'text-green-500';
      case 'FAIL':
        return 'text-red-500';
      case 'WARNING':
        return 'text-yellow-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'FAIL':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'WARNING':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-black/10 pb-4">
        <h3 className="text-lg font-heading font-bold text-black mb-2">Media Health Dashboard</h3>
        <p className="text-sm text-black/60">Monitor and validate all image fields across your CMS collections</p>
      </div>

      {/* Scan Controls */}
      <div className="bg-black/5 rounded-lg p-4 space-y-4">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleRunScan}
            disabled={isScanning}
            className="px-4 py-2 bg-black text-white rounded font-heading font-bold text-xs uppercase tracking-wide hover:bg-black/80 disabled:opacity-50 flex items-center gap-2 transition-colors"
          >
            {isScanning ? (
              <>
                <LoadingSpinner className="w-3 h-3" />
                Scanning...
              </>
            ) : (
              <>
                <Play className="w-3 h-3" />
                Run Full Scan
              </>
            )}
          </button>

          {report && !isScanning && (
            <>
              <button
                onClick={handleExportJSON}
                className="px-4 py-2 bg-white border border-black/20 text-black rounded font-heading font-bold text-xs uppercase tracking-wide hover:bg-black/5 flex items-center gap-2 transition-colors"
              >
                <Download className="w-3 h-3" />
                Export JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="px-4 py-2 bg-white border border-black/20 text-black rounded font-heading font-bold text-xs uppercase tracking-wide hover:bg-black/5 flex items-center gap-2 transition-colors"
              >
                <Download className="w-3 h-3" />
                Export CSV
              </button>
            </>
          )}
        </div>

        {/* Progress */}
        {isScanning && scanProgress && (
          <div className="text-sm text-black/60 font-mono">
            {scanProgress}
          </div>
        )}
      </div>

      {/* Status Overview */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4"
        >
          <div className="bg-white border border-black/10 rounded-lg p-4">
            <div className="text-xs text-black/60 font-heading font-bold uppercase tracking-wide mb-2">Status</div>
            <div className="flex items-center gap-2">
              {getStatusIcon(report.overallStatus)}
              <span className={`font-heading font-bold ${getStatusColor(report.overallStatus)}`}>
                {report.overallStatus}
              </span>
            </div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-4">
            <div className="text-xs text-black/60 font-heading font-bold uppercase tracking-wide mb-2">Records</div>
            <div className="text-2xl font-heading font-bold text-black">{report.totalRecordsScanned}</div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-4">
            <div className="text-xs text-black/60 font-heading font-bold uppercase tracking-wide mb-2">Fields</div>
            <div className="text-2xl font-heading font-bold text-black">{report.totalFieldsScanned}</div>
          </div>

          <div className="bg-white border border-black/10 rounded-lg p-4">
            <div className="text-xs text-black/60 font-heading font-bold uppercase tracking-wide mb-2">Scanned</div>
            <div className="text-xs text-black/60 font-mono">
              {new Date(report.timestamp).toLocaleString()}
            </div>
          </div>
        </motion.div>
      )}

      {/* Results Summary */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-black/10 rounded-lg p-4 space-y-4"
        >
          <h4 className="font-heading font-bold text-black">Results Summary</h4>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-green-500">{report.passCount}</div>
              <div className="text-xs text-black/60 font-heading font-bold uppercase tracking-wide">Passed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-red-500">{report.failCount}</div>
              <div className="text-xs text-black/60 font-heading font-bold uppercase tracking-wide">Failed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-heading font-bold text-yellow-500">{report.warningCount}</div>
              <div className="text-xs text-black/60 font-heading font-bold uppercase tracking-wide">Warnings</div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Collection Breakdown */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-black/10 rounded-lg p-4 space-y-3"
        >
          <h4 className="font-heading font-bold text-black">Collection Breakdown</h4>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {Object.entries(report.collectionSummary).map(([name, stats]) => (
              <div key={name} className="flex items-center justify-between p-3 bg-black/5 rounded">
                <div className="flex-1">
                  <div className="font-heading font-bold text-sm text-black">{name}</div>
                  <div className="text-xs text-black/60">
                    {stats.recordsScanned} records • {stats.fieldsScanned} fields
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(stats.status)}
                  {stats.issues > 0 && (
                    <span className="text-xs font-heading font-bold text-red-500">{stats.issues} issues</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Issues List */}
      {report && report.details.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-black/10 rounded-lg p-4 space-y-3"
        >
          <h4 className="font-heading font-bold text-black">Issues Detected</h4>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {report.details
              .filter((d) => !d.isValid)
              .slice(0, 20)
              .map((detail, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="border border-black/10 rounded p-3 cursor-pointer hover:bg-black/5 transition-colors"
                  onClick={() => setSelectedIssue(selectedIssue === idx.toString() ? null : idx.toString())}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="font-heading font-bold text-sm text-black">
                        {detail.collectionName}
                      </div>
                      <div className="text-xs text-black/60">
                        Record: {detail.recordId} • Field: {detail.fieldName}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {detail.issues.map((issue, i) => (
                        <span
                          key={i}
                          className={`text-xs font-heading font-bold px-2 py-1 rounded ${
                            issue.severity === 'ERROR'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {issue.severity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedIssue === idx.toString() && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-3 border-t border-black/10 space-y-2"
                      >
                        {detail.issues.map((issue, i) => (
                          <div key={i} className="text-xs space-y-1">
                            <div className="font-heading font-bold text-black">{issue.code}</div>
                            <div className="text-black/60">{issue.message}</div>
                            <div className="text-black/50 italic">→ {issue.recommendation}</div>
                          </div>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
          </div>

          {report.details.filter((d) => !d.isValid).length > 20 && (
            <div className="text-xs text-black/60 text-center pt-2">
              ... and {report.details.filter((d) => !d.isValid).length - 20} more issues
            </div>
          )}
        </motion.div>
      )}

      {/* Summary Report */}
      {report && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-black/5 rounded-lg p-4"
        >
          <h4 className="font-heading font-bold text-black mb-3">Full Report</h4>
          <pre className="text-xs font-mono text-black/60 overflow-x-auto max-h-64 overflow-y-auto whitespace-pre-wrap break-words">
            {report.summary}
          </pre>
        </motion.div>
      )}

      {/* Empty State */}
      {!report && !isScanning && (
        <div className="text-center py-12 bg-black/5 rounded-lg">
          <AlertTriangle className="w-12 h-12 text-black/30 mx-auto mb-4" />
          <p className="text-black/60 font-heading font-bold mb-4">No scan results yet</p>
          <p className="text-sm text-black/50 mb-6">Click "Run Full Scan" to analyze all image fields</p>
        </div>
      )}
    </div>
  );
}
