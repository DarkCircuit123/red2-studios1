import React, { useState, useEffect } from 'react';
import { BaseCrudService } from '@/integrations';
import { MemberProtectedRoute } from '@/components/ui/member-protected-route';
import { useMember } from '@/integrations';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Download, FileJson, FileText, AlertCircle } from 'lucide-react';
import { exportData, prepareClientDataForExport, prepareBookingDataForExport, prepareGalleryDataForExport } from '@/lib/data-export';
import {
  BlogPosts,
  BookingAvailability,
  ClientProofingGalleries,
  ClientsPress,
  Portfolio,
  Services,
  TeamMembers,
} from '@/entities/index';

function DataExportPageContent() {
  const { member } = useMember();
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState<string | null>(null);
  const [dataStats, setDataStats] = useState<Record<string, number>>({});

  useEffect(() => {
    const loadDataStats = async () => {
      try {
        const [blogs, bookings, galleries, clients, portfolio, services, team] = await Promise.all([
          BaseCrudService.getAll<BlogPosts>('blogposts', {}, { limit: 1 }),
          BaseCrudService.getAll<BookingAvailability>('bookingavailability', {}, { limit: 1 }),
          BaseCrudService.getAll<ClientProofingGalleries>('clientgalleries', {}, { limit: 1 }),
          BaseCrudService.getAll<ClientsPress>('clientspress', {}, { limit: 1 }),
          BaseCrudService.getAll<Portfolio>('portfolio', {}, { limit: 1 }),
          BaseCrudService.getAll<Services>('services', {}, { limit: 1 }),
          BaseCrudService.getAll<TeamMembers>('teammembers', {}, { limit: 1 }),
        ]);

        setDataStats({
          'Blog Posts': blogs.totalCount || 0,
          'Bookings': bookings.totalCount || 0,
          'Client Galleries': galleries.totalCount || 0,
          'Clients & Press': clients.totalCount || 0,
          'Portfolio': portfolio.totalCount || 0,
          'Services': services.totalCount || 0,
          'Team Members': team.totalCount || 0,
        });
      } catch (error) {
        console.error('Failed to load data stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

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

  const handleExportAllData = async () => {
    setIsExporting(true);
    setExportStatus('Exporting all data...');

    try {
      const collections = [
        'blogposts',
        'bookingavailability',
        'clientgalleries',
        'clientspress',
        'portfolio',
        'services',
        'teammembers',
      ];

      const allData: Record<string, any[]> = {};

      for (const collectionId of collections) {
        const result = await BaseCrudService.getAll(collectionId, {}, { limit: 1000 });
        allData[collectionId] = result.items || [];
      }

      // Create comprehensive export
      const exportPayload = {
        exportDate: new Date().toISOString(),
        exportedBy: member?.profile?.nickname || 'Admin',
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
      <div className="min-h-screen bg-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Header />
      <main className="pt-32 pb-20">
        <div className="max-w-4xl mx-auto px-8">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-5xl font-heading font-bold text-black mb-4">Data Export Center</h1>
            <p className="text-lg text-black/60 font-paragraph">
              Download and organize all collected data from your RED² studio. Export client information, bookings, galleries, and more.
            </p>
          </div>

          {/* Status Message */}
          {exportStatus && (
            <div className={`mb-8 p-4 rounded-lg flex items-center gap-3 ${
              exportStatus.includes('✓') 
                ? 'bg-green-50 text-green-900 border border-green-200' 
                : exportStatus.includes('✗')
                ? 'bg-red-50 text-red-900 border border-red-200'
                : 'bg-blue-50 text-blue-900 border border-blue-200'
            }`}>
              {exportStatus.includes('✓') && <Download className="w-5 h-5" />}
              {exportStatus.includes('✗') && <AlertCircle className="w-5 h-5" />}
              {!exportStatus.includes('✓') && !exportStatus.includes('✗') && <LoadingSpinner />}
              <span className="font-paragraph">{exportStatus}</span>
            </div>
          )}

          {/* Quick Export All */}
          <div className="mb-12 p-8 bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg border border-primary/20">
            <h2 className="text-2xl font-heading font-bold text-black mb-3">Quick Export</h2>
            <p className="text-black/60 font-paragraph mb-6">
              Export all data at once in a single comprehensive file.
            </p>
            <Button
              onClick={handleExportAllData}
              disabled={isExporting}
              className="bg-primary hover:bg-primary/90 text-white font-paragraph"
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Exporting...' : 'Export All Data'}
            </Button>
          </div>

          {/* Individual Collections */}
          <div>
            <h2 className="text-2xl font-heading font-bold text-black mb-6">Export by Collection</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(dataStats).map(([name, count]) => {
                const collectionMap: Record<string, string> = {
                  'Blog Posts': 'blogposts',
                  'Bookings': 'bookingavailability',
                  'Client Galleries': 'clientgalleries',
                  'Clients & Press': 'clientspress',
                  'Portfolio': 'portfolio',
                  'Services': 'services',
                  'Team Members': 'teammembers',
                };

                return (
                  <div
                    key={name}
                    className="p-6 border border-black/10 rounded-lg hover:border-primary/30 hover:bg-primary/5 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-heading font-bold text-black">{name}</h3>
                        <p className="text-sm text-black/60 font-paragraph">
                          {count} record{count !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <FileJson className="w-5 h-5 text-primary/60" />
                    </div>
                    <Button
                      onClick={() => handleExportCollection(collectionMap[name], name)}
                      disabled={isExporting || count === 0}
                      variant="outline"
                      className="w-full font-paragraph"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Info Section */}
          <div className="mt-12 p-8 bg-black/5 rounded-lg border border-black/10">
            <h3 className="text-lg font-heading font-bold text-black mb-4">About Data Exports</h3>
            <ul className="space-y-3 text-black/70 font-paragraph">
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>All exports are in JSON format for easy integration with backend systems</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Exports include metadata such as creation dates and modification timestamps</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>Files are automatically timestamped for version control</span>
              </li>
              <li className="flex gap-3">
                <span className="text-primary font-bold">•</span>
                <span>All data is organized and ready for backend storage and analysis</span>
              </li>
            </ul>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

export default function DataExportPage() {
  return (
    <MemberProtectedRoute messageToSignIn="Sign in to access the data export center">
      <DataExportPageContent />
    </MemberProtectedRoute>
  );
}
