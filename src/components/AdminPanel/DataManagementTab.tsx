/**
 * Data Management Tab for Admin Panel
 * Allows admins to view and export all collected data
 */

import React, { useState, useEffect } from 'react';
import { Download, RefreshCw, AlertCircle } from 'lucide-react';
import { BaseCrudService } from '@/integrations';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { exportData } from '@/lib/data-export';

interface DataStats {
  [key: string]: {
    count: number;
    lastUpdated: string;
  };
}

export function DataManagementTab() {
  const [dataStats, setDataStats] = useState<DataStats>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);

  const collections = [
    { id: 'blogposts', name: 'Blog Posts' },
    { id: 'bookingavailability', name: 'Bookings' },
    { id: 'clientgalleries', name: 'Client Galleries' },
    { id: 'clientspress', name: 'Clients & Press' },
    { id: 'portfolio', name: 'Portfolio' },
    { id: 'services', name: 'Services' },
    { id: 'teammembers', name: 'Team Members' },
  ];

  const loadDataStats = async () => {
    setIsLoading(true);
    try {
      const stats: DataStats = {};

      for (const collection of collections) {
        const result = await BaseCrudService.getAll(collection.id, {}, { limit: 1 });
        stats[collection.id] = {
          count: result.totalCount || 0,
          lastUpdated: new Date().toLocaleString(),
        };
      }

      setDataStats(stats);
    } catch (error) {
      console.error('Failed to load data stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDataStats();
  }, []);

  const handleExportCollection = async (collectionId: string, collectionName: string) => {
    setIsExporting(true);
    setExportStatus(`Exporting ${collectionName}...`);

    try {
      const result = await BaseCrudService.getAll(collectionId, {}, { limit: 1000 });
      const data = result.items || [];

      await exportData(data, `${collectionName}_export`, {
        format: 'json',
        includeTimestamp: true,
        includeMetadata: true,
      });

      setExportStatus(`✓ ${collectionName} exported successfully!`);
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus(`✗ Failed to export ${collectionName}`);
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    setExportStatus('Exporting all data...');

    try {
      const allData: Record<string, any[]> = {};

      for (const collection of collections) {
        const result = await BaseCrudService.getAll(collection.id, {}, { limit: 1000 });
        allData[collection.id] = result.items || [];
      }

      const exportPayload = {
        exportDate: new Date().toISOString(),
        totalRecords: Object.values(allData).reduce((sum, arr) => sum + arr.length, 0),
        collections: allData,
      };

      await exportData([exportPayload], 'complete_data_export', {
        format: 'json',
        includeTimestamp: true,
        includeMetadata: true,
      });

      setExportStatus('✓ All data exported successfully!');
      setTimeout(() => setExportStatus(null), 3000);
    } catch (error) {
      setExportStatus('✗ Failed to export all data');
      console.error('Batch export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-sm font-heading font-bold text-black mb-2 uppercase tracking-wide">
          Data Management
        </h3>
        <p className="text-xs text-black/60 font-paragraph">
          View and export all collected data from your studio
        </p>
      </div>

      {/* Status Message */}
      {exportStatus && (
        <div className={`p-3 rounded text-xs flex items-center gap-2 ${
          exportStatus.includes('✓')
            ? 'bg-green-50 text-green-900 border border-green-200'
            : exportStatus.includes('✗')
            ? 'bg-red-50 text-red-900 border border-red-200'
            : 'bg-blue-50 text-blue-900 border border-blue-200'
        }`}>
          {exportStatus.includes('✓') && <Download className="w-4 h-4" />}
          {exportStatus.includes('✗') && <AlertCircle className="w-4 h-4" />}
          {!exportStatus.includes('✓') && !exportStatus.includes('✗') && <LoadingSpinner />}
          <span>{exportStatus}</span>
        </div>
      )}

      {/* Quick Export All */}
      <div className="p-4 bg-primary/5 rounded border border-primary/20">
        <Button
          onClick={handleExportAll}
          disabled={isExporting}
          className="w-full bg-primary hover:bg-primary/90 text-white text-xs"
        >
          <Download className="w-3 h-3 mr-2" />
          {isExporting ? 'Exporting...' : 'Export All Data'}
        </Button>
      </div>

      {/* Individual Collections */}
      <div className="space-y-2">
        {collections.map((collection) => (
          <div
            key={collection.id}
            className="p-3 border border-black/10 rounded flex items-center justify-between hover:bg-black/5 transition-colors"
          >
            <div className="flex-1">
              <p className="text-xs font-heading font-bold text-black">{collection.name}</p>
              <p className="text-xs text-black/60">
                {dataStats[collection.id]?.count || 0} records
              </p>
            </div>
            <Button
              onClick={() => handleExportCollection(collection.id, collection.name)}
              disabled={isExporting || (dataStats[collection.id]?.count || 0) === 0}
              variant="outline"
              className="text-xs py-1 px-2 h-auto"
            >
              <Download className="w-3 h-3" />
            </Button>
          </div>
        ))}
      </div>

      {/* Refresh Button */}
      <Button
        onClick={loadDataStats}
        disabled={isLoading}
        variant="outline"
        className="w-full text-xs"
      >
        <RefreshCw className="w-3 h-3 mr-2" />
        Refresh Stats
      </Button>
    </div>
  );
}

export default DataManagementTab;
