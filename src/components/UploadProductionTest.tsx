/**
 * Production Upload Test - Real End-to-End Test
 * 
 * This component executes a complete upload test:
 * 1. Creates a real test JPG file
 * 2. Calls generateUploadUrl backend endpoint
 * 3. Uploads the file to Wix Media Manager
 * 4. Retrieves the media URL
 * 5. Verifies the image exists in Wix Media Manager
 * 6. Captures all request/response details
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Upload, CheckCircle, AlertCircle, Loader, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message: string;
  details?: Record<string, any>;
  error?: string;
  duration?: number;
}

interface TestLog {
  timestamp: string;
  level: 'info' | 'success' | 'error' | 'warning';
  message: string;
  data?: Record<string, any>;
}

export default function UploadProductionTest() {
  const [isRunning, setIsRunning] = useState(false);
  const [steps, setSteps] = useState<TestStep[]>([]);
  const [logs, setLogs] = useState<TestLog[]>([]);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    mediaUrl?: string;
    mediaId?: string;
    fileName?: string;
    uploadDuration?: number;
  } | null>(null);

  const addLog = (level: TestLog['level'], message: string, data?: Record<string, any>) => {
    const log: TestLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data
    };
    setLogs(prev => [...prev, log]);
    console.log(`[TEST] [${level.toUpperCase()}] ${message}`, data);
  };

  const updateStep = (index: number, updates: Partial<TestStep>) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], ...updates };
      return newSteps;
    });
  };

  const addStep = (name: string): number => {
    const step: TestStep = {
      name,
      status: 'pending',
      message: 'Waiting to run...'
    };
    setSteps(prev => [...prev, step]);
    return steps.length;
  };

  const createTestJPG = (): File => {
    // Create a simple 100x100 red JPG
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 100;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#FF0000';
      ctx.fillRect(0, 0, 100, 100);
    }
    
    return new Promise<File>((resolve) => {
      canvas.toBlob((blob) => {
        const file = new File([blob!], `test-upload-${Date.now()}.jpg`, { type: 'image/jpeg' });
        resolve(file);
      }, 'image/jpeg', 0.9);
    }) as any;
  };

  const runTest = async () => {
    setIsRunning(true);
    setSteps([]);
    setLogs([]);
    setTestResult(null);

    try {
      addLog('info', 'Starting production upload test');

      // Step 1: Create test file
      const step1 = addStep('Create Test JPG File');
      updateStep(step1, { status: 'running', message: 'Creating test JPG...' });
      
      const startCreate = Date.now();
      const testFile = await createTestJPG();
      const createDuration = Date.now() - startCreate;
      
      addLog('success', 'Test JPG created', {
        fileName: testFile.name,
        fileSize: testFile.size,
        mimeType: testFile.type,
        duration: `${createDuration}ms`
      });
      
      updateStep(step1, {
        status: 'success',
        message: `Test JPG created: ${testFile.name} (${testFile.size} bytes)`,
        details: {
          fileName: testFile.name,
          fileSize: testFile.size,
          mimeType: testFile.type
        },
        duration: createDuration
      });

      // Step 2: Call generateUploadUrl endpoint
      const step2 = addStep('Generate Upload URL (Backend)');
      updateStep(step2, { status: 'running', message: 'Calling /api/media/generate-upload-url...' });
      
      const startGenerate = Date.now();
      addLog('info', 'Sending request to /api/media/generate-upload-url', {
        fileName: testFile.name,
        fileType: testFile.type
      });

      const generateResponse = await fetch('/api/media/generate-upload-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: testFile.name,
          fileType: testFile.type,
          kind: 'image'
        })
      });

      const generateDuration = Date.now() - startGenerate;
      const generateData = await generateResponse.json();

      addLog('info', 'Backend response received', {
        status: generateResponse.status,
        statusText: generateResponse.statusText,
        duration: `${generateDuration}ms`,
        hasUploadUrl: !!generateData.uploadUrl,
        uploadUrlLength: generateData.uploadUrl?.length
      });

      if (!generateResponse.ok) {
        throw new Error(`Backend returned HTTP ${generateResponse.status}: ${generateData.error}`);
      }

      if (!generateData.uploadUrl) {
        throw new Error('Backend did not return an uploadUrl');
      }

      // Validate upload URL
      const uploadUrlObj = new URL(generateData.uploadUrl);
      const isValidWixDomain = 
        uploadUrlObj.hostname.includes('wix') ||
        uploadUrlObj.hostname.includes('files') ||
        uploadUrlObj.hostname.includes('media') ||
        uploadUrlObj.hostname.includes('wixmp');

      if (!isValidWixDomain) {
        throw new Error(`Invalid upload URL domain: ${uploadUrlObj.hostname}`);
      }

      addLog('success', 'Upload URL generated successfully', {
        uploadUrlDomain: uploadUrlObj.hostname,
        uploadUrlLength: generateData.uploadUrl.length,
        expiresAt: generateData.expiresAt
      });

      updateStep(step2, {
        status: 'success',
        message: `Upload URL generated (${uploadUrlObj.hostname})`,
        details: {
          uploadUrlDomain: uploadUrlObj.hostname,
          uploadUrlLength: generateData.uploadUrl.length,
          expiresAt: generateData.expiresAt,
          backendDuration: `${generateDuration}ms`
        },
        duration: generateDuration
      });

      // Step 3: Upload file to Wix
      const step3 = addStep('Upload File to Wix Media Manager');
      updateStep(step3, { status: 'running', message: 'Uploading file...' });

      const startUpload = Date.now();
      addLog('info', 'Starting file upload to Wix', {
        fileSize: testFile.size,
        uploadUrl: generateData.uploadUrl.substring(0, 100) + '...'
      });

      const uploadResponse = await fetch(generateData.uploadUrl, {
        method: 'PUT',
        body: testFile,
        headers: {
          'Content-Type': testFile.type
        }
      });

      const uploadDuration = Date.now() - startUpload;

      addLog('info', 'Upload response received', {
        status: uploadResponse.status,
        statusText: uploadResponse.statusText,
        duration: `${uploadDuration}ms`
      });

      if (!uploadResponse.ok) {
        throw new Error(`Upload failed with HTTP ${uploadResponse.status}`);
      }

      addLog('success', 'File uploaded successfully to Wix', {
        duration: `${uploadDuration}ms`,
        fileSize: testFile.size
      });

      updateStep(step3, {
        status: 'success',
        message: `File uploaded successfully (${uploadDuration}ms)`,
        details: {
          uploadStatus: uploadResponse.status,
          uploadDuration: `${uploadDuration}ms`,
          fileSize: testFile.size
        },
        duration: uploadDuration
      });

      // Step 4: Get media URL
      const step4 = addStep('Retrieve Media URL (Backend)');
      updateStep(step4, { status: 'running', message: 'Calling /api/media/get-media-url...' });

      const startGetUrl = Date.now();
      addLog('info', 'Requesting media URL from backend', {
        fileName: testFile.name
      });

      const getUrlResponse = await fetch('/api/media/get-media-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileName: testFile.name })
      });

      const getUrlDuration = Date.now() - startGetUrl;
      const getUrlData = await getUrlResponse.json();

      addLog('info', 'Get media URL response received', {
        status: getUrlResponse.status,
        duration: `${getUrlDuration}ms`,
        hasMediaUrl: !!getUrlData.mediaUrl
      });

      if (!getUrlResponse.ok) {
        throw new Error(`Failed to get media URL: HTTP ${getUrlResponse.status}`);
      }

      if (!getUrlData.mediaUrl) {
        throw new Error('Backend did not return a mediaUrl');
      }

      addLog('success', 'Media URL retrieved', {
        mediaUrl: getUrlData.mediaUrl,
        duration: `${getUrlDuration}ms`
      });

      updateStep(step4, {
        status: 'success',
        message: `Media URL retrieved`,
        details: {
          mediaUrl: getUrlData.mediaUrl,
          mediaId: getUrlData.mediaId,
          backendDuration: `${getUrlDuration}ms`
        },
        duration: getUrlDuration
      });

      // Step 5: Verify image exists
      const step5 = addStep('Verify Image in Wix Media Manager');
      updateStep(step5, { status: 'running', message: 'Verifying image exists...' });

      const startVerify = Date.now();
      addLog('info', 'Verifying image URL is accessible', {
        mediaUrl: getUrlData.mediaUrl
      });

      const verifyResponse = await fetch(getUrlData.mediaUrl, { method: 'HEAD' });
      const verifyDuration = Date.now() - startVerify;

      addLog('info', 'Image verification response', {
        status: verifyResponse.status,
        contentType: verifyResponse.headers.get('content-type'),
        contentLength: verifyResponse.headers.get('content-length'),
        duration: `${verifyDuration}ms`
      });

      if (!verifyResponse.ok) {
        throw new Error(`Image verification failed: HTTP ${verifyResponse.status}`);
      }

      addLog('success', 'Image verified in Wix Media Manager', {
        mediaUrl: getUrlData.mediaUrl,
        contentType: verifyResponse.headers.get('content-type'),
        duration: `${verifyDuration}ms`
      });

      updateStep(step5, {
        status: 'success',
        message: `Image verified (HTTP ${verifyResponse.status})`,
        details: {
          mediaUrl: getUrlData.mediaUrl,
          contentType: verifyResponse.headers.get('content-type'),
          contentLength: verifyResponse.headers.get('content-length'),
          verifyDuration: `${verifyDuration}ms`
        },
        duration: verifyDuration
      });

      // Test complete
      const totalDuration = createDuration + generateDuration + uploadDuration + getUrlDuration + verifyDuration;
      
      setTestResult({
        success: true,
        mediaUrl: getUrlData.mediaUrl,
        mediaId: getUrlData.mediaId,
        fileName: testFile.name,
        uploadDuration: totalDuration
      });

      addLog('success', 'PRODUCTION UPLOAD TEST COMPLETED SUCCESSFULLY', {
        mediaUrl: getUrlData.mediaUrl,
        fileName: testFile.name,
        totalDuration: `${totalDuration}ms`
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addLog('error', 'TEST FAILED', { error: errorMessage });
      
      setTestResult({
        success: false
      });
    } finally {
      setIsRunning(false);
    }
  };

  const downloadLogs = () => {
    const logsText = logs.map(log => 
      `[${log.timestamp}] [${log.level.toUpperCase()}] ${log.message}${log.data ? '\n' + JSON.stringify(log.data, null, 2) : ''}`
    ).join('\n\n');

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(logsText));
    element.setAttribute('download', `upload-test-${Date.now()}.log`);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Production Upload Test</h2>
        <p className="text-gray-600">Execute a complete end-to-end upload test with real JPG file</p>
      </div>

      <Button
        onClick={runTest}
        disabled={isRunning}
        className="mb-6 w-full"
      >
        {isRunning ? (
          <>
            <Loader className="mr-2 h-4 w-4 animate-spin" />
            Running Test...
          </>
        ) : (
          <>
            <Upload className="mr-2 h-4 w-4" />
            Start Upload Test
          </>
        )}
      </Button>

      {/* Test Steps */}
      {steps.length > 0 && (
        <div className="mb-6 space-y-3">
          <h3 className="font-semibold text-lg">Test Steps</h3>
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 border rounded-lg"
            >
              <div className="flex items-start gap-3">
                <div className="mt-1">
                  {step.status === 'pending' && <div className="w-5 h-5 rounded-full border-2 border-gray-300" />}
                  {step.status === 'running' && <Loader className="w-5 h-5 animate-spin text-blue-500" />}
                  {step.status === 'success' && <CheckCircle className="w-5 h-5 text-green-500" />}
                  {step.status === 'error' && <AlertCircle className="w-5 h-5 text-red-500" />}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{step.name}</div>
                  <div className="text-sm text-gray-600">{step.message}</div>
                  {step.duration && <div className="text-xs text-gray-500 mt-1">Duration: {step.duration}ms</div>}
                  {step.details && (
                    <div className="mt-2 p-2 bg-gray-50 rounded text-xs font-mono overflow-auto max-h-40">
                      <pre>{JSON.stringify(step.details, null, 2)}</pre>
                    </div>
                  )}
                  {step.error && <div className="text-xs text-red-600 mt-1">{step.error}</div>}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Test Result */}
      {testResult && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-lg border-2 mb-6 ${
            testResult.success
              ? 'bg-green-50 border-green-200'
              : 'bg-red-50 border-red-200'
          }`}
        >
          <div className="flex items-start gap-3">
            {testResult.success ? (
              <CheckCircle className="w-6 h-6 text-green-600 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-red-600 mt-1" />
            )}
            <div className="flex-1">
              <h3 className={`font-bold text-lg ${testResult.success ? 'text-green-900' : 'text-red-900'}`}>
                {testResult.success ? 'Upload Test Successful!' : 'Upload Test Failed'}
              </h3>
              {testResult.success && (
                <div className="mt-3 space-y-2 text-sm">
                  <div>
                    <span className="font-semibold">Media URL:</span>
                    <div className="mt-1 p-2 bg-white rounded border font-mono text-xs break-all">
                      {testResult.mediaUrl}
                    </div>
                  </div>
                  {testResult.mediaId && (
                    <div>
                      <span className="font-semibold">Media ID:</span>
                      <div className="mt-1 p-2 bg-white rounded border font-mono text-xs">
                        {testResult.mediaId}
                      </div>
                    </div>
                  )}
                  {testResult.fileName && (
                    <div>
                      <span className="font-semibold">File Name:</span>
                      <div className="mt-1 p-2 bg-white rounded border font-mono text-xs">
                        {testResult.fileName}
                      </div>
                    </div>
                  )}
                  {testResult.uploadDuration && (
                    <div>
                      <span className="font-semibold">Total Duration:</span>
                      <div className="mt-1 p-2 bg-white rounded border font-mono text-xs">
                        {testResult.uploadDuration}ms
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Logs */}
      {logs.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-lg">Test Logs</h3>
            <Button
              onClick={downloadLogs}
              variant="outline"
              size="sm"
            >
              <Download className="mr-2 h-4 w-4" />
              Download Logs
            </Button>
          </div>
          <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-xs overflow-auto max-h-96 space-y-1">
            {logs.map((log, idx) => (
              <div
                key={idx}
                className={
                  log.level === 'error'
                    ? 'text-red-400'
                    : log.level === 'success'
                    ? 'text-green-400'
                    : log.level === 'warning'
                    ? 'text-yellow-400'
                    : 'text-blue-400'
                }
              >
                <span className="text-gray-500">[{log.timestamp}]</span>
                {' '}
                <span className="font-bold">[{log.level.toUpperCase()}]</span>
                {' '}
                {log.message}
                {log.data && (
                  <div className="ml-4 text-gray-400 mt-1">
                    {JSON.stringify(log.data, null, 2)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
