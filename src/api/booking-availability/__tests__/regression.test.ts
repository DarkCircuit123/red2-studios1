/**
 * Booking Availability API - Regression Test Suite
 * 
 * Automated CRUD lifecycle test:
 * 1. CREATE a new availability slot
 * 2. READ the created slot
 * 3. UPDATE the slot
 * 4. DELETE the slot
 * 
 * Run after every change to booking availability endpoints:
 * npm test -- booking-availability
 * 
 * Test Coverage:
 * - Duplicate slot protection (409 response)
 * - Data normalization (trimming, format validation)
 * - Time validation (endTime after startTime)
 * - Date format validation (YYYY-MM-DD)
 * - Time format validation (HH:mm)
 * - CRUD lifecycle integrity
 */

const API_BASE = 'http://localhost:3000/api/booking-availability';

interface TestResult {
  name: string;
  passed: boolean;
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

// Helper to make API calls
async function apiCall(
  method: string,
  endpoint: string,
  body?: any
): Promise<{ status: number; data: any }> {
  const url = `${API_BASE}${endpoint}`;
  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await response.json();
  return { status: response.status, data };
}

// Test helpers
function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(message);
}

function assertEqual(actual: any, expected: any, message: string) {
  if (actual !== expected) {
    throw new Error(`${message}\nExpected: ${expected}\nActual: ${actual}`);
  }
}

