/**
 * Data Export Utility
 * Handles exporting collected data to various formats for backend storage
 */

export interface ExportOptions {
  format: 'json' | 'csv' | 'xlsx';
  includeTimestamp?: boolean;
  includeMetadata?: boolean;
}

export interface DataExportResult {
  success: boolean;
  filename: string;
  size: number;
  timestamp: string;
  format: string;
}

/**
 * Convert data to CSV format
 */
function convertToCSV(data: any[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.map(h => `"${h}"`).join(',');

  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`;
      if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
      return String(value);
    }).join(',');
  });

  return [csvHeaders, ...csvRows].join('\n');
}

/**
 * Convert data to JSON format
 */
function convertToJSON(data: any[], includeMetadata = true): string {
  const exportData = {
    ...(includeMetadata && {
      metadata: {
        exportDate: new Date().toISOString(),
        recordCount: data.length,
        version: '1.0',
      },
    }),
    data,
  };

  return JSON.stringify(exportData, null, 2);
}

/**
 * Export data to file
 */
export async function exportData(
  data: any[],
  filename: string,
  options: ExportOptions = { format: 'json', includeTimestamp: true, includeMetadata: true }
): Promise<DataExportResult> {
  try {
    let content = '';
    let mimeType = 'application/json';
    let fileExtension = 'json';

    switch (options.format) {
      case 'csv':
        content = convertToCSV(data);
        mimeType = 'text/csv;charset=utf-8;';
        fileExtension = 'csv';
        break;
      case 'json':
      default:
        content = convertToJSON(data, options.includeMetadata);
        mimeType = 'application/json;charset=utf-8;';
        fileExtension = 'json';
        break;
    }

    // Add timestamp to filename if requested
    const timestamp = options.includeTimestamp ? `_${new Date().toISOString().split('T')[0]}` : '';
    const finalFilename = `${filename}${timestamp}.${fileExtension}`;

    // Create blob and download
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', finalFilename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    return {
      success: true,
      filename: finalFilename,
      size: blob.size,
      timestamp: new Date().toISOString(),
      format: options.format,
    };
  } catch (error) {
    console.error('Data export failed:', error);
    throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Prepare client data for export
 */
export function prepareClientDataForExport(clientData: any) {
  return {
    ...clientData,
    exportedAt: new Date().toISOString(),
    dataVersion: '1.0',
  };
}

/**
 * Prepare booking data for export
 */
export function prepareBookingDataForExport(bookings: any[]) {
  return bookings.map(booking => ({
    ...booking,
    formattedDate: new Date(booking.bookingDate).toLocaleDateString(),
    formattedTime: booking.startTime,
  }));
}

/**
 * Prepare gallery data for export
 */
export function prepareGalleryDataForExport(galleries: any[]) {
  return galleries.map(gallery => ({
    ...gallery,
    formattedExpirationDate: gallery.galleryExpirationDate ? new Date(gallery.galleryExpirationDate).toLocaleDateString() : 'N/A',
    isExpired: gallery.galleryExpirationDate ? new Date(gallery.galleryExpirationDate) < new Date() : false,
  }));
}

/**
 * Batch export multiple data types
 */
export async function batchExportData(
  dataCollections: Record<string, any[]>,
  baseFilename: string,
  options: ExportOptions = { format: 'json', includeTimestamp: true, includeMetadata: true }
): Promise<DataExportResult[]> {
  const results: DataExportResult[] = [];

  for (const [collectionName, data] of Object.entries(dataCollections)) {
    try {
      const result = await exportData(data, `${baseFilename}_${collectionName}`, options);
      results.push(result);
    } catch (error) {
      console.error(`Failed to export ${collectionName}:`, error);
    }
  }

  return results;
}

/**
 * Generate data summary report
 */
export function generateDataSummary(dataCollections: Record<string, any[]>): string {
  const summary = {
    generatedAt: new Date().toISOString(),
    collections: Object.entries(dataCollections).map(([name, data]) => ({
      name,
      recordCount: data.length,
      fields: data.length > 0 ? Object.keys(data[0]) : [],
    })),
    totalRecords: Object.values(dataCollections).reduce((sum, data) => sum + data.length, 0),
  };

  return JSON.stringify(summary, null, 2);
}
