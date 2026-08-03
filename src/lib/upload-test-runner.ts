/**
 * Upload Test Runner - Server-side test execution
 * This utility runs the production upload test and captures all output
 */

interface TestStepResult {
  name: string;
  status: 'success' | 'error';
  duration: number;
  details: Record<string, any>;
  error?: string;
}

interface UploadTestResult {
  success: boolean;
  steps: TestStepResult[];
  totalDuration: number;
  mediaUrl?: string;
  mediaId?: string;
  fileName?: string;
  error?: string;
}

/**
 * Create a test JPG file on the server
 */
export async function createTestJPG(): Promise<{ buffer: Buffer; fileName: string; mimeType: string; size: number }> {
  const startTime = Date.now();
  
  // Create a simple 100x100 red JPG using canvas-like approach
  // For Node.js, we'll create a minimal valid JPEG
  const fileName = `test-upload-${Date.now()}.jpg`;
  
  // Minimal valid JPEG (100x100 red square)
  // This is a pre-generated minimal JPEG that's valid
  const jpegBuffer = Buffer.from([
    0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xFF, 0xDB, 0x00, 0x43,
    0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08, 0x07, 0x07, 0x07, 0x09,
    0x09, 0x08, 0x0A, 0x0C, 0x14, 0x0D, 0x0C, 0x0B, 0x0B, 0x0C, 0x19, 0x12,
    0x13, 0x0F, 0x14, 0x1D, 0x1A, 0x1F, 0x1E, 0x1D, 0x1A, 0x1C, 0x1C, 0x20,
    0x24, 0x2E, 0x27, 0x20, 0x22, 0x2C, 0x23, 0x1C, 0x1C, 0x28, 0x37, 0x29,
    0x2C, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1F, 0x27, 0x39, 0x3D, 0x38, 0x32,
    0x3C, 0x2E, 0x33, 0x34, 0x32, 0xFF, 0xC0, 0x00, 0x0B, 0x08, 0x00, 0x64,
    0x00, 0x64, 0x01, 0x01, 0x11, 0x00, 0xFF, 0xC4, 0x00, 0x1F, 0x00, 0x00,
    0x01, 0x05, 0x01, 0x01, 0x01, 0x01, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x01, 0x02, 0x03, 0x04, 0x05, 0x06, 0x07, 0x08,
    0x09, 0x0A, 0x0B, 0xFF, 0xC4, 0x00, 0xB5, 0x10, 0x00, 0x02, 0x01, 0x03,
    0x03, 0x02, 0x04, 0x03, 0x05, 0x05, 0x04, 0x04, 0x00, 0x00, 0x01, 0x7D,
    0x01, 0x02, 0x03, 0x00, 0x04, 0x11, 0x05, 0x12, 0x21, 0x31, 0x41, 0x06,
    0x13, 0x51, 0x61, 0x07, 0x22, 0x71, 0x14, 0x32, 0x81, 0x91, 0xA1, 0x08,
    0x23, 0x42, 0xB1, 0xC1, 0x15, 0x52, 0xD1, 0xF0, 0x24, 0x33, 0x62, 0x72,
    0x82, 0x09, 0x0A, 0x16, 0x17, 0x18, 0x19, 0x1A, 0x25, 0x26, 0x27, 0x28,
    0x29, 0x2A, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x3A, 0x43, 0x44, 0x45,
    0x46, 0x47, 0x48, 0x49, 0x4A, 0x53, 0x54, 0x55, 0x56, 0x57, 0x58, 0x59,
    0x5A, 0x63, 0x64, 0x65, 0x66, 0x67, 0x68, 0x69, 0x6A, 0x73, 0x74, 0x75,
    0x76, 0x77, 0x78, 0x79, 0x7A, 0x83, 0x84, 0x85, 0x86, 0x87, 0x88, 0x89,
    0x8A, 0x92, 0x93, 0x94, 0x95, 0x96, 0x97, 0x98, 0x99, 0x9A, 0xA2, 0xA3,
    0xA4, 0xA5, 0xA6, 0xA7, 0xA8, 0xA9, 0xAA, 0xB2, 0xB3, 0xB4, 0xB5, 0xB6,
    0xB7, 0xB8, 0xB9, 0xBA, 0xC2, 0xC3, 0xC4, 0xC5, 0xC6, 0xC7, 0xC8, 0xC9,
    0xCA, 0xD2, 0xD3, 0xD4, 0xD5, 0xD6, 0xD7, 0xD8, 0xD9, 0xDA, 0xE1, 0xE2,
    0xE3, 0xE4, 0xE5, 0xE6, 0xE7, 0xE8, 0xE9, 0xEA, 0xF1, 0xF2, 0xF3, 0xF4,
    0xF5, 0xF6, 0xF7, 0xF8, 0xF9, 0xFA, 0xFF, 0xDA, 0x00, 0x08, 0x01, 0x01,
    0x00, 0x00, 0x3F, 0x00, 0xFB, 0xD3, 0xFF, 0xD9
  ]);

  const duration = Date.now() - startTime;

  return {
    buffer: jpegBuffer,
    fileName,
    mimeType: 'image/jpeg',
    size: jpegBuffer.length
  };
}

/**
 * Run the complete upload test
 */
