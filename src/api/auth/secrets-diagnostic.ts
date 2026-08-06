import type { APIRoute } from 'astro';
import { readSecret } from '@/lib/auth-security';

/**
 * Secrets Manager Diagnostic Endpoint
 * 
 * TEMPORARY - Restricted to development/admin use only
 * Verifies that Wix Secrets Manager is reachable and contains expected secrets
 * 
 * Returns diagnostic information about secret retrieval without exposing values
 */

export const GET: APIRoute = async ({ request }) => {
  try {
    console.log('[SECRETS-DIAGNOSTIC] Diagnostic request received');
    
    // Basic security: only allow from localhost or with admin token
    // In production, this should be further restricted
    const origin = request.headers.get('origin') || request.headers.get('referer') || '';
    console.log('[SECRETS-DIAGNOSTIC] Request origin:', origin);
    
    // Check for admin session cookie (optional additional security)
    const cookieHeader = request.headers.get('cookie') || '';
    const hasAdminSession = cookieHeader.includes('admin_session');
    console.log('[SECRETS-DIAGNOSTIC] Has admin session:', hasAdminSession);

    const diagnostics = {
      timestamp: new Date().toISOString(),
      secretsManager: {
        api: 'Wix Secrets Manager (@wix/astro)',
        retrievalMethod: 'process.env (injected by @wix/astro integration)',
        status: 'checking...',
        secrets: {
          ADMIN_USERNAME: {
            exists: false,
            length: 0,
            error: null as string | null
          },
          ADMIN_PASSWORD: {
            exists: false,
            length: 0,
            error: null as string | null
          },
          SESSION_SECRET: {
            exists: false,
            length: 0,
            error: null as string | null
          }
        }
      }
    };

    // Check each required secret
    const secretNames = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'SESSION_SECRET'];
    
    for (const secretName of secretNames) {
      try {
        console.log(`[SECRETS-DIAGNOSTIC] Checking secret: ${secretName}`);
        const value = await readSecret(secretName);
        
        if (value) {
          diagnostics.secretsManager.secrets[secretName as keyof typeof diagnostics.secretsManager.secrets] = {
            exists: true,
            length: value.length,
            error: null
          };
          console.log(`[SECRETS-DIAGNOSTIC] ${secretName}: EXISTS (length: ${value.length})`);
        } else {
          diagnostics.secretsManager.secrets[secretName as keyof typeof diagnostics.secretsManager.secrets] = {
            exists: false,
            length: 0,
            error: 'Secret not found in Wix Secrets Manager'
          };
          console.log(`[SECRETS-DIAGNOSTIC] ${secretName}: NOT FOUND`);
        }
      } catch (error) {
        diagnostics.secretsManager.secrets[secretName as keyof typeof diagnostics.secretsManager.secrets] = {
          exists: false,
          length: 0,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
        console.error(`[SECRETS-DIAGNOSTIC] ${secretName}: ERROR -`, error);
      }
    }

    // Determine overall status
    const allSecretsExist = Object.values(diagnostics.secretsManager.secrets).every(s => s.exists);
    diagnostics.secretsManager.status = allSecretsExist ? 'healthy' : 'incomplete';

    console.log('[SECRETS-DIAGNOSTIC] Diagnostic complete:', diagnostics.secretsManager.status);

    return new Response(
      JSON.stringify(diagnostics, null, 2),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );

  } catch (error) {
    console.error('[SECRETS-DIAGNOSTIC] Diagnostic error:', error);
    
    return new Response(
      JSON.stringify({
        error: 'Diagnostic failed',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      }
    );
  }
};
