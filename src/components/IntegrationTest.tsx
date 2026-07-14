import { useEffect, useState } from 'react';

export default function IntegrationTest() {
  const [status, setStatus] = useState<{
    memberProvider: string;
    baseCrudService: string;
    error?: string;
  }>({
    memberProvider: 'testing...',
    baseCrudService: 'testing...',
  });

  useEffect(() => {
    const testImports = async () => {
      try {
        console.log('[IntegrationTest] Starting import tests...');
        
        // Test 1: MemberProvider
        try {
          const memberModule = await import('@/integrations');
          if (memberModule.MemberProvider) {
            console.log('[IntegrationTest] ✓ MemberProvider found');
            setStatus(prev => ({ ...prev, memberProvider: '✓ OK' }));
          } else {
            console.error('[IntegrationTest] ✗ MemberProvider not found in module');
            setStatus(prev => ({ ...prev, memberProvider: '✗ NOT FOUND' }));
          }
        } catch (e) {
          console.error('[IntegrationTest] Failed to import MemberProvider:', e);
          setStatus(prev => ({ ...prev, memberProvider: `✗ ERROR: ${String(e)}` }));
        }

        // Test 2: BaseCrudService
        try {
          const crudModule = await import('@/integrations');
          if (crudModule.BaseCrudService) {
            console.log('[IntegrationTest] ✓ BaseCrudService found');
            setStatus(prev => ({ ...prev, baseCrudService: '✓ OK' }));
          } else {
            console.error('[IntegrationTest] ✗ BaseCrudService not found in module');
            setStatus(prev => ({ ...prev, baseCrudService: '✗ NOT FOUND' }));
          }
        } catch (e) {
          console.error('[IntegrationTest] Failed to import BaseCrudService:', e);
          setStatus(prev => ({ ...prev, baseCrudService: `✗ ERROR: ${String(e)}` }));
        }
      } catch (error) {
        console.error('[IntegrationTest] Unexpected error:', error);
        setStatus(prev => ({ ...prev, error: String(error) }));
      }
    };

    testImports();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      right: '20px',
      backgroundColor: '#1a1a1a',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '12px',
      fontFamily: 'monospace',
      zIndex: 9999,
      border: '1px solid #6F0809',
      maxWidth: '300px'
    }}>
      <div style={{ marginBottom: '8px', fontWeight: 'bold', color: '#6F0809' }}>Integration Test</div>
      <div>MemberProvider: {status.memberProvider}</div>
      <div>BaseCrudService: {status.baseCrudService}</div>
      {status.error && <div style={{ color: '#ff6666', marginTop: '8px' }}>Error: {status.error}</div>}
    </div>
  );
}
