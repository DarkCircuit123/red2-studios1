import React, { useEffect, useState } from 'react';

interface DiagnosticState {
  logs: string[];
  errors: string[];
  isReady: boolean;
}

class DiagnosticErrorBoundary extends React.Component<
  { children: React.ReactNode },
  DiagnosticState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { logs: [], errors: [], isReady: false };
    
    // Intercept console methods
    const originalLog = console.log;
    const originalError = console.error;
    const originalWarn = console.warn;

    console.log = (...args: any[]) => {
      originalLog(...args);
      this.setState(prev => ({
        logs: [...prev.logs, `[LOG] ${args.map(a => String(a)).join(' ')}`].slice(-50)
      }));
    };

    console.error = (...args: any[]) => {
      originalError(...args);
      this.setState(prev => ({
        errors: [...prev.errors, `[ERROR] ${args.map(a => String(a)).join(' ')}`].slice(-50)
      }));
    };

    console.warn = (...args: any[]) => {
      originalWarn(...args);
      this.setState(prev => ({
        logs: [...prev.logs, `[WARN] ${args.map(a => String(a)).join(' ')}`].slice(-50)
      }));
    };
  }

  static getDerivedStateFromError(error: Error) {
    return {
      errors: [`[FATAL] ${error.message}`],
      isReady: false
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[DiagnosticWrapper] Caught error:', error, errorInfo);
  }

  render() {
    if (this.state.errors.length > 0 && !this.state.isReady) {
      return (
        <div style={{
          minHeight: '100vh',
          backgroundColor: '#000',
          color: '#fff',
          padding: '40px',
          fontFamily: 'monospace',
          overflow: 'auto'
        }}>
          <h1 style={{ color: '#ff0000', marginBottom: '20px' }}>🔴 DIAGNOSTIC MODE</h1>
          
          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#ff6666' }}>Errors ({this.state.errors.length}):</h2>
            <div style={{ backgroundColor: '#1a0000', padding: '15px', borderRadius: '4px', maxHeight: '300px', overflow: 'auto' }}>
              {this.state.errors.map((err, i) => (
                <div key={i} style={{ color: '#ff9999', marginBottom: '8px', fontSize: '12px' }}>
                  {err}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '30px' }}>
            <h2 style={{ color: '#66ff66' }}>Recent Logs ({this.state.logs.length}):</h2>
            <div style={{ backgroundColor: '#001a00', padding: '15px', borderRadius: '4px', maxHeight: '300px', overflow: 'auto' }}>
              {this.state.logs.map((log, i) => (
                <div key={i} style={{ color: '#99ff99', marginBottom: '4px', fontSize: '11px' }}>
                  {log}
                </div>
              ))}
            </div>
          </div>

          <div style={{ backgroundColor: '#1a1a1a', padding: '15px', borderRadius: '4px', marginTop: '20px' }}>
            <h3 style={{ color: '#ffff00', marginBottom: '10px' }}>System Info:</h3>
            <div style={{ fontSize: '12px', color: '#cccccc' }}>
              <p>URL: {window.location.href}</p>
              <p>User Agent: {navigator.userAgent}</p>
              <p>Timestamp: {new Date().toISOString()}</p>
            </div>
          </div>

          <button 
            onClick={() => window.location.reload()}
            style={{
              marginTop: '20px',
              padding: '10px 20px',
              backgroundColor: '#6F0809',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            Reload Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DiagnosticErrorBoundary;
