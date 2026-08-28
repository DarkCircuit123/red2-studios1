import { useEffect, useState } from 'react';

export default function SplashDiagnostics() {
  const [diagnostics, setDiagnostics] = useState<string[]>([]);

  useEffect(() => {
    const logs: string[] = [];

    // Log initial state
    logs.push(`[DIAG] Component mounted at ${new Date().toISOString()}`);
    logs.push(`[DIAG] sessionStorage.splashScreenShown: ${sessionStorage.getItem('splashScreenShown')}`);

    // Test API endpoint
    const testAPI = async () => {
      try {
        logs.push('[DIAG] Testing API endpoint...');
        const response = await fetch('/api/cms/get-splashpage');
        logs.push(`[DIAG] API response status: ${response.status}`);
        
        if (response.ok) {
          const data = await response.json();
          logs.push(`[DIAG] API returned ${data.items?.length || 0} items`);
          if (data.items?.length > 0) {
            logs.push(`[DIAG] First item has logoImage: ${!!data.items[0].logoImage}`);
          }
        }
      } catch (err) {
        logs.push(`[DIAG] API error: ${err instanceof Error ? err.message : String(err)}`);
      }

      setDiagnostics([...logs]);
    };

    testAPI();

    // Log to console as well
    logs.forEach(log => console.log(log));
  }, []);

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#1a1a1a',
        color: '#00ff00',
        padding: '15px',
        borderRadius: '8px',
        fontSize: '12px',
        fontFamily: 'monospace',
        maxWidth: '400px',
        maxHeight: '300px',
        overflow: 'auto',
        zIndex: 99998,
        border: '1px solid #00ff00',
      }}
    >
      <div style={{ marginBottom: '10px', fontWeight: 'bold' }}>Splash Diagnostics:</div>
      {diagnostics.map((log, i) => (
        <div key={i}>{log}</div>
      ))}
    </div>
  );
}
