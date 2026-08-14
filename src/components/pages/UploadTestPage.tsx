/**
 * Upload Test Page - Dedicated page for running production upload tests
 * This page provides a clean interface to execute upload tests
 */

import { Suspense } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export default function UploadTestPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />
      
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Production Upload Test</h1>
          <p className="text-gray-600 text-lg">
            Upload testing functionality is available through the admin panel
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center">Loading...</div>}>
          <div className="bg-white rounded-lg shadow p-8">
            <p className="text-gray-700">
              Please access upload testing features through the admin dashboard.
            </p>
          </div>
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
