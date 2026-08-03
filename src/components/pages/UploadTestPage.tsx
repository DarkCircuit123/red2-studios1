/**
 * Upload Test Page - Dedicated page for running production upload tests
 * This page provides a clean interface to execute the UploadProductionTest
 */

import { Suspense } from 'react';
import UploadProductionTest from '@/components/UploadProductionTest';
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
            Execute a complete end-to-end upload test to verify Wix Media Manager integration
          </p>
        </div>

        <Suspense fallback={<div className="p-8 text-center">Loading test component...</div>}>
          <UploadProductionTest />
        </Suspense>
      </main>

      <Footer />
    </div>
  );
}
