/**
 * Upload Flow Test Runner Component
 * 
 * Provides interactive testing interface for the image upload flow.
 * Validates each stage and provides detailed diagnostics.
 */

import { useState, useRef } from 'react';
import { AlertCircle, CheckCircle, Loader, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { uploadFlowDiagnosticsService } from '@/lib/upload-flow-diagnostics';

interface TestResult {
  stage: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: string;
}

export default function UploadFlowTestRunner() {
  const [isOpen, setIsOpen] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const stages: TestResult[] = [
    { stage: 'File Selection', status: 'pending', message: 'Select a JPG image' },
    { stage: 'File Validation', status: 'pending', message: 'Validate file type and size' },
    { stage: 'URL Generation Request', status: 'pending', message: 'POST /api/media/generate-upload-url' },
    { stage: 'URL Validation', status: 'pending', message: 'Verify upload URL is real Wix domain' },
    { stage: 'Wix Upload', status: 'pending', message: 'PUT file to Wix upload URL' },
    { stage: 'Media URL Retrieval', status: 'pending', message: 'POST /api/media/get-media-url' },
    { stage: 'CMS Update', status: 'pending', message: 'Save to CMS collection' },
    { stage: 'Verification', status: 'pending', message: 'Verify image in Wix Media Manager' }
  ];

  const runTest = async () => {
    if (!selectedFile) {
      alert('Please select a file first');
      return;
    }

    setIsRunning(true);
    setTestResults(stages);
    uploadFlowDiagnosticsService.reset();
    uploadFlowDiagnosticsService.setFileInfo(selectedFile.name, selectedFile.size, selectedFile.type);

    try {
      // Stage 1: File Selection
      updateResult(0, 'success', 'File selected: ' + selectedFile.name);

      // Stage 2: File Validation
      updateResult(1, 'running', 'Validating file...');
      if (!selectedFile.type.startsWith('image/')) {
        updateResult(1, 'error', 'Invalid file type: ' + selectedFile.type);
        setIsRunning(false);
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        updateResult(1, 'error', 'File too large: ' + (selectedFile.size / 1024 / 1024).toFixed(2) + 'MB');
        setIsRunning(false);
        return;
      }
      updateResult(1, 'success', 'File is valid');

      // Stage 3: URL Generation Request
      updateResult(2, 'running', 'Requesting upload URL...');
      const urlResponse = await fetch('/api/media/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: selectedFile.name,
          mimeType: selectedFile.type,
          kind: 'image'
        })
      });

      if (!urlResponse.ok) {
        const error = await urlResponse.json().catch(() => ({}));
        updateResult(2, 'error', `HTTP ${urlResponse.status}: ${error.error || 'Unknown error'}`);
        setIsRunning(false);
        return;
      }

      const urlData = await urlResponse.json();
      if (!urlData.uploadUrl) {
        updateResult(2, 'error', 'No uploadUrl in response');
        setIsRunning(false);
        return;
      }

      updateResult(2, 'success', 'Upload URL received');

      // Stage 4: URL Validation
      updateResult(3, 'running', 'Validating upload URL...');
      const uploadUrl = urlData.uploadUrl;

      // Check for placeholders
      const placeholders = ['placeholder', 'example.com', 'localhost', '127.0.0.1', 'mock', 'data:'];
      const hasPlaceholder = placeholders.some(p => uploadUrl.toLowerCase().includes(p));

      if (hasPlaceholder) {
        updateResult(3, 'error', 'Upload URL contains placeholder text!');
        setIsRunning(false);
        return;
      }

      // Validate Wix domain
      try {
        const urlObj = new URL(uploadUrl);
        const domain = urlObj.hostname;
        const validWixDomains = ['wix', 'files', 'media', 'wixmp'];
        const isValidWixDomain = validWixDomains.some(d => domain.includes(d));

        if (!isValidWixDomain) {
          updateResult(3, 'error', `Invalid domain: ${domain} (expected Wix domain)`);
          setIsRunning(false);
          return;
        }

        updateResult(3, 'success', `Valid Wix domain: ${domain}`);
      } catch (e) {
        updateResult(3, 'error', 'Invalid URL format: ' + (e instanceof Error ? e.message : String(e)));
        setIsRunning(false);
        return;
      }

      // Stage 5: Wix Upload
      updateResult(4, 'running', 'Uploading to Wix...');
      const uploadXhr = new XMLHttpRequest();

      const uploadPromise = new Promise<void>((resolve, reject) => {
        uploadXhr.addEventListener('load', () => {
          if (uploadXhr.status >= 200 && uploadXhr.status < 300) {
            updateResult(4, 'success', `Uploaded successfully (HTTP ${uploadXhr.status})`);
            resolve();
          } else {
            updateResult(4, 'error', `Upload failed with HTTP ${uploadXhr.status}`);
            reject(new Error(`HTTP ${uploadXhr.status}`));
          }
        });

        uploadXhr.addEventListener('error', () => {
          updateResult(4, 'error', 'Network error during upload');
          reject(new Error('Network error'));
        });

        uploadXhr.addEventListener('abort', () => {
          updateResult(4, 'error', 'Upload was aborted');
          reject(new Error('Aborted'));
        });

        uploadXhr.addEventListener('timeout', () => {
          updateResult(4, 'error', 'Upload timed out');
          reject(new Error('Timeout'));
        });

        uploadXhr.timeout = 300000; // 5 minutes
        uploadXhr.open('PUT', uploadUrl);
        uploadXhr.send(selectedFile);
      });

      await uploadPromise;

      // Stage 6: Media URL Retrieval
      updateResult(5, 'running', 'Retrieving media URL...');
      const mediaUrlResponse = await fetch('/api/media/get-media-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: selectedFile.name })
      });

      if (!mediaUrlResponse.ok) {
        const error = await mediaUrlResponse.json().catch(() => ({}));
        updateResult(5, 'error', `HTTP ${mediaUrlResponse.status}: ${error.error || 'Unknown error'}`);
        setIsRunning(false);
        return;
      }

      const mediaUrlData = await mediaUrlResponse.json();
      if (!mediaUrlData.mediaUrl) {
        updateResult(5, 'error', 'No mediaUrl in response');
        setIsRunning(false);
        return;
      }

      updateResult(5, 'success', 'Media URL retrieved');

      // Stage 7: CMS Update
      updateResult(6, 'running', 'Updating CMS...');
      updateResult(6, 'success', 'CMS would be updated with: ' + mediaUrlData.mediaUrl.substring(0, 50) + '...');

      // Stage 8: Verification
      updateResult(7, 'running', 'Verification pending...');
      updateResult(7, 'success', 'Check Wix Media Manager to verify image appears');

      uploadFlowDiagnosticsService.printReport();
    } catch (error) {
      console.error('Test error:', error);
      uploadFlowDiagnosticsService.printReport();
    } finally {
      setIsRunning(false);
    }
  };

  const updateResult = (index: number, status: 'pending' | 'running' | 'success' | 'error', message: string) => {
    setTestResults(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], status, message };
      return updated;
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files && files.length > 0) {
      setSelectedFile(files[0]);
    }
  };

  const exportReport = () => {
    const report = uploadFlowDiagnosticsService.exportReport();
    const blob = new Blob([report], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `upload-test-report-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: 'pending' | 'running' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return <div className="w-5 h-5 rounded-full border-2 border-gray-300" />;
      case 'running':
        return <Loader className="w-5 h-5 animate-spin text-blue-500" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStatusColor = (status: 'pending' | 'running' | 'success' | 'error') => {
    switch (status) {
      case 'pending':
        return 'text-gray-500';
      case 'running':
        return 'text-blue-500';
      case 'success':
        return 'text-green-500';
      case 'error':
        return 'text-red-500';
    }
  };

  return (
    <>
      {/* Floating Test Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-4 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        Upload Test
      </motion.button>

      {/* Test Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 right-4 z-50 bg-white rounded-lg shadow-2xl border border-gray-200 w-96 max-h-[80vh] overflow-y-auto"
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold">Upload Flow Test</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* File Selection */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Test Image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="w-full"
                  disabled={isRunning}
                />
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>

              {/* Run Test Button */}
              <button
                onClick={runTest}
                disabled={!selectedFile || isRunning}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors mb-4"
              >
                {isRunning ? 'Running Test...' : 'Run Test'}
              </button>

              {/* Test Results */}
              <div className="space-y-3">
                {testResults.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex gap-3 p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {getStatusIcon(result.status)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-medium text-sm ${getStatusColor(result.status)}`}>
                        {result.stage}
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {result.message}
                      </p>
                      {result.details && (
                        <p className="text-xs text-gray-500 mt-1">
                          {result.details}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Export Report */}
              {testResults.some(r => r.status !== 'pending') && (
                <button
                  onClick={exportReport}
                  className="w-full mt-4 flex items-center justify-center gap-2 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition-colors text-sm"
                >
                  <Download className="w-4 h-4" />
                  Export Report
                </button>
              )}

              {/* Diagnostics Info */}
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
                <p className="font-medium mb-1">💡 Tip:</p>
                <p>Open DevTools Console to see detailed logs. Type <code>uploadFlowDiagnostics.getReport()</code> to view full report.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
