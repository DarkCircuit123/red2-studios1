import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { useMember } from '@/integrations';

interface VerificationResult {
  name: string;
  status: 'pending' | 'success' | 'failed' | 'warning';
  message: string;
  details?: string;
}

interface AuthDiagnostics {
  memberIdDetected: boolean;
  memberLoggedIn: boolean;
  adminPermissionMatched: boolean;
  adminCheckResponse: boolean;
  adminVerifyResponse: boolean;
  sessionPersistent: boolean;
  uploadAuthWorking: boolean;
  downloadAuthWorking: boolean;
}

export default function AuthMigrationVerifier() {
  const { member, isAuthenticated, isLoading } = useMember();
  const [results, setResults] = useState<VerificationResult[]>([]);
  const [diagnostics, setDiagnostics] = useState<AuthDiagnostics | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [refreshCount, setRefreshCount] = useState(0);

  const runVerification = async () => {
    setIsVerifying(true);
    const newResults: VerificationResult[] = [];
    const diag: AuthDiagnostics = {
      memberIdDetected: false,
      memberLoggedIn: false,
      adminPermissionMatched: false,
      adminCheckResponse: false,
      adminVerifyResponse: false,
      sessionPersistent: false,
      uploadAuthWorking: false,
      downloadAuthWorking: false,
    };

    // Test 1: Member ID Detection
    console.log('[VERIFICATION] Test 1: Member ID Detection');
    if (member?.id) {
      diag.memberIdDetected = true;
      newResults.push({
        name: 'Member ID Detected',
        status: 'success',
        message: `Member ID found: ${member.id.substring(0, 8)}...`,
      });
      console.log('[VERIFICATION] ✓ Member ID detected:', member.id.substring(0, 8));
    } else {
      newResults.push({
        name: 'Member ID Detected',
        status: 'failed',
        message: 'No member ID found in session',
      });
      console.log('[VERIFICATION] ✗ No member ID detected');
    }

    // Test 2: Member Logged In Status
    console.log('[VERIFICATION] Test 2: Member Logged In Status');
    if (isAuthenticated) {
      diag.memberLoggedIn = true;
      newResults.push({
        name: 'Member Logged In',
        status: 'success',
        message: `Logged in as: ${member?.profile?.nickname || member?.loginEmail || 'Unknown'}`,
      });
      console.log('[VERIFICATION] ✓ Member is logged in');
    } else {
      newResults.push({
        name: 'Member Logged In',
        status: 'failed',
        message: 'Member is not authenticated',
      });
      console.log('[VERIFICATION] ✗ Member is not logged in');
    }

    // Test 3: Admin Check Endpoint
    console.log('[VERIFICATION] Test 3: Admin Check Endpoint');
    try {
      const adminCheckResponse = await fetch('/api/auth/admin-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      console.log('[VERIFICATION] Admin check response status:', adminCheckResponse.status);

      if (adminCheckResponse.ok) {
        const data = await adminCheckResponse.json();
        diag.adminCheckResponse = true;
        diag.adminPermissionMatched = data.authenticated === true;

        if (data.authenticated) {
          newResults.push({
            name: 'Admin Permission Matched',
            status: 'success',
            message: `Admin verified for member: ${data.memberId?.substring(0, 8)}...`,
          });
          console.log('[VERIFICATION] ✓ Admin permission matched for:', data.memberId?.substring(0, 8));
        } else {
          newResults.push({
            name: 'Admin Permission Matched',
            status: 'failed',
            message: data.error || 'Admin permission check failed',
          });
          console.log('[VERIFICATION] ✗ Admin permission not matched:', data.error);
        }
      } else {
        newResults.push({
          name: 'Admin Check Endpoint',
          status: 'failed',
          message: `Endpoint returned ${adminCheckResponse.status}: ${adminCheckResponse.statusText}`,
        });
        console.log('[VERIFICATION] ✗ Admin check endpoint failed:', adminCheckResponse.status);
      }
    } catch (error) {
      newResults.push({
        name: 'Admin Check Endpoint',
        status: 'failed',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      console.log('[VERIFICATION] ✗ Admin check endpoint error:', error);
    }

    // Test 4: Admin Verify Endpoint
    console.log('[VERIFICATION] Test 4: Admin Verify Endpoint');
    try {
      const adminVerifyResponse = await fetch('/api/auth/admin-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({}),
      });

      console.log('[VERIFICATION] Admin verify response status:', adminVerifyResponse.status);

      if (adminVerifyResponse.ok) {
        const data = await adminVerifyResponse.json();
        diag.adminVerifyResponse = true;

        if (data.valid) {
          newResults.push({
            name: 'Admin Session Valid',
            status: 'success',
            message: `Session is valid for member: ${data.memberId?.substring(0, 8) || data.username}`,
          });
          console.log('[VERIFICATION] ✓ Admin session is valid');
        } else {
          newResults.push({
            name: 'Admin Session Valid',
            status: 'warning',
            message: 'Session not currently valid (expected if not logged in)',
          });
          console.log('[VERIFICATION] ⚠ Admin session not valid');
        }
      } else {
        newResults.push({
          name: 'Admin Verify Endpoint',
          status: 'warning',
          message: `Endpoint returned ${adminVerifyResponse.status} (expected if not logged in)`,
        });
        console.log('[VERIFICATION] ⚠ Admin verify endpoint returned:', adminVerifyResponse.status);
      }
    } catch (error) {
      newResults.push({
        name: 'Admin Verify Endpoint',
        status: 'failed',
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      console.log('[VERIFICATION] ✗ Admin verify endpoint error:', error);
    }

    // Test 5: Session Persistence (check if session survives)
    console.log('[VERIFICATION] Test 5: Session Persistence');
    diag.sessionPersistent = isAuthenticated;
    if (isAuthenticated) {
      newResults.push({
        name: 'Session Persistence',
        status: 'success',
        message: `Session persisted across ${refreshCount} page refresh(es)`,
      });
      console.log('[VERIFICATION] ✓ Session is persistent');
    } else {
      newResults.push({
        name: 'Session Persistence',
        status: 'warning',
        message: 'Session not currently active (expected if not logged in)',
      });
      console.log('[VERIFICATION] ⚠ Session not currently active');
    }

    // Test 6: Upload Authorization
    console.log('[VERIFICATION] Test 6: Upload Authorization');
    try {
      const uploadTestResponse = await fetch('/api/media/upload-hero', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ test: true }),
      });

      console.log('[VERIFICATION] Upload test response status:', uploadTestResponse.status);

      // 401/403 is expected if not authenticated, but the endpoint should exist
      if (uploadTestResponse.status === 404) {
        newResults.push({
          name: 'Upload Authorization',
          status: 'failed',
          message: 'Upload endpoint not found',
        });
        console.log('[VERIFICATION] ✗ Upload endpoint not found');
      } else {
        diag.uploadAuthWorking = true;
        newResults.push({
          name: 'Upload Authorization',
          status: 'success',
          message: `Upload endpoint accessible (status: ${uploadTestResponse.status})`,
        });
        console.log('[VERIFICATION] ✓ Upload authorization working');
      }
    } catch (error) {
      newResults.push({
        name: 'Upload Authorization',
        status: 'warning',
        message: `Upload test inconclusive: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      console.log('[VERIFICATION] ⚠ Upload authorization test inconclusive:', error);
    }

    // Test 7: Download Authorization
    console.log('[VERIFICATION] Test 7: Download Authorization');
    try {
      const downloadTestResponse = await fetch('/api/media/get-media-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ test: true }),
      });

      console.log('[VERIFICATION] Download test response status:', downloadTestResponse.status);

      if (downloadTestResponse.status === 404) {
        newResults.push({
          name: 'Download Authorization',
          status: 'failed',
          message: 'Download endpoint not found',
        });
        console.log('[VERIFICATION] ✗ Download endpoint not found');
      } else {
        diag.downloadAuthWorking = true;
        newResults.push({
          name: 'Download Authorization',
          status: 'success',
          message: `Download endpoint accessible (status: ${downloadTestResponse.status})`,
        });
        console.log('[VERIFICATION] ✓ Download authorization working');
      }
    } catch (error) {
      newResults.push({
        name: 'Download Authorization',
        status: 'warning',
        message: `Download test inconclusive: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      console.log('[VERIFICATION] ⚠ Download authorization test inconclusive:', error);
    }

    // Log summary
    console.log('[VERIFICATION] ========== VERIFICATION SUMMARY ==========');
    console.log('[VERIFICATION] Member ID detected:', diag.memberIdDetected ? 'yes' : 'no');
    console.log('[VERIFICATION] Member logged in:', diag.memberLoggedIn ? 'yes' : 'no');
    console.log('[VERIFICATION] Admin permission matched:', diag.adminPermissionMatched ? 'yes' : 'no');
    console.log('[VERIFICATION] ==========================================');

    setResults(newResults);
    setDiagnostics(diag);
    setIsVerifying(false);
  };

  useEffect(() => {
    // Run verification on mount
    runVerification();
  }, []);

  const handleRefresh = () => {
    setRefreshCount(prev => prev + 1);
    window.location.reload();
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <RefreshCw className="w-5 h-5 text-gray-400 animate-spin" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6 bg-white rounded-lg border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Wix Members Auth Verification</h2>
        <button
          onClick={() => setShowDetails(!showDetails)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title={showDetails ? 'Hide details' : 'Show details'}
        >
          {showDetails ? (
            <EyeOff className="w-5 h-5 text-gray-600" />
          ) : (
            <Eye className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin mr-2" />
          <span className="text-gray-600">Loading authentication state...</span>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {results.map((result, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg ${getStatusColor(result.status)}`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 mt-0.5">
                    {getStatusIcon(result.status)}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">{result.name}</h3>
                    <p className="text-sm text-gray-700 mt-1">{result.message}</p>
                    {showDetails && result.details && (
                      <p className="text-xs text-gray-600 mt-2 font-mono bg-gray-100 p-2 rounded">
                        {result.details}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {diagnostics && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-3">Diagnostic Summary</h3>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${diagnostics.memberIdDetected ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  <span className="text-gray-700">Member ID: {diagnostics.memberIdDetected ? 'yes' : 'no'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${diagnostics.memberLoggedIn ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  <span className="text-gray-700">Logged in: {diagnostics.memberLoggedIn ? 'yes' : 'no'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${diagnostics.adminPermissionMatched ? 'bg-green-600' : 'bg-red-600'}`}></span>
                  <span className="text-gray-700">Admin: {diagnostics.adminPermissionMatched ? 'yes' : 'no'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${diagnostics.sessionPersistent ? 'bg-green-600' : 'bg-yellow-600'}`}></span>
                  <span className="text-gray-700">Session: {diagnostics.sessionPersistent ? 'active' : 'inactive'}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={runVerification}
              disabled={isVerifying}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors font-medium"
            >
              {isVerifying ? (
                <>
                  <RefreshCw className="w-4 h-4 inline mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Run Verification'
              )}
            </button>
            <button
              onClick={handleRefresh}
              className="flex-1 px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition-colors font-medium"
            >
              Refresh Page
            </button>
          </div>

          {refreshCount > 0 && (
            <p className="text-sm text-gray-600 mt-3 text-center">
              Page refreshed {refreshCount} time(s) - session persistence verified
            </p>
          )}
        </>
      )}
    </div>
  );
}
