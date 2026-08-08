import { useEffect, useState } from 'react';
import { executeDataCleanup, generateCleanupSummary } from '@/lib/data-cleanup-executor';
import { verifyDataCleanup, generateVerificationReport } from '@/lib/data-cleanup-verification';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface CleanupReport {
  collectionId: string;
  collectionName: string;
  beforeCount: number;
  deletedCount: number;
  afterCount: number;
  deletedItems: string[];
  status: 'success' | 'error' | 'no-placeholders';
  error?: string;
}

interface VerificationResult {
  collectionId: string;
  collectionName: string;
  totalItems: number;
  itemsWithPlaceholders: number;
  placeholderItems: Array<{ id: string; reason: string }>;
  status: 'clean' | 'contaminated' | 'error';
  error?: string;
}

export default function DataCleanupVerificationPage() {
  const [reports, setReports] = useState<CleanupReport[]>([]);
  const [verificationResults, setVerificationResults] = useState<VerificationResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState('');
  const [verificationReport, setVerificationReport] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<'cleanup' | 'verification' | 'complete'>('cleanup');

  useEffect(() => {
    const runCleanupAndVerification = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Step 1: Run cleanup
        console.log('🚀 Starting data cleanup process...');
        setStep('cleanup');
        const cleanupReports = await executeDataCleanup();
        setReports(cleanupReports);
        const cleanupSummary = generateCleanupSummary(cleanupReports);
        setSummary(cleanupSummary);
        console.log(cleanupSummary);

        // Step 2: Verify cleanup
        console.log('🔍 Verifying data cleanup...');
        setStep('verification');
        const verResults = await verifyDataCleanup();
        setVerificationResults(verResults);
        const verReport = generateVerificationReport(verResults);
        setVerificationReport(verReport);
        console.log(verReport);

        setStep('complete');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        setError(errorMessage);
        console.error('❌ Process failed:', errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    runCleanupAndVerification();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <LoadingSpinner />
          <p className="mt-4 text-foreground font-paragraph">
            {step === 'cleanup' && 'Running data cleanup...'}
            {step === 'verification' && 'Verifying cleanup results...'}
            {step === 'complete' && 'Complete!'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-heading font-bold mb-8 text-foreground">
          Data Cleanup & Verification
        </h1>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-heading font-bold text-red-900 mb-2">Error</h2>
            <p className="text-red-800 font-paragraph">{error}</p>
          </div>
        )}

        {/* Cleanup Summary */}
        {summary && (
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              📊 Cleanup Summary
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <pre className="font-mono text-sm whitespace-pre-wrap text-foreground overflow-auto max-h-96">
                {summary}
              </pre>
            </div>
          </div>
        )}

        {/* Cleanup Details */}
        {reports.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              🗑️  Cleanup Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {reports.map(report => (
                <div
                  key={report.collectionId}
                  className={`border rounded-lg p-4 ${
                    report.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : report.status === 'success'
                        ? 'border-green-200 bg-green-50'
                        : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-heading font-bold text-foreground">
                      {report.collectionName}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        report.status === 'error'
                          ? 'bg-red-200 text-red-900'
                          : report.status === 'success'
                            ? 'bg-green-200 text-green-900'
                            : 'bg-gray-200 text-gray-900'
                      }`}
                    >
                      {report.status === 'error'
                        ? '❌'
                        : report.status === 'success'
                          ? '✅'
                          : '⚪'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm font-paragraph">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Before:</span>
                      <span className="font-bold">{report.beforeCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Deleted:</span>
                      <span className="font-bold text-red-600">{report.deletedCount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">After:</span>
                      <span className="font-bold">{report.afterCount}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Verification Report */}
        {verificationReport && (
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              ✅ Verification Report
            </h2>
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
              <pre className="font-mono text-sm whitespace-pre-wrap text-foreground overflow-auto max-h-96">
                {verificationReport}
              </pre>
            </div>
          </div>
        )}

        {/* Verification Details */}
        {verificationResults.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-4">
              🔍 Verification Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {verificationResults.map(result => (
                <div
                  key={result.collectionId}
                  className={`border rounded-lg p-4 ${
                    result.status === 'error'
                      ? 'border-red-200 bg-red-50'
                      : result.status === 'clean'
                        ? 'border-green-200 bg-green-50'
                        : 'border-yellow-200 bg-yellow-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="font-heading font-bold text-foreground">
                      {result.collectionName}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-bold ${
                        result.status === 'error'
                          ? 'bg-red-200 text-red-900'
                          : result.status === 'clean'
                            ? 'bg-green-200 text-green-900'
                            : 'bg-yellow-200 text-yellow-900'
                      }`}
                    >
                      {result.status === 'error'
                        ? '✗'
                        : result.status === 'clean'
                          ? '✓'
                          : '⚠'}
                    </span>
                  </div>
                  <div className="space-y-2 text-sm font-paragraph">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Items:</span>
                      <span className="font-bold">{result.totalItems}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">With Placeholders:</span>
                      <span
                        className={`font-bold ${result.itemsWithPlaceholders > 0 ? 'text-red-600' : 'text-green-600'}`}
                      >
                        {result.itemsWithPlaceholders}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Final Status */}
        <div className="p-6 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="text-lg font-heading font-bold text-blue-900 mb-2">✨ Process Complete</h3>
          <p className="text-blue-800 font-paragraph mb-4">
            Data cleanup and verification have been completed. Check the reports above for details.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-blue-800 font-paragraph text-sm">
            <li>Review cleanup summary to see items deleted</li>
            <li>Check verification report to confirm no placeholders remain</li>
            <li>Navigate to PortfolioPage and WorkPage to verify UI rendering</li>
            <li>Check browser console for sanitization reports</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
