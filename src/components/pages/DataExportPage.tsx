import React, { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { useMember } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Download, FileJson, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import { exportData } from '@/lib/data-export';
import { addNoindexMetaTags } from '@/lib/seo-meta-tags';
import {
  BlogPosts,
  BookingAvailability,
  ClientProofingGalleries,
  ClientsPress,
  Portfolio,
  Services,
  TeamMembers,
} from '@/entities/index';

// Admin email for access control
const ADMIN_EMAIL = 'jordanzuniga@gmail.com';

// Batch size for fetching data
const BATCH_SIZE = 500;

interface DataStats {
  [key: string]: number;
}

interface ExportConfig {
  format: 'json' | 'csv';
  includePII: boolean;
  collections: string[];
}

function DataExportPageContent() {
  const { member } = useMember();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState<DataStats>({});
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingExportConfig, setPendingExportConfig] = useState<ExportConfig | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<'json' | 'csv'>('json');
  const [includePII, setIncludePII] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<Set<string>>(new Set());

  // Verify admin access
  const isAdmin = member?.loginEmail === ADMIN_EMAIL;

  // Add noindex/nofollow meta tags on mount
  useEffect(() => {
    addNoindexMetaTags();
  }, []);

  useEffect(() => {
    const loadDataStats = async () => {
      try {
        const collections = [
          { id: 'blogposts', name: 'Blog Posts' },
          { id: 'bookingavailability', name: 'Bookings' },
          { id: 'clientgalleries', name: 'Client Galleries' },
          { id: 'clientspress', name: 'Clients & Press' },
          { id: 'portfolio', name: 'Portfolio' },
          { id: 'services', name: 'Services' },
          { id: 'teammembers', name: 'Team Members' },
        ];

        const statsPromises = collections.map(col =>
          BaseCrudService.getAll(col.id, {}, { limit: 1 })
            .then(result => ({ name: col.name, count: result.totalCount || 0 }))
            .catch(() => ({ name: col.name, count: 0 }))
        );

        const results = await Promise.allSettled(statsPromises);
        const stats: DataStats = {};

        results.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            stats[result.value.name] = result.value.count;
          }
        });

        setDataStats(stats);
        // Initialize all collections as selected
        setSelectedCollections(new Set(Object.keys(stats)));
      } catch (error) {
        console.error('Failed to load data statistics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDataStats();
  }, []);

  const logExportAudit = async (
    status: 'success' | 'failed',
    recordCount: number,
    fileSize: number,
    errorMessage?: string
  ) => {
    try {
      const collectionsStr = Array.from(selectedCollections).join(', ');
      await BaseCrudService.create('dataexportaudit', {
        _id: crypto.randomUUID(),
        exportedBy: member?.loginEmail || 'unknown',
        exportDate: new Date().toISOString(),
        collectionsExported: collectionsStr,
        exportFormat: selectedFormat,
        includedPII: includePII,
        recordCount,
        fileSize,
        status,
        errorMessage: errorMessage || undefined,
      });
    } catch (error) {
      console.error('Failed to log export audit:', error);
    }
  };

  const fetchCollectionData = async (collectionId: string): Promise<any[]> => {
    const allData: any[] = [];
    let skip = 0;
    let hasMore = true;

    while (hasMore) {
      const result = await BaseCrudService.getAll(collectionId, {}, { limit: BATCH_SIZE, skip });
      allData.push(...(result.items || []));
      hasMore = result.hasNext || false;
      skip = result.nextSkip || 0;
    }

    return allData;
  };

  const handleExportClick = (config: ExportConfig) => {
    setPendingExportConfig(config);
    setShowConfirmDialog(true);
  };

  const handleConfirmExport = async () => {
    if (!pendingExportConfig) return;

    setShowConfirmDialog(false);
    setIsExporting(true);
    setExportProgress(0);
    setExportStatus('Preparing export...');

    try {
      const collectionMap: Record<string, string> = {
        'Blog Posts': 'blogposts',
        'Bookings': 'bookingavailability',
        'Client Galleries': 'clientgalleries',
        'Clients & Press': 'clientspress',
        'Portfolio': 'portfolio',
        'Services': 'services',
        'Team Members': 'teammembers',
      };

      const allData: Record<string, any[]> = {};
      let totalRecords = 0;
      const collectionsToExport = Array.from(selectedCollections);

      // Fetch data from selected collections
      for (let i = 0; i < collectionsToExport.length; i++) {
        const collectionName = collectionsToExport[i];
        const collectionId = collectionMap[collectionName];

        if (!collectionId) continue;

        setExportStatus(`Fetching ${collectionName}... (${i + 1}/${collectionsToExport.length})`);
        setExportProgress(Math.round((i / collectionsToExport.length) * 50));

        const data = await fetchCollectionData(collectionId);
        allData[collectionId] = data;
        totalRecords += data.length;
      }

      // Create comprehensive export
      setExportStatus('Formatting export...');
      setExportProgress(60);

      const exportPayload = {
        exportDate: new Date().toISOString(),
        exportedBy: member?.profile?.nickname || member?.loginEmail || 'Admin',
        includedPII: includePII,
        totalRecords,
        collections: allData,
      };

      setExportStatus('Downloading file...');
      setExportProgress(80);

      const result = await exportData([exportPayload], 'complete_data_export', {
        format: pendingExportConfig.format,
        includeTimestamp: true,
        includeMetadata: true,
        includePII: pendingExportConfig.includePII,
      });

      setExportProgress(100);
      setExportStatus('✓ Export completed successfully!');

      // Log successful export
      await logExportAudit('success', totalRecords, result.size);

      setTimeout(() => {
        setExportStatus(null);
        setExportProgress(0);
      }, 3000);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to export data:', error);
      setExportStatus(`✗ Export failed: ${errorMsg}`);

      // Log failed export
      await logExportAudit('failed', 0, 0, errorMsg);
    } finally {
      setIsExporting(false);
    }
  };

  const toggleCollection = (collectionName: string) => {
    const newSelected = new Set(selectedCollections);
    if (newSelected.has(collectionName)) {
      newSelected.delete(collectionName);
    } else {
      newSelected.add(collectionName);
    }
    setSelectedCollections(newSelected);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black">
        <Header />
        <main className="pt-32 pb-20">
          <div className="max-w-4xl mx-auto px-8">
            <div className="p-8 bg-red-950/20 border border-red-900/50 rounded-lg">
              <div className="flex items-center gap-3 mb-4">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <h2 className="text-2xl font-heading font-bold text-red-400">Access Denied</h2>
              </div>
              <p className="text-red-300 font-paragraph">
                You do not have permission to access the data export center. Only administrators can export data.
              </p>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <Header />
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-heading font-bold text-white mb-4">Data Export Center</h1>
            <p className="text-lg text-white/60 font-paragraph">
              Download and organize all collected data from your RED² studio. Export client information, bookings, galleries, and more.
            </p>
          </div>

          {/* Status Message with Progress Bar */}
          {exportStatus && (
            <div
              className={`mb-8 p-6 rounded-lg border ${
                exportStatus.includes('✓')
                  ? 'bg-green-950/30 border-green-900/50 text-green-300'
                  : exportStatus.includes('✗')
                    ? 'bg-red-950/30 border-red-900/50 text-red-300'
                    : 'bg-blue-950/30 border-blue-900/50 text-blue-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-3">
                {exportStatus.includes('✓') && <CheckCircle2 className="w-5 h-5" />}
                {exportStatus.includes('✗') && <AlertCircle className="w-5 h-5" />}
                {!exportStatus.includes('✓') && !exportStatus.includes('✗') && <LoadingSpinner />}
                <span className="font-paragraph">{exportStatus}</span>
              </div>
              {isExporting && (
                <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-blue-400 h-full transition-all duration-300"
                    style={{ width: `${exportProgress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Export Options */}
          <div className="mb-12 p-8 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/30">
            <h2 className="text-2xl font-heading font-bold text-white mb-6">Export Configuration</h2>

            {/* Format Selection */}
            <div className="mb-6">
              <label className="block text-white font-paragraph font-semibold mb-3">Export Format</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="json"
                    checked={selectedFormat === 'json'}
                    onChange={e => setSelectedFormat(e.target.value as 'json' | 'csv')}
                    disabled={isExporting}
                    className="w-4 h-4"
                  />
                  <span className="text-white/80 font-paragraph">JSON</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="csv"
                    checked={selectedFormat === 'csv'}
                    onChange={e => setSelectedFormat(e.target.value as 'json' | 'csv')}
                    disabled={isExporting}
                    className="w-4 h-4"
                  />
                  <span className="text-white/80 font-paragraph">CSV</span>
                </label>
              </div>
            </div>

            {/* PII Checkbox */}
            <div className="mb-6 p-4 bg-black/30 rounded border border-yellow-900/30">
              <label className="flex items-center gap-3 cursor-pointer">
                <Checkbox
                  checked={includePII}
                  onCheckedChange={checked => setIncludePII(checked === true)}
                  disabled={isExporting}
                />
                <div>
                  <p className="text-white font-paragraph font-semibold">Include Full PII</p>
                  <p className="text-white/60 text-sm font-paragraph">
                    When unchecked, sensitive fields (emails, access codes) will be redacted as [REDACTED]
                  </p>
                </div>
              </label>
            </div>

            {/* Collections Selection */}
            <div className="mb-6">
              <label className="block text-white font-paragraph font-semibold mb-3">Collections to Export</label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {Object.entries(dataStats).map(([name, count]) => (
                  <label key={name} className="flex items-center gap-3 cursor-pointer p-3 bg-black/30 rounded border border-white/10 hover:border-primary/50 transition-colors">
                    <Checkbox
                      checked={selectedCollections.has(name)}
                      onCheckedChange={() => toggleCollection(name)}
                      disabled={isExporting}
                    />
                    <div>
                      <p className="text-white font-paragraph font-medium">{name}</p>
                      <p className="text-white/50 text-sm font-paragraph">{count} records</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Export Button */}
            <Button
              onClick={() =>
                handleExportClick({
                  format: selectedFormat,
                  includePII,
                  collections: Array.from(selectedCollections),
                })
              }
              disabled={isExporting || selectedCollections.size === 0}
              className="w-full bg-primary hover:bg-primary/90 text-white font-paragraph py-6"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? `Exporting... ${exportProgress}%` : 'Export Selected Data'}
            </Button>
          </div>

          {/* Data Statistics */}
          <div>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">Data Overview</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dataStats).map(([name, count]) => (
                <div key={name} className="p-6 border border-white/10 rounded-lg bg-white/5 hover:bg-white/10 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-heading font-bold text-white">{name}</h3>
                      <p className="text-sm text-white/60 font-paragraph">
                        {count} record{count !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <FileJson className="w-5 h-5 text-primary/60" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 p-8 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-heading font-bold text-white mb-4">About Data Exports</h3>
            <ul className="space-y-3 text-white/70 font-paragraph">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Exports support JSON and CSV formats for easy integration</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Sensitive data is automatically redacted unless Full PII is enabled</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>All exports are logged in the audit trail for compliance</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Batch processing handles large datasets efficiently (500 items per batch)</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Files are automatically timestamped for version control</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent className="bg-black border border-white/20">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirm Data Export</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60">
              You are about to export {selectedCollections.size} collection(s) with{' '}
              {includePII ? 'full PII included' : 'sensitive data redacted'}. This action will be logged for audit purposes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 my-4 text-white/80 text-sm font-paragraph">
            <p>
              <strong>Format:</strong> {selectedFormat.toUpperCase()}
            </p>
            <p>
              <strong>Collections:</strong> {Array.from(selectedCollections).join(', ')}
            </p>
            <p>
              <strong>PII Status:</strong> {includePII ? 'Full PII Included' : 'Sensitive Data Redacted'}
            </p>
          </div>
          <div className="flex gap-3">
            <AlertDialogCancel className="bg-white/10 text-white hover:bg-white/20 border-white/20">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmExport}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Export
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function DataExportPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Sign in to access the data export center">
      <DataExportPageContent />
    </MemberProtectedRoute>
  );
}

export default React.memo(DataExportPage);
