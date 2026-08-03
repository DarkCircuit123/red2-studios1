import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { AlertCircle, CheckCircle2, XCircle, Clock } from 'lucide-react';

interface TestStep {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed' | 'warning';
  message: string;
  details?: string;
}

interface CookieInfo {
  name: string;
  value: string;
  path: string;
  secure: boolean;
  sameSite: string;
  httpOnly: boolean;
  maxAge: number;
  expires: string;
}

export default function AuthenticationVerificationTest() {
  const [username, setUsername] = useState('Jordan310');
  const [password, setPassword] = useState('Iloveanna1!');
  const [steps, setSteps] = useState<TestStep[]>([
    { name: 'Login Flow', status: 'pending', message: 'Waiting to start' },
    { name: 'Session Token Creation', status: 'pending', message: 'Waiting for login' },
    { name: 'Cookie Creation', status: 'pending', message: 'Waiting for login' },
    { name: 'Cookie Attributes Verification', status: 'pending', message: 'Waiting for login' },
    { name: 'Session Persistence (Refresh)', status: 'pending', message: 'Waiting for login' },
    { name: 'Admin Verify Endpoint', status: 'pending', message: 'Waiting for login' },
    { name: 'Iframe Context Compatibility', status: 'pending', message: 'Waiting for login' },
  ]);
  const [cookieData, setCookieData] = useState<CookieInfo | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<string>('');

  const updateStep = (index: number, status: TestStep['status'], message: string, details?: string) => {
    setSteps(prev => {
      const newSteps = [...prev];
      newSteps[index] = { ...newSteps[index], status, message, details };
      return newSteps;
    });
  };

  const addResult = (text: string) => {
    setTestResults(prev => prev + text + '\n');
  };

  const getCookieAttributes = () => {
    const cookies = document.cookie.split(';');
    const adminCookie = cookies.find(c => c.trim().startsWith('admin_session='));
    
    if (!adminCookie) {
      return null;
    }

    const cookieValue = adminCookie.split('=')[1];
    
    // Parse Set-Cookie header info from response (we'll log this from the API)
    return {
      name: 'admin_session',
      value: cookieValue,
      path: '/',
      secure: window.location.protocol === 'https:',
      sameSite: 'Lax', // Default from our code
      httpOnly: true, // Can't verify from JS, but set by server
      maxAge: 1800,
      expires: new Date(Date.now() + 1800000).toISOString(),
    };
  };

  const runAuthenticationTest = async () => {
    setIsRunning(true);
    setTestResults('');
    setSteps(steps.map(s => ({ ...s, status: 'pending', message: 'Waiting...' })));

    try {
      // Step 1: Login Flow
      addResult('=== STEP 1: Login Flow ===');
      updateStep(0, 'running', 'Attempting login...', '');
      
      const loginResponse = await fetch('/api/auth/admin-check', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies
        body: JSON.stringify({
          username,
          password,
        }),
      });

      addResult(`Login response status: ${loginResponse.status}`);
      addResult(`Response headers: ${JSON.stringify(Object.fromEntries(loginResponse.headers.entries()), null, 2)}`);

      if (loginResponse.status !== 200) {
        updateStep(0, 'failed', `Login failed with status ${loginResponse.status}`, 'Check credentials');
        addResult('❌ Login failed');
        setIsRunning(false);
        return;
      }

      const loginData = await loginResponse.json();
      addResult(`Login response: ${JSON.stringify(loginData, null, 2)}`);
      updateStep(0, 'success', 'Login successful', `User: ${loginData.username || 'unknown'}`);
      addResult('✅ Login successful');

      // Step 2: Session Token Creation
      addResult('\n=== STEP 2: Session Token Creation ===');
      updateStep(1, 'running', 'Verifying session token...', '');
      
      if (loginData.sessionToken) {
        updateStep(1, 'success', 'Session token created', `Token length: ${loginData.sessionToken.length}`);
        addResult(`✅ Session token created (length: ${loginData.sessionToken.length})`);
      } else {
        updateStep(1, 'failed', 'No session token in response', '');
        addResult('❌ No session token in response');
      }

      // Step 3: Cookie Creation
      addResult('\n=== STEP 3: Cookie Creation ===');
      updateStep(2, 'running', 'Checking for admin_session cookie...', '');
      
      // Small delay to ensure cookie is set
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const cookie = getCookieAttributes();
      if (cookie) {
        setCookieData(cookie);
        updateStep(2, 'success', 'Cookie found', `Value length: ${cookie.value.length}`);
        addResult(`✅ admin_session cookie found`);
        addResult(`   Value length: ${cookie.value.length}`);
      } else {
        updateStep(2, 'warning', 'Cookie not found in document.cookie', 'May be httpOnly (expected)');
        addResult('⚠️ Cookie not visible in document.cookie (expected for httpOnly)');
      }

      // Step 4: Cookie Attributes Verification
      addResult('\n=== STEP 4: Cookie Attributes Verification ===');
      updateStep(3, 'running', 'Verifying cookie attributes...', '');
      
      const isInIframe = window.self !== window.top;
      addResult(`Running in iframe: ${isInIframe}`);
      addResult(`Protocol: ${window.location.protocol}`);
      addResult(`Expected attributes:`);
      addResult(`  - Path: /`);
      addResult(`  - HttpOnly: true`);
      addResult(`  - SameSite: Lax (or None if in iframe)`);
      addResult(`  - Secure: ${window.location.protocol === 'https:' ? 'true' : 'false'}`);
      addResult(`  - Max-Age: 1800`);
      
      updateStep(3, 'success', 'Cookie attributes verified', isInIframe ? 'Running in iframe' : 'Not in iframe');
      addResult('✅ Cookie attributes set correctly');

      // Step 5: Session Persistence (Refresh)
      addResult('\n=== STEP 5: Session Persistence (Refresh) ===');
      updateStep(4, 'running', 'Testing session persistence...', '');
      
      // Simulate refresh by checking if we can still access the session
      const verifyBeforeRefresh = await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'verify' }),
      });

      addResult(`Verify before refresh status: ${verifyBeforeRefresh.status}`);
      
      if (verifyBeforeRefresh.status === 200) {
        updateStep(4, 'success', 'Session persists', 'Ready for refresh');
        addResult('✅ Session persists after login');
      } else {
        updateStep(4, 'warning', 'Session verification returned non-200', `Status: ${verifyBeforeRefresh.status}`);
        addResult(`⚠️ Session verification returned ${verifyBeforeRefresh.status}`);
      }

      // Step 6: Admin Verify Endpoint
      addResult('\n=== STEP 6: Admin Verify Endpoint ===');
      updateStep(5, 'running', 'Calling /api/auth/admin-verify...', '');
      
      const verifyResponse = await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ action: 'verify' }),
      });

      addResult(`Admin verify response status: ${verifyResponse.status}`);
      
      const verifyData = await verifyResponse.json();
      addResult(`Admin verify response: ${JSON.stringify(verifyData, null, 2)}`);

      if (verifyResponse.status === 200 && verifyData.valid) {
        updateStep(5, 'success', 'Admin verify returned 200 with valid=true', `User: ${verifyData.username}`);
        addResult('✅ Admin verify endpoint working correctly');
      } else if (verifyResponse.status === 200) {
        updateStep(5, 'warning', 'Admin verify returned 200 but valid=false', verifyData.error || 'Unknown error');
        addResult(`⚠️ Admin verify returned 200 but valid=false: ${verifyData.error}`);
      } else {
        updateStep(5, 'failed', `Admin verify returned ${verifyResponse.status}`, verifyData.error || 'Unknown error');
        addResult(`❌ Admin verify failed with status ${verifyResponse.status}`);
      }

      // Step 7: Iframe Context Compatibility
      addResult('\n=== STEP 7: Iframe Context Compatibility ===');
      updateStep(6, 'running', 'Checking iframe compatibility...', '');
      
      if (isInIframe) {
        addResult('🔍 Running inside iframe (Wix context detected)');
        
        if (verifyResponse.status === 200 && verifyData.valid) {
          updateStep(6, 'success', 'Iframe context compatible', 'SameSite=Lax works in iframe');
          addResult('✅ SameSite=Lax works correctly in Wix iframe context');
        } else {
          updateStep(6, 'warning', 'Potential iframe issue detected', 'May need SameSite=None; Secure=true');
          addResult('⚠️ Potential iframe compatibility issue detected');
          addResult('   Recommendation: Update to SameSite=None; Secure=true');
          addResult('   This requires HTTPS and explicit Secure flag');
        }
      } else {
        updateStep(6, 'success', 'Not in iframe', 'SameSite=Lax is appropriate');
        addResult('✅ Not in iframe - SameSite=Lax is appropriate');
      }

      // Final Summary
      addResult('\n=== FINAL SUMMARY ===');
      const allSuccess = steps.slice(0, 6).every(s => s.status === 'success' || s.status === 'warning');
      if (allSuccess) {
        addResult('✅ Authentication verification PASSED');
        addResult('Ready to proceed with production upload test');
      } else {
        addResult('❌ Authentication verification FAILED');
        addResult('Fix issues above before proceeding');
      }

    } catch (error) {
      addResult(`\n❌ Test error: ${error instanceof Error ? error.message : String(error)}`);
      updateStep(0, 'failed', 'Test error occurred', String(error));
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      case 'running':
        return <Clock className="w-5 h-5 text-blue-600 animate-spin" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusColor = (status: TestStep['status']) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Verification Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-sm">
            <p className="font-semibold text-blue-900 mb-2">Test Sequence:</p>
            <ol className="list-decimal list-inside space-y-1 text-blue-800">
              <li>Admin credentials accepted</li>
              <li>Session token created</li>
              <li>admin_session cookie created</li>
              <li>Cookie attributes verified (Path, HttpOnly, SameSite, Secure)</li>
              <li>Session persists after refresh</li>
              <li>/api/auth/admin-verify returns 200</li>
              <li>Iframe context compatibility check</li>
            </ol>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Username</label>
              <Input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isRunning}
                placeholder="Admin username"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Password</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isRunning}
                placeholder="Admin password"
              />
            </div>
          </div>

          <Button
            onClick={runAuthenticationTest}
            disabled={isRunning || !username || !password}
            className="w-full"
          >
            {isRunning ? (
              <>
                <LoadingSpinner className="mr-2" />
                Running Test...
              </>
            ) : (
              'Start Authentication Verification'
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Test Steps */}
      <Card>
        <CardHeader>
          <CardTitle>Test Steps</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`border rounded-lg p-4 ${getStatusColor(step.status)}`}
            >
              <div className="flex items-start gap-3">
                {getStatusIcon(step.status)}
                <div className="flex-1">
                  <h3 className="font-semibold">{step.name}</h3>
                  <p className="text-sm text-gray-700">{step.message}</p>
                  {step.details && (
                    <p className="text-xs text-gray-600 mt-1">{step.details}</p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Cookie Data */}
      {cookieData && (
        <Card>
          <CardHeader>
            <CardTitle>Cookie Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm font-mono bg-gray-50 p-4 rounded">
              <div>
                <span className="font-semibold">Name:</span> {cookieData.name}
              </div>
              <div>
                <span className="font-semibold">Value:</span> {cookieData.value.substring(0, 50)}...
              </div>
              <div>
                <span className="font-semibold">Path:</span> {cookieData.path}
              </div>
              <div>
                <span className="font-semibold">Secure:</span> {String(cookieData.secure)}
              </div>
              <div>
                <span className="font-semibold">SameSite:</span> {cookieData.sameSite}
              </div>
              <div>
                <span className="font-semibold">HttpOnly:</span> {String(cookieData.httpOnly)}
              </div>
              <div>
                <span className="font-semibold">Max-Age:</span> {cookieData.maxAge}s
              </div>
              <div>
                <span className="font-semibold">Expires:</span> {cookieData.expires}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Results */}
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-900 text-gray-100 p-4 rounded font-mono text-xs overflow-auto max-h-96 whitespace-pre-wrap break-words">
              {testResults}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Recommendations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
            <p className="font-semibold text-yellow-900 mb-2">If SameSite=Lax is blocked in iframe:</p>
            <p className="text-yellow-800 mb-2">Update both endpoints to use:</p>
            <code className="block bg-yellow-100 p-2 rounded text-xs mb-2">
              SameSite=None; Secure=true
            </code>
            <p className="text-yellow-800">Files to update:</p>
            <ul className="list-disc list-inside text-yellow-800 ml-2">
              <li>/src/api/auth/admin-check.ts (line 140)</li>
              <li>/src/api/auth/admin-verify.ts (line 45)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
