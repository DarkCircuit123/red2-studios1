/**
 * Image Recovery Diagnostics Component
 * Displays detailed information about portfolio images and recovery status
 */

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle, RefreshCw, Download } from 'lucide-react';
import { scanPortfolioImages, fixBrokenImageLinks, fixDisplayOrder } from '@/lib/portfolio-image-recovery';
import { BaseCrudService } from '@/integrations';
import { Portfolio } from '@/entities';

interface DiagnosticStats {
  totalImages: number;
  validImages: number;
  brokenLinks: number;
  missingPortfolioIds: number;
  missingDisplayOrder: number;
  loading: boolean;
  error: string | null;
}

export default function ImageRecoveryDiagnostics() {
  const [stats, setStats] = useState<DiagnosticStats>({
    totalImages: 0,
    validImages: 0,
    brokenLinks: 0,
    missingPortfolioIds: 0,
    missingDisplayOrder: 0,
    loading: true,
    error: null,
  });

  const [recoveryLog, setRecoveryLog] = useState<string[]>([]);
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true, error: null }));
      const log: string[] = [];

      log.push('[DIAGNOSTIC] Starting image recovery diagnostics...');

      // Fetch all images
      const result = await BaseCrudService.getAll<Portfolio>(
        'portfolioimages',
        {},
        { limit: 1000 }
      );

      log.push(`[DIAGNOSTIC] Found ${result.items.length} total images`);

      let validCount = 0;
      let brokenCount = 0;
      let missingPortfolioIds = 0;
      let missingDisplayOrder = 0;

      for (const item of result.items) {
        if (!item.image) {
          brokenCount++;
          log.push(`[BROKEN] Image ${item._id} has no URL`);
        } else {
          validCount++;
        }

        if (!item.portfolioItemId) {
          missingPortfolioIds++;
          log.push(`[MISSING_ID] Image ${item._id} missing portfolioItemId`);
        }

        if (item.displayOrder === undefined || item.displayOrder === null) {
          missingDisplayOrder++;
          log.push(`[MISSING_ORDER] Image ${item._id} missing displayOrder`);
        }
      }

      log.push(`[DIAGNOSTIC] Scan complete: ${validCount} valid, ${brokenCount} broken`);

      setStats({
        totalImages: result.items.length,
        validImages: validCount,
        brokenLinks: brokenCount,
        missingPortfolioIds,
        missingDisplayOrder,
        loading: false,
        error: null,
      });

      setRecoveryLog(log);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setStats(prev => ({
        ...prev,
        loading: false,
        error: errorMsg,
      }));
      setRecoveryLog(prev => [...prev, `[ERROR] ${errorMsg}`]);
    }
  };

  const handleFixLinks = async () => {
    try {
      setIsRecovering(true);
      const log: string[] = [];
      log.push('[RECOVERY] Starting link fix...');

      const result = await fixBrokenImageLinks();
      log.push(`[RECOVERY] Fixed ${result.fixed} links`);
      log.push(`[RECOVERY] Valid images: ${result.validImages}`);
      log.push(`[RECOVERY] Broken links remaining: ${result.brokenLinks}`);

      if (result.errors.length > 0) {
        log.push(`[RECOVERY] Errors: ${result.errors.length}`);
        result.errors.forEach(err => log.push(`  - ${err}`));
      }

      setRecoveryLog(prev => [...prev, ...log]);
      await runDiagnostics();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setRecoveryLog(prev => [...prev, `[ERROR] Fix failed: ${errorMsg}`]);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleFixOrder = async () => {
    try {
      setIsRecovering(true);
      const log: string[] = [];
      log.push('[RECOVERY] Starting display order fix...');

      const result = await fixDisplayOrder();
      log.push(`[RECOVERY] Fixed ${result.fixed} display orders`);

      if (result.errors.length > 0) {
        log.push(`[RECOVERY] Errors: ${result.errors.length}`);
        result.errors.forEach(err => log.push(`  - ${err}`));
      }

      setRecoveryLog(prev => [...prev, ...log]);
      await runDiagnostics();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      setRecoveryLog(prev => [...prev, `[ERROR] Order fix failed: ${errorMsg}`]);
    } finally {
      setIsRecovering(false);
    }
  };

  const downloadLog = () => {
    const logText = recoveryLog.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `image-recovery-log-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="w-full space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-blue-600 font-medium">Total Images</p>
              <p className="text-2xl font-bold text-blue-900 mt-1">{stats.totalImages}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-blue-500" />
          </div>
        </Card>

        <Card className="p-4 border border-green-200 bg-green-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-green-600 font-medium">Valid Images</p>
              <p className="text-2xl font-bold text-green-900 mt-1">{stats.validImages}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </Card>

        <Card className="p-4 border border-red-200 bg-red-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-red-600 font-medium">Broken Links</p>
              <p className="text-2xl font-bold text-red-900 mt-1">{stats.brokenLinks}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
        </Card>
      </div>

      {/* Issues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-4 border border-amber-200 bg-amber-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-amber-600 font-medium">Missing Portfolio IDs</p>
              <p className="text-2xl font-bold text-amber-900 mt-1">{stats.missingPortfolioIds}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-amber-500" />
          </div>
        </Card>

        <Card className="p-4 border border-purple-200 bg-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-purple-600 font-medium">Missing Display Order</p>
              <p className="text-2xl font-bold text-purple-900 mt-1">{stats.missingDisplayOrder}</p>
            </div>
            <AlertCircle className="w-8 h-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Error Display */}
      {stats.error && (
        <Card className="p-4 border border-red-200 bg-red-50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-900">Diagnostic Error</p>
              <p className="text-sm text-red-700 mt-1">{stats.error}</p>
            </div>
          </div>
        </Card>
      )}

      {/* Recovery Actions */}
      <Card className="p-4 border border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 mb-4">Recovery Actions</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button
            onClick={runDiagnostics}
            disabled={stats.loading || isRecovering}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {stats.loading ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Scanning...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Re-scan
              </>
            )}
          </Button>

          <Button
            onClick={handleFixLinks}
            disabled={stats.brokenLinks === 0 || isRecovering}
            className="flex-1 bg-amber-600 hover:bg-amber-700 text-white disabled:opacity-50"
          >
            {isRecovering ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Fixing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Fix Links ({stats.brokenLinks})
              </>
            )}
          </Button>

          <Button
            onClick={handleFixOrder}
            disabled={stats.missingDisplayOrder === 0 || isRecovering}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white disabled:opacity-50"
          >
            {isRecovering ? (
              <>
                <LoadingSpinner className="w-4 h-4 mr-2" />
                Fixing...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4 mr-2" />
                Fix Order ({stats.missingDisplayOrder})
              </>
            )}
          </Button>

          <Button
            onClick={downloadLog}
            className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Log
          </Button>
        </div>
      </Card>

      {/* Recovery Log */}
      <Card className="p-4 border border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 mb-3">Recovery Log</h3>
        <div className="bg-slate-900 text-slate-100 p-3 rounded font-mono text-xs overflow-auto max-h-64 space-y-1">
          {recoveryLog.length === 0 ? (
            <div className="text-slate-500">No log entries yet...</div>
          ) : (
            recoveryLog.map((line, idx) => (
              <div key={idx} className={`${
                line.includes('[ERROR]') ? 'text-red-400' :
                line.includes('[RECOVERY]') ? 'text-green-400' :
                line.includes('[DIAGNOSTIC]') ? 'text-blue-400' :
                line.includes('[BROKEN]') ? 'text-red-300' :
                line.includes('[MISSING]') ? 'text-amber-300' :
                'text-slate-300'
              }`}>
                {line}
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