export async function runUploadTest(): Promise<UploadTestResult> {
  const startTime = Date.now();
  const steps: TestStepResult[] = [];

  try {
    // Step 1: Create test file
    console.log('[UPLOAD_TEST] Step 1: Creating test JPG file');
    const step1Start = Date.now();
    const testFile = await createTestJPG();
    const step1Duration = Date.now() - step1Start;

    steps.push({
      name: 'Create Test JPG File',
      status: 'success',
      duration: step1Duration,
      details: {
        fileName: testFile.fileName,
        fileSize: testFile.size,
        mimeType: testFile.mimeType
      }
    });

    console.log('[UPLOAD_TEST] Step 1 complete:', {
      fileName: testFile.fileName,
      fileSize: testFile.size,
      duration: step1Duration
    });

    // Step 2: Generate upload URL
    console.log('[UPLOAD_TEST] Step 2: Generating upload URL');
    const step2Start = Date.now();

    const generateResponse = await fetch('http://localhost:3000/api/media/generate-upload-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: testFile.fileName,
        mimeType: testFile.mimeType,
        kind: 'image'
      })
    });

    const step2Duration = Date.now() - step2Start;
    const generateData = await generateResponse.json();

    if (!generateResponse.ok) {
      throw new Error(`Generate URL failed: HTTP ${generateResponse.status} - ${generateData.error}`);
    }

    steps.push({
      name: 'Generate Upload URL',
      status: 'success',
      duration: step2Duration,
      details: {
        status: generateResponse.status,
        uploadUrlDomain: new URL(generateData.uploadUrl).hostname,
        uploadUrlLength: generateData.uploadUrl.length
      }
    });

    console.log('[UPLOAD_TEST] Step 2 complete:', {
      status: generateResponse.status,
      uploadUrlDomain: new URL(generateData.uploadUrl).hostname,
      duration: step2Duration
    });

    // Step 3: Upload file to Wix
    console.log('[UPLOAD_TEST] Step 3: Uploading file to Wix');
    const step3Start = Date.now();

    const uploadResponse = await fetch(generateData.uploadUrl, {
      method: 'PUT',
      body: testFile.buffer,
      headers: {
        'Content-Type': testFile.mimeType
      }
    });

    const step3Duration = Date.now() - step3Start;

    if (!uploadResponse.ok) {
      throw new Error(`Upload failed: HTTP ${uploadResponse.status}`);
    }

    steps.push({
      name: 'Upload File to Wix',
      status: 'success',
      duration: step3Duration,
      details: {
        status: uploadResponse.status,
        fileSize: testFile.size
      }
    });

    console.log('[UPLOAD_TEST] Step 3 complete:', {
      status: uploadResponse.status,
      duration: step3Duration
    });

    // Step 4: Get media URL
    console.log('[UPLOAD_TEST] Step 4: Retrieving media URL');
    const step4Start = Date.now();

    const getUrlResponse = await fetch('http://localhost:3000/api/media/get-media-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: testFile.fileName })
    });

    const step4Duration = Date.now() - step4Start;
    const getUrlData = await getUrlResponse.json();

    if (!getUrlResponse.ok) {
      throw new Error(`Get URL failed: HTTP ${getUrlResponse.status} - ${getUrlData.error}`);
    }

    steps.push({
      name: 'Retrieve Media URL',
      status: 'success',
      duration: step4Duration,
      details: {
        status: getUrlResponse.status,
        mediaUrl: getUrlData.mediaUrl,
        mediaId: getUrlData.mediaId
      }
    });

    console.log('[UPLOAD_TEST] Step 4 complete:', {
      status: getUrlResponse.status,
      mediaUrl: getUrlData.mediaUrl,
      duration: step4Duration
    });

    // Step 5: Verify image exists
    console.log('[UPLOAD_TEST] Step 5: Verifying image exists');
    const step5Start = Date.now();

    const verifyResponse = await fetch(getUrlData.mediaUrl, { method: 'HEAD' });
    const step5Duration = Date.now() - step5Start;

    if (!verifyResponse.ok) {
      throw new Error(`Verify failed: HTTP ${verifyResponse.status}`);
    }

    steps.push({
      name: 'Verify Image in Wix',
      status: 'success',
      duration: step5Duration,
      details: {
        status: verifyResponse.status,
        contentType: verifyResponse.headers.get('content-type'),
        contentLength: verifyResponse.headers.get('content-length')
      }
    });

    console.log('[UPLOAD_TEST] Step 5 complete:', {
      status: verifyResponse.status,
      duration: step5Duration
    });

    const totalDuration = Date.now() - startTime;

    console.log('[UPLOAD_TEST] ===== TEST COMPLETED SUCCESSFULLY =====', {
      totalDuration,
      mediaUrl: getUrlData.mediaUrl,
      fileName: testFile.fileName
    });

    return {
      success: true,
      steps,
      totalDuration,
      mediaUrl: getUrlData.mediaUrl,
      mediaId: getUrlData.mediaId,
      fileName: testFile.fileName
    };
  } catch (error) {
    const totalDuration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    console.error('[UPLOAD_TEST] ===== TEST FAILED =====', {
      error: errorMessage,
      totalDuration,
      stepsCompleted: steps.length
    });

    return {
      success: false,
      steps,
      totalDuration,
      error: errorMessage
    };
  }
}