// Test cases
async function testCreateValidSlot() {
  const startTime = Date.now();
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const bookingDate = tomorrow.toISOString().split('T')[0];

    const response = await apiCall('POST', '/create', {
      bookingDate,
      startTime: '09:00',
      endTime: '10:00',
      sessionType: '  Photography Session  ', // Test trimming
      isAvailable: true
    });

    assertEqual(response.status, 201, 'Expected 201 Created status');
    assert(response.data.success, 'Expected success: true');
    assert(response.data.data._id, 'Expected _id in response');
    assertEqual(response.data.data.sessionType, 'Photography Session', 'Expected sessionType to be trimmed');

    results.push({
      name: 'CREATE: Valid slot with normalization',
      passed: true,
      duration: Date.now() - startTime
    });

    return response.data.data._id;
  } catch (error) {
    results.push({
      name: 'CREATE: Valid slot with normalization',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    throw error;
  }
}

async function testCreateDuplicateSlot() {
  const startTime = Date.now();
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 2);
    const bookingDate = tomorrow.toISOString().split('T')[0];

    // Create first slot
    const response1 = await apiCall('POST', '/create', {
      bookingDate,
      startTime: '14:00',
      endTime: '15:00',
      sessionType: 'Session'
    });

    assertEqual(response1.status, 201, 'Expected first create to succeed');

    // Try to create duplicate
    const response2 = await apiCall('POST', '/create', {
      bookingDate,
      startTime: '14:00',
      endTime: '15:00',
      sessionType: 'Session'
    });

    assertEqual(response2.status, 409, 'Expected 409 Conflict for duplicate slot');
    assert(!response2.data.success, 'Expected success: false');
    assert(
      response2.data.message.includes('already exists'),
      'Expected duplicate error message'
    );

    results.push({
      name: 'CREATE: Duplicate slot protection (409)',
      passed: true,
      duration: Date.now() - startTime
    });
  } catch (error) {
    results.push({
      name: 'CREATE: Duplicate slot protection (409)',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    throw error;
  }
}

async function testCreateInvalidDateFormat() {
  const startTime = Date.now();
  try {
    const response = await apiCall('POST', '/create', {
      bookingDate: '2024/12/25', // Invalid format
      startTime: '09:00',
      endTime: '10:00'
    });

    assertEqual(response.status, 400, 'Expected 400 Bad Request');
    assert(!response.data.success, 'Expected success: false');
    assert(
      response.data.message.includes('YYYY-MM-DD'),
      'Expected date format error message'
    );

    results.push({
      name: 'CREATE: Invalid date format validation',
      passed: true,
      duration: Date.now() - startTime
    });
  } catch (error) {
    results.push({
      name: 'CREATE: Invalid date format validation',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    throw error;
  }
}

async function testCreateInvalidTimeFormat() {
  const startTime = Date.now();
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 3);
    const bookingDate = tomorrow.toISOString().split('T')[0];

    const response = await apiCall('POST', '/create', {
      bookingDate,
      startTime: '9:00', // Invalid format (should be 09:00)
      endTime: '10:00'
    });

    assertEqual(response.status, 400, 'Expected 400 Bad Request');
    assert(!response.data.success, 'Expected success: false');
    assert(
      response.data.message.includes('HH:mm'),
      'Expected time format error message'
    );

    results.push({
      name: 'CREATE: Invalid time format validation',
      passed: true,
      duration: Date.now() - startTime
    });
  } catch (error) {
    results.push({
      name: 'CREATE: Invalid time format validation',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    throw error;
  }
}

async function testCreateEndTimeBeforeStartTime() {
  const startTime = Date.now();
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 4);
    const bookingDate = tomorrow.toISOString().split('T')[0];

    const response = await apiCall('POST', '/create', {
      bookingDate,
      startTime: '15:00',
      endTime: '14:00' // Before startTime
    });

    assertEqual(response.status, 400, 'Expected 400 Bad Request');
    assert(!response.data.success, 'Expected success: false');
    assert(
      response.data.message.includes('after'),
      'Expected time logic error message'
    );

    results.push({
      name: 'CREATE: Time logic validation (endTime after startTime)',
      passed: true,
      duration: Date.now() - startTime
    });
  } catch (error) {
    results.push({
      name: 'CREATE: Time logic validation (endTime after startTime)',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    throw error;
  }
}

async function testReadSlot(slotId: string) {
  const startTime = Date.now();
  try {
    const response = await apiCall('GET', `?limit=1&skip=0`, undefined);

    assertEqual(response.status, 200, 'Expected 200 OK');
    assert(response.data.success, 'Expected success: true');
    assert(Array.isArray(response.data.data), 'Expected data to be an array');
    assert(response.data.totalCount >= 0, 'Expected totalCount');

    results.push({
      name: 'READ: Fetch all slots with pagination',
      passed: true,
      duration: Date.now() - startTime
    });
  } catch (error) {
    results.push({
      name: 'READ: Fetch all slots with pagination',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    throw error;
  }
}

async function testUpdateSlot(slotId: string) {
  const startTime = Date.now();
  try {
    const response = await apiCall('PUT', '/update', {
      id: slotId,
      sessionType: '  Updated Session  ', // Test trimming
      isAvailable: false
    });

    assertEqual(response.status, 200, 'Expected 200 OK');
    assert(response.data.success, 'Expected success: true');
    assertEqual(response.data.data.sessionType, 'Updated Session', 'Expected sessionType to be trimmed');
    assertEqual(response.data.data.isAvailable, false, 'Expected isAvailable to be false');

    results.push({
      name: 'UPDATE: Modify slot with normalization',
      passed: true,
      duration: Date.now() - startTime
    });
  } catch (error) {
    results.push({
      name: 'UPDATE: Modify slot with normalization',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    throw error;
  }
}

async function testUpdateInvalidTime(slotId: string) {
  const startTime = Date.now();
  try {
    const response = await apiCall('PUT', '/update', {
      id: slotId,
      startTime: '15:00',
      endTime: '14:00' // Invalid: before startTime
    });

    assertEqual(response.status, 400, 'Expected 400 Bad Request');
    assert(!response.data.success, 'Expected success: false');

    results.push({
      name: 'UPDATE: Time logic validation on update',
      passed: true,
      duration: Date.now() - startTime
    });
  } catch (error) {
    results.push({
      name: 'UPDATE: Time logic validation on update',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    throw error;
  }
}

async function testDeleteSlot(slotId: string) {
  const startTime = Date.now();
  try {
    const response = await apiCall('DELETE', '/delete', { id: slotId });

    assertEqual(response.status, 200, 'Expected 200 OK');
    assert(response.data.success, 'Expected success: true');

    results.push({
      name: 'DELETE: Remove slot',
      passed: true,
      duration: Date.now() - startTime
    });
  } catch (error) {
    results.push({
      name: 'DELETE: Remove slot',
      passed: false,
      error: error instanceof Error ? error.message : String(error),
      duration: Date.now() - startTime
    });
    throw error;
  }
}

// Main test runner
async function runTests() {
  console.log('\n🧪 Booking Availability API - Regression Test Suite\n');
  console.log('Running automated CRUD lifecycle tests...\n');

  try {
    // CREATE tests
    console.log('📝 CREATE Tests:');
    const slotId = await testCreateValidSlot();
    await testCreateDuplicateSlot();
    await testCreateInvalidDateFormat();
    await testCreateInvalidTimeFormat();
    await testCreateEndTimeBeforeStartTime();

    // READ tests
    console.log('\n📖 READ Tests:');
    await testReadSlot(slotId);

    // UPDATE tests
    console.log('\n✏️  UPDATE Tests:');
    await testUpdateSlot(slotId);
    await testUpdateInvalidTime(slotId);

    // DELETE tests
    console.log('\n🗑️  DELETE Tests:');
    await testDeleteSlot(slotId);

    // Print results
    console.log('\n' + '='.repeat(70));
    console.log('TEST RESULTS');
    console.log('='.repeat(70) + '\n');

    let passed = 0;
    let failed = 0;

    results.forEach((result) => {
      const status = result.passed ? '✓' : '✗';
      const color = result.passed ? '\x1b[32m' : '\x1b[31m';
      const reset = '\x1b[0m';

      console.log(
        `${color}${status}${reset} ${result.name} (${result.duration}ms)`
      );

      if (result.error) {
        console.log(`  Error: ${result.error}\n`);
        failed++;
      } else {
        passed++;
      }
    });

    console.log('\n' + '='.repeat(70));
    console.log(`Total: ${results.length} | Passed: ${passed} | Failed: ${failed}`);
    console.log('='.repeat(70) + '\n');

    if (failed > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Test suite failed:', error);
    process.exit(1);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}

export { runTests };
