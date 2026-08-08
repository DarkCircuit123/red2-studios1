import { useEffect, useState } from 'react';
import { IMAGE_COLLECTIONS } from '@/lib/cms-image-validator';
import {
  queryPortfolioImagesCollection,
  auditAllCollections,
  generateAuditReportText,
  type FullAuditReport,
  type AuditItem,
} from '@/lib/audit-placeholder-data';

export default function AuditPlaceholderDataPage() {
  const [portfolioImagesData, setPortfolioImagesData] = useState<AuditItem[]>([]);
  const [auditReport, setAuditReport] = useState<FullAuditReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const runAudit = async () => {
      try {
        setLoading(true);
        setError(null);

        // Step 1: Query portfolioimages collection
        console.log('Step 1: Querying portfolioimages collection...');
        const portfolioImages = await queryPortfolioImagesCollection();
        setPortfolioImagesData(portfolioImages);
        console.log(`Found ${portfolioImages.length} items in portfolioimages collection`);

        // Step 2 & 3: Audit all collections
        console.log('Step 2-3: Auditing all collections...');
        const report = await auditAllCollections(IMAGE_COLLECTIONS);
        setAuditReport(report);

        // Log the report
        const reportText = generateAuditReportText(report);
        console.log(reportText);
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        setError(message);
        console.error('Audit failed:', err);
      } finally {
        setLoading(false);
      }
    };

    runAudit();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4">CMS Placeholder Data Audit</h1>
          <p className="text-gray-600">Running audit... Please wait.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-4 text-red-600">Audit Error</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">CMS Placeholder Data Audit Report</h1>

        {/* STEP 1: Portfolio Images Collection */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
            STEP 1: portfolioimages Collection Query
          </h2>
          <p className="text-gray-600 mb-4">
            Total items found: <span className="font-bold text-lg">{portfolioImagesData.length}</span>
          </p>

          {portfolioImagesData.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border border-gray-300 p-3 text-left font-bold">_id</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">imageUrl</th>
                    <th className="border border-gray-300 p-3 text-left font-bold">altText</th>
                  </tr>
                </thead>
                <tbody>
                  {portfolioImagesData.map((item, idx) => (
                    <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="border border-gray-300 p-3 font-mono text-sm break-all">
                        {item._id}
                      </td>
                      <td className="border border-gray-300 p-3 font-mono text-sm break-all text-red-600">
                        {item.imageUrl || '(empty)'}
                      </td>
                      <td className="border border-gray-300 p-3 text-sm">
                        {item.altText || '(empty)'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-600">No items found in portfolioimages collection.</p>
          )}
        </section>

        {/* STEP 2-3: Cross-Collection Audit */}
        {auditReport && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-4 border-b-2 border-gray-300 pb-2">
              STEP 2-3: Cross-Collection Audit
            </h2>

            {/* Summary */}
            <div className="bg-gray-50 p-6 rounded-lg mb-8 border border-gray-200">
              <h3 className="text-xl font-bold mb-4">Summary</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-600">Collections Audited</p>
                  <p className="text-2xl font-bold">
                    {auditReport.summary.totalCollectionsAudited}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Total Items</p>
                  <p className="text-2xl font-bold">
                    {auditReport.summary.totalItemsAcrossCollections}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Items with Placeholders</p>
                  <p className="text-2xl font-bold text-red-600">
                    {auditReport.summary.totalItemsWithPlaceholders}
                  </p>
                </div>
                <div>
                  <p className="text-gray-600">Unique Placeholder URLs</p>
                  <p className="text-2xl font-bold text-red-600">
                    {auditReport.summary.totalUniquePlaceholderUrls}
                  </p>
                </div>
              </div>
            </div>

            {/* Collection Details */}
            <div className="space-y-8">
              {auditReport.collections.map(collection => (
                <div key={collection.collectionId} className="border border-gray-300 rounded-lg p-6">
                  <h3 className="text-lg font-bold mb-3">{collection.collectionId}</h3>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-600">Total Items</p>
                      <p className="text-lg font-bold">{collection.totalItems}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Items with Placeholders</p>
                      <p className={`text-lg font-bold ${collection.itemsWithPlaceholders > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {collection.itemsWithPlaceholders}
                      </p>
                    </div>
                  </div>

                  {collection.uniquePlaceholderUrls.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-bold text-gray-700 mb-2">Unique Placeholder URLs:</p>
                      <ul className="space-y-1">
                        {collection.uniquePlaceholderUrls.map((url, idx) => (
                          <li key={idx} className="text-sm font-mono bg-red-50 p-2 rounded text-red-700 break-all">
                            {url}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {collection.placeholderItems.length > 0 && (
                    <div>
                      <p className="text-sm font-bold text-gray-700 mb-2">Placeholder Items:</p>
                      <div className="space-y-2">
                        {collection.placeholderItems.map((item, idx) => (
                          <div key={idx} className="bg-gray-50 p-3 rounded text-sm">
                            <p className="font-mono text-gray-700">
                              <span className="font-bold">_id:</span> {item._id}
                            </p>
                            <p className="text-gray-600">
                              <span className="font-bold">Field:</span> {item.field}
                            </p>
                            <p className="font-mono text-red-600 break-all">
                              <span className="font-bold">URL:</span> {item.url}
                            </p>
                            {item.altText && (
                              <p className="text-gray-600">
                                <span className="font-bold">Alt Text:</span> {item.altText}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Console Output Instructions */}
        <section className="bg-blue-50 p-6 rounded-lg border border-blue-200">
          <h3 className="text-lg font-bold mb-2">📋 Full Report Available in Console</h3>
          <p className="text-gray-700">
            Open your browser's Developer Console (F12) to see the complete formatted audit report. Look for the message starting with "CMS PLACEHOLDER DATA AUDIT REPORT".
          </p>
        </section>
      </div>
    </div>
  );
}
